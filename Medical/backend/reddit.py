import os
import json
import time
import logging
import datetime
import praw
import prawcore.exceptions
from typing import List, Dict, Any
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("reddit_extract.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("reddit_extract")

# Load environment variables
load_dotenv()

# Initialize Reddit API
def initialize_reddit():
    """Initialize and return a Reddit PRAW instance using environment variables."""
    try:
        client_id = os.environ.get('REDDIT_CLIENT_ID')
        client_secret = os.environ.get('REDDIT_CLIENT_SECRET')
        username = os.environ.get('REDDIT_USERNAME')
        password = os.environ.get('REDDIT_PASSWORD')
        user_agent = os.environ.get('REDDIT_USER_AGENT', 'python:RedditContentExtractor:v1.0 (by /u/Spare-Gate9133)')
        
        if not all([client_id, client_secret, user_agent]):
            logger.error("Missing Reddit API configuration")
            raise ValueError("Missing Reddit API configuration")
        
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
        raise

# Handle Reddit API calls with rate limiting
def make_reddit_api_call(api_call, max_retries=3, initial_delay=2):
    """Execute a Reddit API call with retry logic for rate limiting."""
    for attempt in range(max_retries):
        try:
            return api_call()
        except prawcore.exceptions.RequestException as e:
            if isinstance(e, prawcore.exceptions.TooManyRequests):
                delay = initial_delay * (2 ** attempt)
                logger.warning(f"Rate limit hit, retrying after {delay:.2f} seconds...")
                time.sleep(delay)
            else:
                raise
    raise Exception("Max retries exceeded for Reddit API call")

# Misinformation detection logic (copied from app.py)
def contains_potential_misinformation(text: str) -> Dict[str, Any]:
    """Detect potential misinformation in text related to health topics."""
    misinformation_patterns = [
        {"category": "Cancer", "terms": ['cure cancer', 'cures cancer', 'cancer cure', 'fight cancer naturally', 'alternative cancer', 'cancer treatment they', 'cancer fungus', 'baking soda cancer'], "evidence": 'Claims of simple cancer cures contradict established medical understanding that cancer is a complex group of diseases requiring various evidence-based treatments.'},
        {"category": "Vaccines", "terms": ['vaccine injury', 'vaccine damaged', 'vaccine danger', 'vaccines cause', 'microchip', '5g', 'government track', 'vaccine autism', 'vaccine mercury', 'heavy metals'], "evidence": 'Vaccines undergo rigorous safety testing. Claims linking vaccines to autism have been debunked by large-scale studies. Modern vaccines do not contain microchips.'},
        {"category": "Detox", "terms": ['detox', 'cleanse', 'toxin', 'flush toxins', 'body cleanse', 'clean your', 'rid your body', 'draw out toxins'], "evidence": 'The concept of "detoxing" is not medically recognized. The body has sophisticated detoxification systems through the liver and kidneys.'},
        {"category": "Alkaline Treatments", "terms": ['alkaline', 'alkalize', 'ph balance', 'acid environment', 'acidic body', 'alkaline diet', 'ph diet'], "evidence": 'Blood pH is tightly regulated. Consuming alkaline foods cannot significantly change blood pH, and disease states like cancer are not caused by body acidity.'},
        {"category": "Medical Conspiracies", "terms": ['big pharma', 'what doctors don\'t', 'don\'t want you to know', 'suppressed cure', 'suppressed treatment', 'government hiding', 'medical establishment', 'doctors won\'t tell', 'conspiracy'], "evidence": 'Conspiracy theories about hidden cures contradict the open nature of scientific research and regulatory processes.'},
        {"category": "Miracle Cures", "terms": ['miracle', 'cure all', 'magical', 'ancient secret', 'secret cure', 'one simple', 'this one trick', 'doctors hate', 'breakthrough they'], "evidence": 'Claims of "miracle cures" lack scientific evidence and exploit hope among vulnerable populations.'},
        {"category": "Natural Remedy Exaggeration", "terms": ['natural cure', 'heal yourself', 'natural treatment', 'essential oil cure', 'herbal cure', 'ancient remedy', 'superfood cure'], "evidence": 'While some natural substances have medicinal properties, claims of curing serious conditions often lack scientific support.'},
        {"category": "COVID-19", "terms": ['covid hoax', 'plandemic', 'covid conspiracy', 'coronavirus fake', 'fake virus', 'covid cure', 'covid prevention', 'prevents covid'], "evidence": 'COVID-19 is a well-documented viral disease caused by SARS-CoV-2, studied extensively worldwide.'},
        {"category": "Alternative Medicine Claims", "terms": ['homeopathy cure', 'alternative medicine cure', 'acupuncture cure', 'energy healing', 'quantum healing', 'vibrational medicine', 'frequency healing'], "evidence": 'Claims of curing serious diseases with alternative therapies often lack rigorous scientific evidence.'},
        {"category": "Supplement Claims", "terms": ['vitamin c cure', 'megadose', 'vitamin d cure', 'zinc cure', 'supplement cure', 'boost immune system instantly', 'supercharge immunity'], "evidence": 'No supplement has been proven to prevent or cure serious diseases on its own. High doses can cause adverse effects.'},
        {"category": "Mental Health", "terms": ['depression cure', 'anxiety cure', 'mental health miracle', 'natural depression', 'herbal anxiety', 'cure mental illness'], "evidence": 'Mental health conditions require evidence-based treatments like therapy and medication. Natural remedies may support but not cure.'},
        {"category": "Women's Health", "terms": ['fertility cure', 'hormone cleanse', 'natural fertility', 'menopause cure', 'pcos cure'], "evidence": 'Women’s health conditions like PCOS or infertility require medical evaluation. Natural remedies alone are insufficient.'}
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

# Extract content from Reddit posts
def extract_reddit_posts() -> List[Dict[str, Any]]:
    """Extract content from specified Reddit posts."""
    start_time = time.time()
    post_urls = [
        "https://www.reddit.com/r/offmychest/comments/1f4pmdd/im_glad_i_have_cancer/",
        "https://www.reddit.com/r/Health/comments/1kd802u/wisconsin_man_whos_spent_years_letting_deadly/",
        "https://www.reddit.com/r/keratosis/comments/1h01le5/remedy_skin/",
        "https://www.reddit.com/r/UlcerativeColitis/comments/18bt1nc/natural_treatment/",
        "https://www.reddit.com/r/rheumatoid/comments/1gwsddh/natural_herbs_rheumatoid_arthritis/",
        "https://www.reddit.com/r/neuropathy/comments/1j76xgl/is_there_any_natural_treatment_for_neuropathy/"
    ]

    try:
        reddit = initialize_reddit()
    except Exception as e:
        logger.error(f"Failed to initialize Reddit: {e}")
        return []

    processed_posts = []
    for url in post_urls:
        try:
            # Extract post ID from URL
            post_id = url.split('/comments/')[1].split('/')[0]
            logger.info(f"Fetching post with ID: {post_id}")

            # Fetch post
            post = make_reddit_api_call(lambda: reddit.submission(id=post_id))
            
            # Skip stickied posts
            if post.stickied:
                logger.info(f"Skipping stickied post: {post.title}")
                continue

            # Process post
            content = post.selftext if hasattr(post, 'selftext') else ""
            potential_misinformation = contains_potential_misinformation(post.title + " " + content)
            
            engagement_score = (post.score or 0) + \
                              (post.num_comments or 0) * 2 + \
                              (getattr(post, 'total_awards_received', 0) or 0) * 1.5
            
            author_name = post.author.name if post.author else "Unknown"
            subreddit_name = f"r/{post.subreddit.display_name}" if hasattr(post, 'subreddit') else "r/unknown"
            
            post_data = {
                "username": author_name,
                "subreddit": subreddit_name,
                "title": post.title,
                "content": content,
                "score": post.score,
                "comments": post.num_comments,
                "awards": getattr(post, 'total_awards_received', 0),
                "engagementScore": engagement_score,
                "permalink": post.permalink,
                "isFalse": potential_misinformation["isLikelyFalse"],
                "category": potential_misinformation.get("category", "General Health"),
                "evidence": potential_misinformation["evidence"],
                "created_at": datetime.datetime.fromtimestamp(post.created_utc).isoformat(),
                "false_confidence": 0.85 + (0.15 * (engagement_score / 1000)),
                "true_confidence": 0.15 - (0.05 * (engagement_score / 1000)),
                "not_known_confidence": 0.05 - (0.01 * (engagement_score / 1000))
            }
            
            processed_posts.append(post_data)
            logger.info(f"Processed post: {post.title}")
            
            time.sleep(0.5)  # Avoid rate limits
        except prawcore.exceptions.Forbidden:
            logger.warning(f"Cannot access post {url} - may be private or subreddit restricted")
            continue
        except prawcore.exceptions.NotFound:
            logger.warning(f"Post {url} not found or deleted")
            continue
        except Exception as e:
            logger.error(f"Error fetching post {url}: {e}")
            continue

    # Sort by misinformation status and engagement
    processed_posts.sort(key=lambda x: (-1 if x["isFalse"] else 0, -x["engagementScore"]))
    
    duration = time.time() - start_time
    logger.info(f"Extraction completed in {duration:.2f} seconds, fetched {len(processed_posts)} posts")
    
    return processed_posts

# Save posts to JSON file
def save_posts_to_file(posts: List[Dict[str, Any]], filename: str = "cached_posts_week.json"):
    """Save posts to a JSON file."""
    try:
        with open(filename, 'w') as f:
            json.dump(posts, f, indent=2)
        logger.info(f"Saved {len(posts)} posts to {filename}")
    except Exception as e:
        logger.error(f"Error saving posts to {filename}: {e}")

# Main execution
if __name__ == "__main__":
    try:
        posts = extract_reddit_posts()
        if posts:
            save_posts_to_file(posts)
        else:
            logger.warning("No posts fetched, output file not created")
    except Exception as e:
        logger.error(f"Program failed: {e}")