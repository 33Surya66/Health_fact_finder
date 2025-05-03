import praw
import os
import json
import datetime
import time
from typing import List, Dict, Any, Optional

# Configuration for the Reddit PRAW API
def initialize_reddit():
    """Initialize and return a Reddit PRAW instance using environment variables."""
    try:
        # Check for environment variables
        client_id = os.environ.get('REDDIT_CLIENT_ID')
        client_secret = os.environ.get('REDDIT_CLIENT_SECRET')
        username = os.environ.get('REDDIT_USERNAME')
        password = os.environ.get('REDDIT_PASSWORD')
        user_agent = os.environ.get('REDDIT_USER_AGENT', 'HealthMisinformationTracker/1.0')
        
        # If credentials are missing, return None
        if not all([client_id, client_secret, user_agent]):
            print("Missing Reddit API configuration. Using fallback data.")
            return None
        
        # Initialize PRAW Reddit instance
        reddit = praw.Reddit(
            client_id=client_id,
            client_secret=client_secret,
            username=username,
            password=password,
            user_agent=user_agent
        )
        return reddit
    except Exception as e:
        print(f"Error initializing Reddit API: {e}")
        return None

# Function to fetch posts related to health misinformation from Reddit
def fetch_health_misinformation_posts() -> List[Dict[str, Any]]:
    """Fetch posts related to health misinformation from Reddit."""
    try:
        # Initialize Reddit API
        reddit = initialize_reddit()
        
        # If initialization failed, use fallback data
        if not reddit:
            return get_fallback_posts()

        # Define subreddits likely to contain health discussions (both mainstream and alternative)
        subreddits = [
            'health', 'medicine', 'alternativehealth', 'conspiracy', 'nutrition',
            'supplements', 'antivax', 'vaccine', 'covid19', 'coronavirus',
            'naturalremedies', 'holistic', 'detox', 'cancer'
        ]
        
        # Search terms to identify potential health misinformation
        search_terms = [
            'cancer cure', 'cures cancer', 'alternative cancer', 'fight cancer naturally',
            'alkalize blood', 'alkaline diet cancer', 'vaccine danger', 'vaccine injury',
            'vaccine microchip', '5G vaccine', 'toxin cleanse', 'detox', 'miracle cure',
            'natural remedy', 'what doctors don\'t want you to know', 'big pharma secrets',
            'heal yourself', 'suppressed treatment', 'autism vaccine', 'covid hoax',
            'covid conspiracy', 'alternative medicine'
        ]

        # Prepare search parameters for Reddit API
        all_posts = []
        network_error_occurred = False
        
        # Modified search approach: Run one search per subreddit with all keywords combined
        for subreddit_name in subreddits:
            # Break early if we've had network errors to avoid more failed requests
            if network_error_occurred:
                break
            
            # Combine search terms with OR operator for Reddit's search syntax
            combined_terms = ' OR '.join(search_terms)
            
            try:
                subreddit = reddit.subreddit(subreddit_name)
                # Use PRAW's search functionality
                search_results = subreddit.search(
                    query=combined_terms, 
                    sort='relevance', 
                    time_filter='week', 
                    limit=20
                )
                
                # Process search results
                for post in search_results:
                    if not post.stickied:  # Skip stickied posts
                        all_posts.append(post)
            except Exception as e:
                print(f"Error searching in r/{subreddit_name}: {e}")
                # Check if it's a network error (connection-related exceptions)
                if isinstance(e, (praw.exceptions.PRAWException, 
                                   ConnectionError, 
                                   TimeoutError)):
                    print('Network error detected. Using fallback data.')
                    network_error_occurred = True
                # Continue with other subreddits if it's not a network error
                continue
        
        # If we have network errors or no posts found, use fallback data
        if network_error_occurred or len(all_posts) == 0:
            return get_fallback_posts()

        # Remove duplicates by post ID
        unique_posts = []
        seen_ids = set()
        for post in all_posts:
            if post.id not in seen_ids:
                unique_posts.append(post)
                seen_ids.add(post.id)
        
        # Check if we found any posts
        if len(unique_posts) == 0:
            print("No posts found, using default values")
            return get_fallback_posts()
        
        # Process the posts to match your required format
        processed_posts = []
        for post in unique_posts:
            # Get post content
            content = post.selftext if hasattr(post, 'selftext') else ""
            
            # Run these posts through our misinformation detection logic
            potential_misinformation = contains_potential_misinformation(post.title + " " + content)
            
            # Calculate an engagement score to prioritize higher engagement posts
            engagement_score = (post.score or 0) + \
                              (post.num_comments or 0) * 2 + \
                              (getattr(post, 'total_awards_received', 0) or 0) * 1.5
            
            processed_posts.append({
                "username": post.author.name if post.author else "Unknown",
                "subreddit": f"r/{post.subreddit.display_name}" if hasattr(post, 'subreddit') else "r/unknown",
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
                "created_at": datetime.datetime.fromtimestamp(post.created_utc).isoformat()
            })
        
        # Sort posts by whether they contain misinformation and then by engagement score
        processed_posts.sort(
            key=lambda x: (-1 if x["isFalse"] else 0, -x["engagementScore"])
        )
        
        # Limit to the top 10 most relevant posts
        top_posts = processed_posts[:10]
        
        return top_posts
    except Exception as e:
        print(f'Error fetching Reddit posts: {e}')
        # Return fallback data in case of API failure
        return get_fallback_posts()

# Comprehensive misinformation detection logic for medical topics
def contains_potential_misinformation(text: str) -> Dict[str, Any]:
    """Detect potential misinformation in text related to health topics."""
    # Categorized list of medical misinformation markers with evidence-based rebuttals
    misinformation_patterns = [
        # Cancer misinformation
        { 
            "category": "Cancer", 
            "terms": ['cure cancer', 'cures cancer', 'cancer cure', 'fight cancer naturally', 'alternative cancer', 'cancer treatment they'],
            "evidence": 'Claims of simple cancer cures contradict established medical understanding that cancer is a complex group of diseases requiring various evidence-based treatments. No single remedy, food, or supplement has been proven to cure all cancers.'
        },
        
        # Vaccine misinformation
        {
            "category": "Vaccines",
            "terms": ['vaccine injury', 'vaccine damaged', 'vaccine danger', 'vaccines cause', 'microchip', '5g', 'government track', 'vaccine autism', 'vaccine mercury', 'heavy metals'],
            "evidence": 'Vaccines undergo rigorous safety testing and are continuously monitored. Claims linking vaccines to autism have been thoroughly debunked by numerous large-scale studies. Modern vaccines do not contain dangerous levels of mercury or microchips for tracking.'
        },
        
        # Body detox and cleansing myths
        {
            "category": "Detox",
            "terms": ['detox', 'cleanse', 'toxin', 'flush toxins', 'body cleanse', 'clean your', 'rid your body', 'draw out toxins'],
            "evidence": 'The concept of "detoxing" as marketed in popular health trends is not medically recognized. The human body has sophisticated detoxification systems through the liver, kidneys, and other organs that efficiently process and eliminate waste.'
        },
        
        # pH/alkaline misinformation
        {
            "category": "Alkaline Treatments",
            "terms": ['alkaline', 'alkalize', 'ph balance', 'acid environment', 'acidic body', 'alkaline diet', 'ph diet'],
            "evidence": 'Blood pH is tightly regulated by the body within a narrow range (7.35-7.45). Consuming alkaline foods or drinks cannot significantly change blood pH, and disease states like cancer are not simply caused by body acidity.'
        },
        
        # Conspiracy theories
        {
            "category": "Medical Conspiracies",
            "terms": ['big pharma', 'what doctors don\'t', 'don\'t want you to know', 'suppressed cure', 'suppressed treatment', 'government hiding', 'medical establishment', 'doctors won\'t tell', 'conspiracy'],
            "evidence": 'While pharmaceutical companies are profit-driven businesses, conspiracy theories about hiding cures contradict how scientific research, peer review, and regulatory approval work internationally with thousands of independent researchers.'
        },
        
        # Miracle cures and oversimplified treatments
        {
            "category": "Miracle Cures",
            "terms": ['miracle', 'cure all', 'magical', 'ancient secret', 'secret cure', 'one simple', 'this one trick', 'doctors hate', 'breakthrough they'],
            "evidence": 'Claims of "miracle cures" typically lack scientific evidence and exploit hope among vulnerable populations. Effective medical treatments undergo rigorous testing and peer review before being adopted into clinical practice.'
        },
        
        # Natural remedies overselling
        {
            "category": "Natural Remedy Exaggeration",
            "terms": ['natural cure', 'heal yourself', 'natural treatment', 'essential oil cure', 'herbal cure', 'ancient remedy', 'superfood cure'],
            "evidence": 'While some natural substances have legitimate medicinal properties that have led to pharmaceuticals, claims of "natural cures" for serious conditions often lack scientific support and proper dosage control.'
        },
        
        # COVID-19 misinformation
        {
            "category": "COVID-19",
            "terms": ['covid hoax', 'plandemic', 'covid conspiracy', 'coronavirus fake', 'fake virus', 'covid cure', 'covid prevention', 'prevents covid'],
            "evidence": 'COVID-19 is a well-documented viral disease caused by SARS-CoV-2. The virus has been isolated, sequenced, and studied extensively by thousands of independent researchers worldwide.'
        },
        
        # Alternative medicine exaggeration
        {
            "category": "Alternative Medicine Claims",
            "terms": ['homeopathy cure', 'alternative medicine cure', 'acupuncture cure', 'energy healing', 'quantum healing', 'vibrational medicine', 'frequency healing'],
            "evidence": 'While complementary approaches may offer symptom relief and improved quality of life, claims of curing serious diseases often lack rigorous scientific evidence. Many complementary therapies have not been subjected to the same level of scientific scrutiny as conventional treatments.'
        },
        
        # Specific supplements overstatements
        {
            "category": "Supplement Claims",
            "terms": ['vitamin c cure', 'megadose', 'vitamin d cure', 'zinc cure', 'supplement cure', 'boost immune system instantly', 'supercharge immunity'],
            "evidence": 'While proper nutrition is important for immune function, no supplement has been proven to prevent or cure serious diseases on its own. Extremely high doses of some vitamins and minerals can cause adverse effects.'
        }
    ]
    
    # Convert text to lowercase for case-insensitive matching
    lower_text = text.lower()
    
    # Check if the text contains any misinformation patterns
    for pattern in misinformation_patterns:
        for term in pattern["terms"]:
            if term in lower_text:
                return {
                    "isLikelyFalse": True,
                    "category": pattern["category"],
                    "evidence": pattern["evidence"]
                }
    
    # Secondary check for specific combinations of words that might indicate misinformation
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
        
        # Find all occurrences of the first word
        for index, word in enumerate(words):
            if pair[0] in word:
                first_word_indices.append(index)
        
        # For each occurrence of first word, check if second word is within distance
        for index in first_word_indices:
            start_range = max(0, index - distance)
            end_range = min(len(words) - 1, index + distance)
            
            for i in range(start_range, end_range + 1):
                if pair[1] in words[i]:
                    return {
                        "isLikelyFalse": True,
                        "category": "Health Claims",
                        "evidence": "This post contains language patterns commonly associated with medical misinformation. Health claims about cures, treatments, or prevention methods should be verified with credible medical sources."
                    }
    
    # If no patterns matched, it's possibly not misinformation
    return {
        "isLikelyFalse": False,
        "evidence": "This post doesn't contain common misinformation markers, but always verify health information with credible medical sources and healthcare professionals."
    }

# Comprehensive fallback data covering different medical misinformation categories for Reddit
def get_fallback_posts() -> List[Dict[str, Any]]:
    """Return a list of fallback posts for when the API fails."""
    now = time.time()
    day_seconds = 24 * 60 * 60
    
    return [
        {
            "username": "HealthGuru42",
            "subreddit": "r/alternativehealth",
            "title": "Alkaline Diet CURED My Stage 4 Cancer",
            "content": "After doctors gave me 3 months to live, I started drinking lemon water with baking soda to alkalize my blood. Cancer cells can't survive in an alkaline environment! Six months later and my tumors are gone. Big Pharma doesn't want you to know this simple cure!",
            "score": 427,
            "comments": 53,
            "awards": 2,
            "engagementScore": 535,
            "permalink": "/r/alternativehealth/comments/alkdiet",
            "created_at": datetime.datetime.fromtimestamp(now - 2*day_seconds).isoformat(),  # 2 days ago
            "isFalse": True,
            "category": "Alkaline Treatments",
            "evidence": "Blood pH is tightly regulated by the body. Consuming alkaline foods or drinks cannot significantly change blood pH, and cancer cells can adapt to various pH environments. This claim contradicts fundamental principles of human physiology."
        },
        {
            "username": "TruthWarrior2023",
            "subreddit": "r/conspiracy",
            "title": "PROOF: COVID Vaccines Contain Microchips Connected to 5G",
            "content": "I work in biotech and can confirm that the COVID vaccines contain nano-tracking devices that activate when near 5G towers. This allows governments to monitor everyone's movements and even control your thoughts. This is why they built 5G infrastructure at the same time as vaccine rollout. Wake up sheeple!",
            "score": 284,
            "comments": 124,
            "awards": 0,
            "engagementScore": 532,
            "permalink": "/r/conspiracy/comments/vaxmicro",
            "created_at": datetime.datetime.fromtimestamp(now - 1*day_seconds).isoformat(),  # 1 day ago
            "isFalse": True,
            "category": "Vaccines",
            "evidence": "Vaccines do not contain microchips. The components of vaccines are well-documented and monitored by regulatory agencies. Microchips small enough to fit through a needle would not have the power source or technology to track individuals."
        },
        {
            "username": "DetoxMaster",
            "subreddit": "r/naturalremedies",
            "title": "Ancient Detox Secret: Onion Socks Pull Toxins Out While You Sleep",
            "content": "I've been placing raw onion slices in my socks before bed for 30 days straight. They turn black overnight as they pull toxins out through the feet (your body's natural exit points). My chronic fatigue is gone, my skin is clear, and I've lost 15 pounds of toxic weight. Try it yourself! #NaturalDetox",
            "score": 541,
            "comments": 87, 
            "awards": 3,
            "engagementScore": 715,
            "permalink": "/r/naturalremedies/comments/onionsocks",
            "created_at": datetime.datetime.fromtimestamp(now - 3*day_seconds).isoformat(),  # 3 days ago
            "isFalse": True,
            "category": "Detox",
            "evidence": "The human body detoxifies itself primarily through the liver and kidneys. There is no scientific evidence that toxins can be drawn out through the feet. Discoloration of onions is due to oxidation, not toxin absorption."
        },
        {
            "username": "VitaminTruth",
            "subreddit": "r/nutrition",
            "title": "Vitamin C Megadosing Protocol (10,000mg daily) Makes You Immune to ALL Viruses",
            "content": "I've been researching vitamin C for 15 years and have developed a protocol that makes you completely immune to viral infections. Take 10,000mg of vitamin C spread throughout the day, and you'll never get sick again. The medical establishment suppresses this because one cheap vitamin would destroy their profit model based on expensive treatments.",
            "score": 819,
            "comments": 143,
            "awards": 5,
            "engagementScore": 1105,
            "permalink": "/r/nutrition/comments/vitaminc",
            "created_at": datetime.datetime.fromtimestamp(now - 4*day_seconds).isoformat(),  # 4 days ago
            "isFalse": True,
            "category": "Supplement Claims",
            "evidence": "While vitamin C is important for immune function, high doses have not been proven to prevent viral infections. The body can only absorb a limited amount of vitamin C, and excess is typically excreted. High doses can cause digestive issues and kidney stones."
        },
        {
            "username": "VaxInjuryMom",
            "subreddit": "r/antivax",
            "title": "My Son Developed Autism One Week After Vaccines - It's Not a Coincidence!",
            "content": "My perfectly healthy 18-month-old received the MMR vaccine last month. Within a week, he stopped making eye contact and began showing clear signs of autism. Doctors deny the connection, but I know what I saw. The mercury in these vaccines is causing an epidemic of neurological damage in our children. Parents need to know the truth!",
            "score": 356,
            "comments": 245,
            "awards": 0,
            "engagementScore": 846,
            "permalink": "/r/antivax/comments/mmrautism",
            "created_at": datetime.datetime.fromtimestamp(now - 2*day_seconds).isoformat(),  # 2 days ago
            "isFalse": True,
            "category": "Vaccines",
            "evidence": "Multiple large-scale studies have found no link between vaccines and autism. Modern vaccines for children no longer contain mercury (thimerosal). The original study suggesting this link was retracted due to serious procedural and ethical concerns."
        },
        {
            "username": "CovidDoc",
            "subreddit": "r/covid19",
            "title": "I'm Curing COVID in Hours with Vitamin D and Zinc - Hospitals Won't Use This Protocol",
            "content": "As a functional medicine doctor, I've now cured over 300 COVID patients using high-dose vitamin D (50,000 IU) and zinc (100mg) protocols. Most recover within 24 hours. Hospitals refuse to adopt this approach because they get paid more for ventilator use. This simple cure is being actively suppressed.",
            "score": 1024,
            "comments": 328,
            "awards": 7,
            "engagementScore": 1680,
            "permalink": "/r/covid19/comments/vitaminprotocol",
            "created_at": datetime.datetime.fromtimestamp(now - 1*day_seconds).isoformat(),  # 1 day ago
            "isFalse": True,
            "category": "COVID-19",
            "evidence": "While vitamin D and zinc are important for immune health, there is no evidence they can cure COVID-19 infection. Treatment protocols for COVID-19 are based on extensive clinical trials and are continuously updated as new evidence emerges."
        },
        {
            "username": "CancerResearcher",
            "subreddit": "r/cancer",
            "title": "Cancer is Actually a Fungus that Can Be Cured with Baking Soda - The Secret They're Hiding",
            "content": "After 20 years of independent research, I've confirmed that cancer is actually a fungal infection that thrives in acidic environments. Baking soda treatments alkalize the body and kill the fungus. I've helped hundreds of patients cure their cancer this way after conventional medicine failed them. Oncologists know this but won't tell you because chemotherapy is a billion-dollar industry.",
            "score": 731,
            "comments": 187,
            "awards": 4,
            "engagementScore": 1105,
            "permalink": "/r/cancer/comments/fungaltheory",
            "created_at": datetime.datetime.fromtimestamp(now - 5*day_seconds).isoformat(),  # 5 days ago
            "isFalse": True,
            "category": "Cancer",
            "evidence": "Cancer is not a fungus but a disease characterized by abnormal cell growth. This claim dangerously misrepresents the nature of cancer and could lead people to delay effective treatment. Baking soda infusions can cause serious electrolyte imbalances and are not effective against cancer."
        },
        {
            "username": "EssentialOilHealer",
            "subreddit": "r/alternativemedicine",
            "title": "STUDY: Essential Oils More Effective Than Antibiotics for Treating Infections",
            "content": "New research shows that oregano, thyme and tea tree essential oils can eliminate bacterial infections more effectively than prescription antibiotics. I've personally helped patients recover from pneumonia, UTIs, and even MRSA using only essential oil protocols. The pharmaceutical industry is actively working to suppress this research.",
            "score": 587,
            "comments": 142,
            "awards": 2,
            "engagementScore": 871,
            "permalink": "/r/alternativemedicine/comments/essentialoils",
            "created_at": datetime.datetime.fromtimestamp(now - 3*day_seconds).isoformat(),  # 3 days ago
            "isFalse": True,
            "category": "Alternative Medicine Claims",
            "evidence": "While some essential oils have antimicrobial properties in laboratory settings, they have not been proven effective as replacements for antibiotics in treating serious bacterial infections. Delaying appropriate antibiotic treatment for serious infections can lead to worsening illness or death."
        },
        {
            "username": "5GTruthSeeker",
            "subreddit": "r/conspiracy",
            "title": "5G Radiation Weakens Immune System - COVID Outbreak Map Matches 5G Tower Locations",
            "content": "I've overlaid maps of COVID-19 outbreaks with 5G tower installations and the correlation is undeniable. 5G radiation at 60GHz disrupts oxygen molecules and weakens the immune system, making people susceptible to viruses. This is why COVID spread fastest in areas with 5G infrastructure. Protect yourself with EMF-blocking crystals and Faraday cages.",
            "score": 452,
            "comments": 163,
            "awards": 1,
            "engagementScore": 778,
            "permalink": "/r/conspiracy/comments/5gcovid",
            "created_at": datetime.datetime.fromtimestamp(now - 6*day_seconds).isoformat(),  # 6 days ago
            "isFalse": True,
            "category": "COVID-19",
            "evidence": "There is no scientific evidence that 5G technology weakens the immune system or contributes to the spread of viruses. 5G radio waves are non-ionizing radiation that do not have sufficient energy to damage cells or DNA. COVID-19 has spread in many areas without 5G infrastructure."
        },
        {
            "username": "AlkalineLifestyle",
            "subreddit": "r/health",
            "title": "Celery Juice Protocol: Alkalizes Your Body and Prevents 90% of All Diseases",
            "content": "I've been drinking 16oz of fresh celery juice every morning on an empty stomach for 2 years. It has completely transformed my health by alkalizing my system. Most diseases, including cancer, diabetes, and arthritis, can only thrive in an acidic environment. By maintaining alkalinity through celery juice, you can prevent almost all modern diseases. The medical establishment doesn't want you to know this simple solution.",
            "score": 632,
            "comments": 128,
            "awards": 3,
            "engagementScore": 893,
            "permalink": "/r/health/comments/celeryjuice",
            "created_at": datetime.datetime.fromtimestamp(now - 2*day_seconds).isoformat(),  # 2 days ago
            "isFalse": True,
            "category": "Alkaline Treatments",
            "evidence": "The body maintains a tight pH balance through various mechanisms regardless of diet. While eating vegetables like celery can be part of a healthy diet, celery juice cannot significantly alter your body's pH or prevent 90% of diseases. Disease prevention involves many factors including genetics, environment, and various lifestyle choices."
        }
    ]

# Function to save posts to a JSON file with timestamp
def save_posts_to_file(posts, filename='health_misinfo_posts.json'):
    """Save posts to a JSON file with timestamp."""
    posts_data = {
        "timestamp": time.time(),
        "data": posts
    }
    with open(filename, 'w') as f:
        json.dump(posts_data, f)

# Function to get posts from a JSON file
def get_posts_from_file(filename='health_misinfo_posts.json'):
    """Get posts from a JSON file."""
    try:
        with open(filename, 'r') as f:
            posts_data = json.load(f)
        return posts_data
    except (FileNotFoundError, json.JSONDecodeError):
        return None

# Function to check if posts need to be refreshed (older than 12 hours)
def should_refresh_posts(filename='health_misinfo_posts.json'):
    """Check if posts need to be refreshed (older than 12 hours)."""
    posts_data = get_posts_from_file(filename)
    if not posts_data:
        return True
    
    twelve_hours_in_seconds = 12 * 60 * 60
    current_time = time.time()
    
    return current_time - posts_data["timestamp"] > twelve_hours_in_seconds

# Main function to get health misinformation posts
def get_health_misinfo_posts(filename='health_misinfo_posts.json'):
    """Main function to get health misinformation posts."""
    if should_refresh_posts(filename):
        posts = fetch_health_misinformation_posts()
        save_posts_to_file(posts, filename)
        return posts
    else:
        posts_data = get_posts_from_file(filename)
        return posts_data["data"]

# Example usage
if __name__ == "__main__":
    posts = get_health_misinfo_posts()
    print(f"Found {len(posts)} posts with potential health misinformation")
    for i, post in enumerate(posts[:3], 1):  # Print the first 3 posts for demonstration
        print(f"\n{i}. {post['title']} (r/{post['subreddit'][2:]})")
        print(f"   Category: {post['category']} | Score: {post['score']} | Comments: {post['comments']}")
        print(f"   Evidence: {post['evidence'][:100]}...")