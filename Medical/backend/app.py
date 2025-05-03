from dotenv import load_dotenv
load_dotenv()
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os
import sys
import json
import time
import logging
import datetime
import praw
import prawcore.exceptions
from typing import List, Dict, Any, Optional, Tuple
from functools import lru_cache
from sentence_transformers import SentenceTransformer
from weaviate import Client
from weaviate.auth import AuthApiKey
import random

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("health_app.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("health_app")

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize Weaviate client
weaviate_url = os.environ.get('WEAVIATE_URL', "https://hbuwdzekqiyn5xieverkyq.c0.asia-southeast1.gcp.weaviate.cloud")
weaviate_api_key = os.environ.get('WEAVIATE_API_KEY', "y7dMKERfOkGXHjkidDp8ytltYW6f82ddKvMT")
client = Client(
    url=weaviate_url,
    auth_client_secret=AuthApiKey(api_key=weaviate_api_key)
)

# Initialize sentence model
logger.info("Loading sentence model...")
try:
    sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
    logger.info("Model loaded successfully")
except Exception as e:
    logger.error(f"Error loading model: {e}")
    sentence_model = None
    sys.exit(1)

# Metrics tracking
metrics = {
    "successful_searches": 0,
    "failed_searches": 0,
    "subreddits_searched": 0,
    "posts_retrieved": 0,
    "cache_hits": 0,
    "api_errors": 0,
    "search_duration": []
}

# Track inaccessible subreddits
inaccessible_subreddits = set()

# Vector search functions
def get_embedding(text: str, model: SentenceTransformer) -> List[float]:
    """Get embedding for a text using the sentence transformer model."""
    try:
        return model.encode(text).tolist()
    except Exception as e:
        logger.error(f"Error generating embedding for text '{text}': {e}")
        raise

@lru_cache(maxsize=1000)
def compare_claims(claim: str, client: Client, sentence_model: SentenceTransformer, class_name: str = "MedicalFact", verbose: bool = False) -> Tuple[str, float, float, float]:
    """Compare a claim with facts in the Weaviate database."""
    try:
        if not sentence_model:
            logger.error("Sentence model not loaded")
            return "error", 0.0, 0.0, 1.0

        logger.info("Processing claim: %s", claim)
        claim_embedding = get_embedding(claim, sentence_model)
        logger.info("Claim embedding generated, length: %s", len(claim_embedding))

        # Query Weaviate with distance metric for better confidence scoring
        response = client.query.get(
            class_name,
            ["fact", "is_true", "category"]
        ).with_near_vector({
            "vector": claim_embedding
        }).with_limit(5).with_additional(["distance"]).do()

        logger.info("Weaviate response: %s", json.dumps(response, indent=2))
        results = response.get('data', {}).get('Get', {}).get(class_name, [])
        logger.info("Found %s results", len(results))

        if not results:
            logger.info("No similar facts found")
            return "not_known", 0.1, 0.1, 0.8

        # Calculate true/false counts and average distance
        true_count = 0
        false_count = 0
        total_distance = 0
        for result in results:
            is_true = result.get('is_true')
            distance = result.get('_additional', {}).get('distance', 1.0)
            total_distance += distance
            if is_true is True:
                true_count += 1
            elif is_true is False:
                false_count += 1

        unknown_count = len(results) - true_count - false_count
        avg_distance = total_distance / len(results) if results else 1.0
        logger.info("True: %s, False: %s, Unknown: %s, Avg Distance: %s", true_count, false_count, unknown_count, avg_distance)

        # Adjust confidence based on counts and distance
        if true_count > false_count:
            prediction = "true"
            true_confidence = 0.7 + (true_count / len(results) * 0.2) - (avg_distance * 0.1)
            false_confidence = 0.2 - (true_count / len(results) * 0.1) + (avg_distance * 0.05)
            not_known_confidence = 0.1
        elif false_count > true_count:
            prediction = "false"
            false_confidence = 0.7 + (false_count / len(results) * 0.2) - (avg_distance * 0.1)
            true_confidence = 0.2 - (false_count / len(results) * 0.1) + (avg_distance * 0.05)
            not_known_confidence = 0.1
        else:
            prediction = "not_known"
            not_known_confidence = 0.7 + (avg_distance * 0.1)
            true_confidence = 0.15 - (avg_distance * 0.05)
            false_confidence = 0.15 - (avg_distance * 0.05)

        # Ensure confidences sum to 1 and are non-negative
        total = true_confidence + false_confidence + not_known_confidence
        true_confidence = max(0, true_confidence / total)
        false_confidence = max(0, false_confidence / total)
        not_known_confidence = max(0, not_known_confidence / total)

        if verbose:
            logger.info(f"Prediction: {prediction}, True: {true_confidence:.3f}, False: {false_confidence:.3f}, Not Known: {not_known_confidence:.3f}")

        return prediction, true_confidence, false_confidence, not_known_confidence

    except Exception as e:
        logger.error(f"Error in compare_claims: {e}")
        return "error", 0.0, 0.0, 1.0

def populate_medical_facts():
    """Populate Weaviate with sample medical facts if the MedicalFact class is empty."""
    try:
        # Check if MedicalFact class has data
        result = client.query.get("MedicalFact", ["fact"]).with_limit(1).do()
        facts = result.get('data', {}).get('Get', {}).get('MedicalFact', [])
        if facts:
            logger.info("MedicalFact class already contains data")
            return

        # Sample facts
        sample_facts = [
            {"fact": "Vaccines cause autism", "is_true": False, "category": "Vaccines"},
            {"fact": "Exercise improves mental health", "is_true": True, "category": "Mental Health"},
            {"fact": "Drinking bleach cures COVID-19", "is_true": False, "category": "COVID-19"},
            {"fact": "A balanced diet supports immune function", "is_true": True, "category": "Nutrition"},
            {"fact": "5G causes cancer", "is_true": False, "category": "Medical Conspiracies"},
        ]

        for fact in sample_facts:
            embedding = get_embedding(fact["fact"], sentence_model)
            client.data_object.create(
                data_object=fact,
                class_name="MedicalFact",
                vector=embedding
            )
        logger.info("Populated %s sample medical facts", len(sample_facts))
    except Exception as e:
        logger.error(f"Error populating medical facts: {e}")

# Configuration for the Reddit PRAW API
def initialize_reddit():
    """Initialize and return a Reddit PRAW instance using environment variables."""
    try:
        client_id = os.environ.get('REDDIT_CLIENT_ID')
        client_secret = os.environ.get('REDDIT_CLIENT_SECRET')
        username = os.environ.get('REDDIT_USERNAME')
        password = os.environ.get('REDDIT_PASSWORD')
        user_agent = os.environ.get('REDDIT_USER_AGENT', 'python:HealthMisinformationTracker:v1.0 (by /u/Spare-Gate9133)')
        
        if not all([client_id, client_secret, user_agent]):
            logger.warning("Missing Reddit API configuration. Using fallback data.")
            return None
        
        reddit = praw.Reddit(
            client_id=client_id,
            client_secret=client_secret,
            username=username,
            password=password,
            user_agent=user_agent
        )
        
        _ = reddit.user.me()
        logger.info("Reddit API connection successful")
        return reddit
    except Exception as e:
        logger.error(f"Error initializing Reddit API: {e}")
        return None

# Function to handle Reddit API calls with rate limiting
def make_reddit_api_call(api_call, max_retries=5, initial_delay=5):
    """Execute a Reddit API call with retry logic for rate limiting."""
    for attempt in range(max_retries):
        try:
            return api_call()
        except prawcore.exceptions.RequestException as e:
            if isinstance(e, prawcore.exceptions.TooManyRequests):
                delay = initial_delay * (2 ** attempt) + random.uniform(0, 1)  # Exponential backoff with jitter
                logger.warning(f"Rate limit hit, retrying after {delay:.2f} seconds...")
                time.sleep(delay)
            else:
                metrics["api_errors"] += 1
                raise
    metrics["api_errors"] += 1
    raise Exception("Max retries exceeded for Reddit API call")

# Function to fetch posts related to health misinformation
def fetch_health_misinformation_posts(time_filter: str = 'week') -> List[Dict[str, Any]]:
    """Use provided Reddit posts instead of searching Reddit."""
    start_time = time.time()
    try:
        # Provided Reddit posts
        provided_posts = [
            {
                "username": "ra561013",
                "subreddit": "r/UlcerativeColitis",
                "title": "Natural treatment?",
                "content": "Hi, 27 (F) just got diagnosed 3 months ago after about a year of bleeding. Started seeing naturopathic doctor because I am scared of western medicine and can’t wrap my mind around this not being caused by an imbalance or infection. \n\nStarted on VSL #3 probiotics for UC, butyrate, GI Complete, and Fibermend supplements. Had bleeding go away for about a month but it’s back again and worse. She now wants me to take food sensitivity testing. I have cut out gluten and lactose to see if it will help, it hasn’t.\n\nGoing in for another scope soon, but I know it’s not going to look good. Does anybody have experience with trying the natural ways? Has anybody had success? \n\nAlso, how do you explain this to work people when it doesn’t look or sound like you have issues?\n\n\nEdit: thank you all so much for the responses, and tough love in a sense. I think it’s helped me come to terms in a way and I decided I will do both medicine routes because I realize now how serious this is. It’s scary but I can’t describe how thankful I am for all of your time in responding.",
                "score": 0,
                "comments": 52,
                "awards": 0,
                "engagementScore": 104.0,
                "permalink": "/r/UlcerativeColitis/comments/18bt1nc/natural_treatment/",
                "isFalse": true,
                "category": "Natural Remedy Exaggeration",
                "evidence": "While some natural substances have medicinal properties, claims of curing serious conditions often lack scientific support.",
                "scientific_evidence": "Ulcerative colitis is a chronic autoimmune condition requiring medical management, such as anti-inflammatory drugs or immunosuppressants. Probiotics and dietary changes may support symptom management but lack evidence for curing UC. Studies (e.g., PubMed) show no consistent benefit from probiotics like VSL#3 or supplements like butyrate in achieving remission.",
                "created_at": "2023-12-06T07:34:36",
                "false_confidence": 0.85,
                "true_confidence": 0.10,
                "not_known_confidence": 0.05
            },
            {
                "username": "Raoul27",
                "subreddit": "r/neuropathy",
                "title": "Is there any natural treatment for neuropathy? Oils, plants, herbal tea?",
                "content": "Is there any natural treatment for neuropathy? Oils, plants, CBD, tea?",
                "score": 19,
                "comments": 21,
                "awards": 0,
                "engagementScore": 61.0,
                "permalink": "/r/neuropathy/comments/1j76xgl/is_there_any_natural_treatment_for_neuropathy/",
                "isFalse": true,
                "category": "Natural Remedy Exaggeration",
                "evidence": "While some natural substances have medicinal properties, claims of curing serious conditions often lack scientific support.",
                "scientific_evidence": "Neuropathy, often caused by diabetes, injury, or other conditions, typically requires medical treatments like anticonvulsants or antidepressants. Natural remedies such as CBD or herbal teas lack robust clinical evidence for curing neuropathy. Limited studies suggest CBD may alleviate pain but not reverse nerve damage (Journal of Pain Research).",
                "created_at": "2025-03-09T18:18:31",
                "false_confidence": 0.85,
                "true_confidence": 0.10,
                "not_known_confidence": 0.05
            },
            {
                "username": "cancerthrowmeaway",
                "subreddit": "r/offmychest",
                "title": "I’m glad I have cancer.",
                "content": "I was diagnosed in early December with a rare form of breast cancer, Inflammatory Breast Cancer. Stage 4 de novo. It’s like regular breast cancer, but significantly more aggressive and a lot worse. I was diagnosed 9 days before my birthday and a week and a half after losing my job. It’s just been shit luck after shit luck since then.\n\nI have a small group of people in my life who love me and support me however they can. My finances are in the toilet and I’ll probably have to file for bankruptcy soon, even after having qualified for federal disability payments due to being diagnosed with a disorder that is guaranteed to end in death (their words, not mine). My life is just stressor after stressor after stressor.\n\nI’ve completed over 20 rounds of IV chemo and look like a gremlin as a result. No hair, my fingernails and toenails are horrific, and of course none of that glamorous Hollywood cancer weight loss—try weight gain. And a lot of it. It sucks. Now I’m supposed to take pills and eventually have a mastectomy and maybe have my ovaries out too, and along the way probably once or twice need my lungs drained of fluid, hope upon hope that my many many tumors don’t infiltrate my brain too, and eventually in about 4-5 years I’ll kick the bucket.\n\nThe real off my chest bit here is that I wish it would just happen faster. Cancer is the most tedious, brutally painful, absolute slowest marathon and I am just done with it.\n\nI have an appointment with my oncologist next week and I’m going to ask about hospice. How close to deaths door do I need to be to quality. When can I just say, enough is enough. I used to have things I looked forward to, things I wouldn’t want to miss if I were dead, but I don’t have any of that anymore. I just want it to be over. I’m sick of the endless financial stress and the endless cancer aches and pains and the endless infusions and appointments and hospitalizations. I’m just done with it all.\n\nAnd now I’m going to tell you my greatest secret ever. I’ve already stopped taking my cancer meds. I throw them out instead of taking them. Because I WANT my tumors to grow, I want the blood clots in my lungs to grow, I want it all to get worse so I can finally just enter hospice and be done with it. I’m so tired.\n\nAnd I’m only 34.",
                "score": 3178,
                "comments": 203,
                "awards": 0,
                "engagementScore": 3584.0,
                "permalink": "/r/offmychest/comments/1f4pmdd/im_glad_i_have_cancer/",
                "isFalse": true,
                "category": "General Health",
                "evidence": "This post doesn't contain common misinformation markers.",
                "scientific_evidence": "Stopping prescribed cancer treatments, such as chemotherapy or targeted therapies, can accelerate disease progression and reduce survival rates. Clinical guidelines (e.g., NCCN) emphasize adherence to treatment plans for inflammatory breast cancer to manage symptoms and extend life. Psychological support and palliative care can address distress without abandoning treatment.",
                "created_at": "2024-08-30T13:19:37",
                "false_confidence": 0.90,
                "true_confidence": 0.05,
                "not_known_confidence": 0.05
            },
            {
                "username": "amdtek",
                "subreddit": "r/rheumatoid",
                "title": "Natural Herbs & Rheumatoid Arthritis",
                "content": "I heard natural herbs like turmeric and ginger will curb the inflammation arising in rheumatoid arthritis. Does that further translate to curing it if they are consumed regularly in high dose regularly?\n\nSecond question is, can these herbs cure the deformities occuring due to this?\n\nI have zero pain but has to live with the deformities in my hands and toes, something which I'd like to find a cure for.",
                "score": 0,
                "comments": 16,
                "awards": 0,
                "engagementScore": 32.0,
                "permalink": "/r/rheumatoid/comments/1gwsddh/natural_herbs_rheumatoid_arthritis/",
                "isFalse": true,
                "category": "General Health",
                "evidence": "This post doesn't contain common misinformation markers.",
                "scientific_evidence": "Rheumatoid arthritis is a chronic autoimmune disease requiring DMARDs or biologics to manage progression. Turmeric and ginger may have anti-inflammatory effects, but clinical trials (e.g., Arthritis Research & Therapy) show they cannot cure RA or reverse joint deformities, which result from irreversible cartilage and bone damage.",
                "created_at": "2024-11-22T04:03:45",
                "false_confidence": 0.85,
                "true_confidence": 0.10,
                "not_known_confidence": 0.05
            },
            {
                "username": "BiggieTwiggy1two3",
                "subreddit": "r/Health",
                "title": "Wisconsin Man Who’s Spent Years Letting Deadly Snakes Bite Him May Have Unlocked The Ultimate Antivenom",
                "content": "",
                "score": 18,
                "comments": 2,
                "awards": 0,
                "engagementScore": 22.0,
                "permalink": "/r/Health/comments/1kd802u/wisconsin_man_whos_spent_years_letting_deadly/",
                "isFalse": true,
                "category": "General Health",
                "evidence": "This post doesn't contain common misinformation markers.",
                "scientific_evidence": "Antivenom is developed through controlled immunization of animals with venom, not by humans repeatedly enduring snake bites. Such practices are dangerous and lack scientific support for producing effective antivenom (World Health Organization guidelines on snakebite management).",
                "created_at": "2025-05-02T23:51:42",
                "false_confidence": 0.85,
                "true_confidence": 0.10,
                "not_known_confidence": 0.05
            },
            {
                "username": "Fangydangymangy",
                "subreddit": "r/keratosis",
                "title": "Remedy skin",
                "content": "Has anyone tried remedy skin’s body bump lotion? I’m a bit skeptical about how well it works since it’s only 10% urea but it does have retinol.",
                "score": 2,
                "comments": 3,
                "awards": 0,
                "engagementScore": 8.0,
                "permalink": "/r/keratosis/comments/1h01le5/remedy_skin/",
                "isFalse": true,
                "category": "General Health",
                "evidence": "This post doesn't contain common misinformation markers.",
                "scientific_evidence": "Keratosis pilaris is managed with exfoliants like urea or prescription retinoids. Over-the-counter lotions with 10% urea may provide mild relief, but dermatological studies (e.g., Journal of the American Academy of Dermatology) recommend 20–40% urea or tretinoin for significant improvement.",
                "created_at": "2024-11-26T08:19:55",
                "false_confidence": 0.85,
                "true_confidence": 0.10,
                "not_known_confidence": 0.05
            }
        ]

        # Validate posts
        if not provided_posts:
            logger.warning("No posts provided, using fallback data.")
            metrics["failed_searches"] += 1
            return get_fallback_posts()

        # Process posts
        processed_posts = []
        for post in provided_posts:
            try:
                # Re-evaluate misinformation to ensure consistency
                content = post.get("content", "")
                potential_misinformation = contains_potential_misinformation(post["title"] + " " + content)
                
                engagement_score = post["score"] + (post["comments"] * 2) + (post["awards"] * 1.5)
                
                processed_post = {
                    "username": post["username"],
                    "subreddit": post["subreddit"],
                    "title": post["title"],
                    "content": content,
                    "score": post["score"],
                    "comments": post["comments"],
                    "awards": post["awards"],
                    "engagementScore": engagement_score,
                    "permalink": post["permalink"],
                    "isFalse": potential_misinformation["isLikelyFalse"],
                    "category": potential_misinformation.get("category", "General Health"),
                    "evidence": potential_misinformation["evidence"],
                    "created_at": post["created_at"],
                    "false_confidence": 0.85 + (0.15 * (engagement_score / 1000)),
                    "true_confidence": 0.15 - (0.05 * (engagement_score / 1000)),
                    "not_known_confidence": 0.05 - (0.01 * (engagement_score / 1000))
                }
                
                processed_posts.append(processed_post)
                metrics["posts_retrieved"] += 1
                logger.info(f"Processed post: {post['title']}")
            except Exception as e:
                logger.error(f"Error processing post {post.get('title', 'unknown')}: {e}")
                metrics["api_errors"] += 1
                continue

        # If no posts were processed, use fallback
        if not processed_posts:
            logger.warning("No posts processed, using fallback data.")
            metrics["failed_searches"] += 1
            return get_fallback_posts()

        # Sort by misinformation status and engagement
        processed_posts.sort(
            key=lambda x: (-1 if x["isFalse"] else 0, -x["engagementScore"])
        )

        top_posts = processed_posts[:15]  # Limit to 15 posts
        metrics["successful_searches"] += 1

        # Save to cache
        save_posts_to_file(top_posts, time_filter)

        duration = time.time() - start_time
        metrics["search_duration"].append(duration)
        logger.info(f"Fetch completed in {duration:.2f} seconds")

        return top_posts
    except Exception as e:
        logger.error(f'Error processing posts: {e}')
        metrics["failed_searches"] += 1
        return get_fallback_posts()

# Comprehensive misinformation detection logic
def contains_potential_misinformation(text: str) -> Dict[str, Any]:
    """Detect potential misinformation in text related to health topics."""
    misinformation_patterns = [
        # Cancer misinformation
        { 
            "category": "Cancer", 
            "terms": ['cure cancer', 'cures cancer', 'cancer cure', 'fight cancer naturally', 'alternative cancer', 'cancer treatment they', 'cancer fungus', 'baking soda cancer'],
            "evidence": 'Claims of simple cancer cures contradict established medical understanding that cancer is a complex group of diseases requiring various evidence-based treatments.'
        },
        # Vaccine misinformation
        {
            "category": "Vaccines",
            "terms": ['vaccine injury', 'vaccine damaged', 'vaccine danger', 'vaccines cause', 'microchip', '5g', 'government track', 'vaccine autism', 'vaccine mercury', 'heavy metals'],
            "evidence": 'Vaccines undergo rigorous safety testing. Claims linking vaccines to autism have been debunked by large-scale studies. Modern vaccines do not contain microchips.'
        },
        # Detox myths
        {
            "category": "Detox",
            "terms": ['detox', 'cleanse', 'toxin', 'flush toxins', 'body cleanse', 'clean your', 'rid your body', 'draw out toxins'],
            "evidence": 'The concept of "detoxing" is not medically recognized. The body has sophisticated detoxification systems through the liver and kidneys.'
        },
        # pH/alkaline misinformation
        {
            "category": "Alkaline Treatments",
            "terms": ['alkaline', 'alkalize', 'ph balance', 'acid environment', 'acidic body', 'alkaline diet', 'ph diet'],
            "evidence": 'Blood pH is tightly regulated. Consuming alkaline foods cannot significantly change blood pH, and disease states like cancer are not caused by body acidity.'
        },
        # Conspiracy theories
        {
            "category": "Medical Conspiracies",
            "terms": ['big pharma', 'what doctors don\'t', 'don\'t want you to know', 'suppressed cure', 'suppressed treatment', 'government hiding', 'medical establishment', 'doctors won\'t tell', 'conspiracy'],
            "evidence": 'Conspiracy theories about hidden cures contradict the open nature of scientific research and regulatory processes.'
        },
        # Miracle cures
        {
            "category": "Miracle Cures",
            "terms": ['miracle', 'cure all', 'magical', 'ancient secret', 'secret cure', 'one simple', 'this one trick', 'doctors hate', 'breakthrough they'],
            "evidence": 'Claims of "miracle cures" lack scientific evidence and exploit hope among vulnerable populations.'
        },
        # Natural remedies
        {
            "category": "Natural Remedy Exaggeration",
            "terms": ['natural cure', 'heal yourself', 'natural treatment', 'essential oil cure', 'herbal cure', 'ancient remedy', 'superfood cure'],
            "evidence": 'While some natural substances have medicinal properties, claims of curing serious conditions often lack scientific support.'
        },
        # COVID-19 misinformation
        {
            "category": "COVID-19",
            "terms": ['covid hoax', 'plandemic', 'covid conspiracy', 'coronavirus fake', 'fake virus', 'covid cure', 'covid prevention', 'prevents covid'],
            "evidence": 'COVID-19 is a well-documented viral disease caused by SARS-CoV-2, studied extensively worldwide.'
        },
        # Alternative medicine
        {
            "category": "Alternative Medicine Claims",
            "terms": ['homeopathy cure', 'alternative medicine cure', 'acupuncture cure', 'energy healing', 'quantum healing', 'vibrational medicine', 'frequency healing'],
            "evidence": 'Claims of curing serious diseases with alternative therapies often lack rigorous scientific evidence.'
        },
        # Supplements
        {
            "category": "Supplement Claims",
            "terms": ['vitamin c cure', 'megadose', 'vitamin d cure', 'zinc cure', 'supplement cure', 'boost immune system instantly', 'supercharge immunity'],
            "evidence": 'No supplement has been proven to prevent or cure serious diseases on its own. High doses can cause adverse effects.'
        },
        # Mental health
        {
            "category": "Mental Health",
            "terms": ['depression cure', 'anxiety cure', 'mental health miracle', 'natural depression', 'herbal anxiety', 'cure mental illness'],
            "evidence": 'Mental health conditions require evidence-based treatments like therapy and medication. Natural remedies may support but not cure.'
        },
        # Women's health
        {
            "category": "Women's Health",
            "terms": ['fertility cure', 'hormone cleanse', 'natural fertility', 'menopause cure', 'pcos cure'],
            "evidence": 'Women’s health conditions like PCOS or infertility require medical evaluation. Natural remedies alone are insufficient.'
        }
    ]
    
    lower_text = text.lower()
    
    for pattern in misinformation_patterns:
        for term in pattern["terms"]:
            if term in lower_text:
                return {
                    "isLikelyFalse": True,
                    "category": pattern["category"],
                    "evidence": pattern["evidence"]
                }
    
    word_pairs = [
        {"pair": ['cure', 'disease'], "distance": 10},
        {"pair": ['prevent', 'disease'], "distance": 10},
        {"pair": ['secret', 'treatment'], "distance": 15},
        {"pair": ['natural', 'cure'], "distance": 10},
        {"pair": ['alternative', 'treatment'], "distance": 10}
    ]
    
    words = lower_text.split()
    
    for pair_info in word_pairs:
        pair = pair_info["pair"]
        distance = pair_info["distance"]
        first_word_indices = []
        
        for index, word in enumerate(words):
            if pair[0] in word:
                first_word_indices.append(index)
        
        for index in first_word_indices:
            start_range = max(0, index - distance)
            end_range = min(len(words) - 1, index + distance)
            
            for i in range(start_range, end_range + 1):
                if pair[1] in words[i]:
                    return {
                        "isLikelyFalse": True,
                        "category": "Health Claims",
                        "evidence": "This post contains language patterns associated with medical misinformation."
                    }
    
    return {
        "isLikelyFalse": False,
        "evidence": "This post doesn't contain common misinformation markers."
    }

# Comprehensive fallback data
def get_fallback_posts() -> List[Dict[str, Any]]:
    """Return a list of fallback posts for when the API fails."""
    now = time.time()
    day_seconds = 24 * 60 * 60
    
    return [
        {
            "username": "HealthGuru42",
            "subreddit": "r/alternativehealth",
            "title": "Alkaline Diet CURED My Stage 4 Cancer",
            "content": "After doctors gave me 3 months, I started drinking lemon water with baking soda to alkalize my blood. Six months later, tumors gone!",
            "score": 427,
            "comments": 53,
            "awards": 2,
            "engagementScore": 535,
            "permalink": "/r/alternativehealth/comments/alkdiet",
            "created_at": datetime.datetime.fromtimestamp(now - 2*day_seconds).isoformat(),
            "isFalse": True,
            "category": "Alkaline Treatments",
            "evidence": "Blood pH is tightly regulated. Alkaline foods cannot change pH significantly.",
            "false_confidence": 0.93,
            "true_confidence": 0.02,
            "not_known_confidence": 0.05
        },
        {
            "username": "TruthWarrior2023",
            "subreddit": "r/conspiracy",
            "title": "COVID Vaccines Contain 5G Microchips",
            "content": "I work in biotech and confirm vaccines have nano-tracking devices activated by 5G towers. Wake up!",
            "score": 284,
            "comments": 124,
            "awards": 0,
            "engagementScore": 532,
            "permalink": "/r/conspiracy/comments/vaxmicro",
            "created_at": datetime.datetime.fromtimestamp(now - 1*day_seconds).isoformat(),
            "isFalse": True,
            "category": "Vaccines",
            "evidence": "Vaccines do not contain microchips. Components are well-documented.",
            "false_confidence": 0.98,
            "true_confidence": 0.01,
            "not_known_confidence": 0.01
        },
        {
            "username": "DetoxMaster",
            "subreddit": "r/naturalremedies",
            "title": "Onion Socks Pull Toxins Out While You Sleep",
            "content": "Onion slices in socks turn black overnight, pulling toxins out. My fatigue is gone!",
            "score": 541,
            "comments": 87, 
            "awards": 3,
            "engagementScore": 715,
            "permalink": "/r/naturalremedies/comments/onionsocks",
            "created_at": datetime.datetime.fromtimestamp(now - 3*day_seconds).isoformat(),
            "isFalse": True,
            "category": "Detox",
            "evidence": "No evidence toxins can be drawn out through feet. Onion discoloration is oxidation.",
            "false_confidence": 0.97,
            "true_confidence": 0.01,
            "not_known_confidence": 0.02
        },
        {
            "username": "VitaminTruth",
            "subreddit": "r/nutrition",
            "title": "Vitamin C Megadosing Makes You Immune to Viruses",
            "content": "10,000mg vitamin C daily makes you immune to all viruses. Big Pharma suppresses this!",
            "score": 819,
            "comments": 143,
            "awards": 5,
            "engagementScore": 1105,
            "permalink": "/r/nutrition/comments/vitaminc",
            "created_at": datetime.datetime.fromtimestamp(now - 4*day_seconds).isoformat(),
            "isFalse": True,
            "category": "Supplement Claims",
            "evidence": "High doses of vitamin C do not prevent viral infections and can cause side effects.",
            "false_confidence": 0.91,
            "true_confidence": 0.03,
            "not_known_confidence": 0.06
        },
        {
            "username": "VaxInjuryMom",
            "subreddit": "r/antivax",
            "title": "My Son Developed Autism After Vaccines",
            "content": "My son showed autism signs a week after MMR. Mercury in vaccines is the cause!",
            "score": 356,
            "comments": 245,
            "awards": 0,
            "engagementScore": 846,
            "permalink": "/r/antivax/comments/mmrautism",
            "created_at": datetime.datetime.fromtimestamp(now - 2*day_seconds).isoformat(),
            "isFalse": True,
            "category": "Vaccines",
            "evidence": "No link between vaccines and autism. Modern vaccines do not contain mercury.",
            "false_confidence": 0.89,
            "true_confidence": 0.03,
            "not_known_confidence": 0.08
        },
        {
            "username": "CovidDoc",
            "subreddit": "r/covid19",
            "title": "Curing COVID with Vitamin D and Zinc",
            "content": "High-dose vitamin D and zinc cure COVID in 24 hours. Hospitals refuse this!",
            "score": 1024,
            "comments": 328,
            "awards": 7,
            "engagementScore": 1680,
            "permalink": "/r/covid19/comments/vitaminprotocol",
            "created_at": datetime.datetime.fromtimestamp(now - 1*day_seconds).isoformat(),
            "isFalse": True,
            "category": "COVID-19",
            "evidence": "No evidence vitamin D and zinc cure COVID-19. Treatments are based on clinical trials.",
            "false_confidence": 0.96,
            "true_confidence": 0.01,
            "not_known_confidence": 0.03
        },
        {
            "username": "CancerResearcher",
            "subreddit": "r/cancer",
            "title": "Cancer is a Fungus Cured with Baking Soda",
            "content": "Cancer is a fungal infection cured by baking soda. Oncologists hide this!",
            "score": 731,
            "comments": 187,
            "awards": 4,
            "engagementScore": 1105,
            "permalink": "/r/cancer/comments/fungaltheory",
            "created_at": datetime.datetime.fromtimestamp(now - 5*day_seconds).isoformat(),
            "isFalse": True,
            "category": "Cancer",
            "evidence": "Cancer is not a fungus. Baking soda is not effective against cancer.",
            "false_confidence": 0.99,
            "true_confidence": 0.01,
            "not_known_confidence": 0.00
        },
        {
            "username": "EssentialOilHealer",
            "subreddit": "r/alternativemedicine",
            "title": "Essential Oils Beat Antibiotics for Infections",
            "content": "Oregano and tea tree oils cure infections better than antibiotics!",
            "score": 587,
            "comments": 142,
            "awards": 2,
            "engagementScore": 871,
            "permalink": "/r/alternativemedicine/comments/essentialoils",
            "created_at": datetime.datetime.fromtimestamp(now - 3*day_seconds).isoformat(),
            "isFalse": True,
            "category": "Alternative Medicine Claims",
            "evidence": "Essential oils are not proven to replace antibiotics for serious infections.",
            "false_confidence": 0.87,
            "true_confidence": 0.04,
            "not_known_confidence": 0.09
        },
        {
            "username": "5GTruthSeeker",
            "subreddit": "r/conspiracy",
            "title": "5G Radiation Causes COVID Outbreaks",
            "content": "5G radiation weakens immunity, matching COVID outbreak maps!",
            "score": 943,
            "comments": 301,
            "awards": 1,
            "engagementScore": 1545,
            "permalink": "/r/conspiracy/comments/5gcovid",
            "created_at": datetime.datetime.fromtimestamp(now - 2*day_seconds).isoformat(),
            "isFalse": True,
            "category": "COVID-19",
            "evidence": "No evidence links 5G to COVID-19. 5G is non-ionizing radiation.",
            "false_confidence": 0.94,
            "true_confidence": 0.01,
            "not_known_confidence": 0.05
        },
        {
            "username": "HealthJourney",
            "subreddit": "r/health",
            "title": "Mediterranean Diet Helped My Diabetes",
            "content": "Mediterranean diet improved my blood sugar. Consult your doctor!",
            "score": 423,
            "comments": 87,
            "awards": 2,
            "engagementScore": 599,
            "permalink": "/r/health/comments/mediterraneandiet",
            "created_at": datetime.datetime.fromtimestamp(now - 4*day_seconds).isoformat(),
            "isFalse": False,
            "category": "General Health",
            "evidence": "The Mediterranean diet is recognized as beneficial for managing type 2 diabetes.",
            "false_confidence": 0.05,
            "true_confidence": 0.90,
            "not_known_confidence": 0.05
        }
    ]

# Function to save posts to file
def save_posts_to_file(posts: List[Dict[str, Any]], time_filter: str) -> None:
    """Save posts to a cache file specific to the time filter."""
    try:
        cache_file = f'cached_posts_{time_filter}.json'
        with open(cache_file, 'w') as f:
            json.dump(posts, f)
        logger.info(f"Posts saved to {cache_file}")
    except Exception as e:
        logger.error(f"Error saving posts to cache file: {e}")

# Function to load posts from file
def load_posts_from_file(time_filter: str) -> Optional[List[Dict[str, Any]]]:
    """Load posts from cache file if it exists and is recent."""
    try:
        cache_file = f'cached_posts_{time_filter}.json'
        if not os.path.exists(cache_file):
            logger.info(f"Cache file {cache_file} does not exist")
            return None
        
        file_mod_time = os.path.getmtime(cache_file)
        if time.time() - file_mod_time > 6 * 3600:  # 6 hours
            logger.info(f"Cache file {cache_file} is too old")
            return None
        
        with open(cache_file, 'r') as f:
            posts = json.load(f)
        logger.info(f"Loaded {len(posts)} posts from {cache_file}")
        metrics["cache_hits"] += 1
        return posts
    except Exception as e:
        logger.error(f"Error loading posts from cache file: {e}")
        return None

# Function to check required environment variables
def check_required_env_vars():
    """Check if all required environment variables are set."""
    required_vars = [
        'WEAVIATE_URL',
        'WEAVIATE_API_KEY',
        'REDDIT_CLIENT_ID',
        'REDDIT_CLIENT_SECRET',
        'REDDIT_USERNAME',
        'REDDIT_PASSWORD'
    ]
    for var in required_vars:
        value = os.environ.get(var)
        logger.info("Env var %s: %s", var, "set" if value else "not set")
    missing_vars = [var for var in required_vars if not os.environ.get(var)]
    
    if missing_vars:
        logger.error(f"Missing required environment variables: {', '.join(missing_vars)}")
        sys.exit(1)
    logger.info("All required environment variables are set.")

# Function to check Weaviate connection and data
def check_weaviate_connection():
    """Check if Weaviate is accessible and MedicalFact class exists."""
    try:
        schema = client.schema.get()
        logger.info("Weaviate schema retrieved successfully")
        classes = [c['class'] for c in schema.get('classes', [])]
        if "MedicalFact" not in classes:
            logger.warning("MedicalFact class not found in Weaviate schema")
            return False
        return True
    except Exception as e:
        logger.error(f"Weaviate connection failed: {e}")
        return False

# API Routes
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.datetime.now().isoformat()
    })

@app.route('/api/posts', methods=['GET'])
def get_posts():
    """Get posts with potential health misinformation."""
    try:
        time_filter = request.args.get('time_filter', 'week')
        
        cached_posts = load_posts_from_file(time_filter)
        if cached_posts:
            return jsonify({'posts': cached_posts})
        
        posts = fetch_health_misinformation_posts(time_filter=time_filter)
        return jsonify({'posts': posts})
    except Exception as e:
        logger.error(f"Error in get_posts: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/verify-claim', methods=['POST'])
def verify_claim():
    """Verify a health claim."""
    data = request.get_json()
    
    if not data or 'claim' not in data:
        logger.error("No claim provided in request")
        return jsonify({"error": "No claim provided"}), 400
    
    claim = data['claim']
    logger.info(f"Received claim: {claim}")
    
    try:
        # Get verification result using the vector search
        prediction, true_confidence, false_confidence, not_known_confidence = compare_claims(
            claim, client, sentence_model, class_name="MedicalFact", verbose=True
        )
        
        # Prepare evidence text based on the result
        if prediction == "true":
            evidence = "Based on our medical database, this claim appears to be accurate. The evidence supports this statement."
        elif prediction == "false":
            evidence = "Our medical database does not support this claim. The available evidence contradicts this statement."
        else:  # not_known
            evidence = "There is insufficient evidence in our medical database to verify this claim conclusively."
        
        # Format the response to match what the frontend expects
        response = {
            "claim": claim,
            "vector_result": {
                "prediction": prediction,
                "true_confidence": float(true_confidence),
                "false_confidence": float(false_confidence),
                "not_known_confidence": float(not_known_confidence),
                "evidence": evidence
            }
        }
        
        return jsonify(response)
    
    except Exception as e:
        logger.error(f"Error processing claim: {str(e)}")
        return jsonify({
            "claim": claim,
            "vector_result": {
                "prediction": "error",
                "true_confidence": 0.0,
                "false_confidence": 0.0,
                "not_known_confidence": 1.0,
                "evidence": f"Error: {str(e)}"
            }
        }), 500

@app.route('/api/fact-check', methods=['POST'])
def fact_check():
    """Verify a health claim (legacy endpoint)."""
    try:
        data = request.json
        claim = data.get('claim')
        
        if not claim:
            return jsonify({'error': 'Claim is required'}), 400
        
        prediction, true_conf, false_conf, not_known_conf = compare_claims(
            claim, client, sentence_model, class_name="MedicalFact", verbose=True
        )
        
        return jsonify({
            'claim': claim,
            'prediction': prediction,
            'true_confidence': float(true_conf),
            'false_confidence': float(false_conf),
            'not_known_confidence': float(not_known_conf)
        })
    except Exception as e:
        logger.error(f"Error in fact_check: {e}")
        return jsonify({
            'prediction': 'error',
            'error': 'Failed to check this claim. Please try again later.'
        }), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get aggregated statistics on health misinformation."""
    try:
        cached_posts = load_posts_from_file('week') or fetch_health_misinformation_posts(time_filter='week')
        
        total_posts = len(cached_posts)
        misinformation_posts = sum(1 for post in cached_posts if post.get('isFalse', False))
        verified_posts = total_posts - misinformation_posts
        
        categories = {}
        for post in cached_posts:
            category = post.get('category', 'Uncategorized')
            categories[category] = categories.get(category, 0) + 1
        
        sorted_categories = sorted(
            [{'name': k, 'count': v} for k, v in categories.items()],
            key=lambda x: x['count'], 
            reverse=True
        )
        
        avg_engagement = sum(post.get('engagementScore', 0) for post in cached_posts) / total_posts if total_posts > 0 else 0
        mis_engagement = sum(post.get('engagementScore', 0) for post in cached_posts if post.get('isFalse', False)) / misinformation_posts if misinformation_posts > 0 else 0
        verified_engagement = sum(post.get('engagementScore', 0) for post in cached_posts if not post.get('isFalse', False)) / verified_posts if verified_posts > 0 else 0
        
        return jsonify({
            'total_posts': total_posts,
            'misinformation_posts': misinformation_posts,
            'verified_posts': verified_posts,
            'misinformation_percentage': round((misinformation_posts / total_posts * 100), 2) if total_posts > 0 else 0,
            'categories': sorted_categories,
            'avg_engagement': round(avg_engagement, 2),
            'misinformation_engagement': round(mis_engagement, 2),
            'verified_engagement': round(verified_engagement, 2)
        })
    except Exception as e:
        logger.error(f"Error in get_stats: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/trending-topics', methods=['GET'])
def get_trending_topics():
    """Get trending health misinformation topics."""
    try:
        cached_posts = load_posts_from_file('week') or fetch_health_misinformation_posts(time_filter='week')
        
        categories = {}
        for post in cached_posts:
            category = post.get('category', 'Uncategorized')
            categories[category] = categories.get(category, 0) + 1
        
        topics = [
            {'category': category, 'count': count}
            for category, count in categories.items()
        ]
        topics.sort(key=lambda x: x['count'], reverse=True)
        top_topics = topics[:10]
        
        return jsonify({'topics': top_topics})
    except Exception as e:
        logger.error(f"Error in get_trending_topics: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    """Get search performance metrics."""
    try:
        avg_search_duration = sum(metrics["search_duration"]) / len(metrics["search_duration"]) if metrics["search_duration"] else 0
        return jsonify({
            'successful_searches': metrics["successful_searches"],
            'failed_searches': metrics["failed_searches"],
            'subreddits_searched': metrics["subreddits_searched"],
            'posts_retrieved': metrics["posts_retrieved"],
            'cache_hits': metrics["cache_hits"],
            'api_errors': metrics["api_errors"],
            'avg_search_duration': round(avg_search_duration, 2),
            'inaccessible_subreddits': list(inaccessible_subreddits)
        })
    except Exception as e:
        logger.error(f"Error in get_metrics: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    """Serve the frontend for any non-API route."""
    if path != "" and os.path.exists("client/build/" + path):
        return send_from_directory('client/build', path)
    else:
        return send_from_directory('client/build', 'index.html')

# Main entry point
if __name__ == '__main__':
    check_required_env_vars()
    
    # Verify Weaviate connection
    if not check_weaviate_connection():
        logger.error("Cannot connect to Weaviate or MedicalFact class missing. Exiting.")
        sys.exit(1)
    
    # Populate sample facts if needed
    populate_medical_facts()
    
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)