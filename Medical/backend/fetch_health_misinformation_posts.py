import time
import logging
import datetime
import praw
import prawcore.exceptions
from typing import List, Dict, Any

# Assuming logger is already set up as in the original app.py
logger = logging.getLogger("health_app")

def fetch_health_misinformation_posts(time_filter: str = 'month') -> List[Dict[str, Any]]:
    """Fetch posts related to health misinformation from Reddit with optimized search."""
    try:
        # Initialize Reddit API
        reddit = initialize_reddit()
        
        if not reddit:
            logger.warning("Reddit initialization failed. Using fallback data.")
            return get_fallback_posts()

        # Expanded and categorized search terms
        search_categories = {
            "Cancer": [
                'cancer cure', 'cures cancer', 'cancer treatment', 'fight cancer', 'alternative cancer',
                'natural cancer', 'cancer remedy', 'cancer secret', 'oncologist hiding'
            ],
            "Vaccines": [
                'vaccine danger', 'vaccine injury', 'vaccine autism', 'vax side effects', 'vaccine microchip',
                'vaccine 5g', 'anti-vax', 'vaccine conspiracy', 'vax truth'
            ],
            "Detox": [
                'detox', 'cleanse', 'toxin flush', 'body cleanse', 'natural detox', 'detox secret',
                'remove toxins', 'clean your body'
            ],
            "Alkaline": [
                'alkaline diet', 'alkalize body', 'ph balance', 'acidic body', 'alkaline cure',
                'blood ph', 'alkaline treatment'
            ],
            "Conspiracy": [
                'big pharma', 'medical conspiracy', 'suppressed cure', 'doctors hiding', 'government coverup',
                'pharma secrets', 'medical truth'
            ],
            "Miracle Cures": [
                'miracle cure', 'secret cure', 'one trick', 'cure all', 'magical remedy',
                'breakthrough cure', 'hidden treatment'
            ],
            "Natural Remedies": [
                'natural cure', 'herbal cure', 'essential oil cure', 'superfood cure', 'ancient remedy',
                'natural treatment', 'heal naturally'
            ],
            "COVID-19": [
                'covid hoax', 'covid conspiracy', 'coronavirus fake', 'covid cure', 'prevent covid',
                'plandemic', 'covid truth'
            ],
            "Alternative Medicine": [
                'homeopathy cure', 'acupuncture cure', 'energy healing', 'quantum healing',
                'alternative medicine', 'holistic cure'
            ],
            "Supplements": [
                'vitamin cure', 'megadose vitamin', 'zinc cure', 'vitamin d cure', 'supplement cure',
                'immune boost', 'supercharge immunity'
            ]
        }

        # Prioritized subreddits with fallback options
        subreddits = [
            'health', 'medicine', 'alternativehealth', 'conspiracy', 'nutrition',
            'supplements', 'vaccine', 'covid19', 'coronavirus', 'naturalremedies',
            'holistic', 'cancer', 'antivax', 'conspiracytheories', 'healthconspiracy'
        ]

        all_posts = []
        network_error_occurred = False
        min_engagement_score = 50  # Minimum engagement score to filter low-impact posts

        # Iterate through subreddits
        for subreddit_name in subreddits:
            if network_error_occurred:
                logger.warning("Stopping subreddit iteration due to network error.")
                break
            
            try:
                logger.info(f"Processing subreddit: r/{subreddit_name}")
                subreddit = reddit.subreddit(subreddit_name)
                
                # Check if subreddit is accessible
                _ = make_reddit_api_call(lambda: subreddit.display_name)
                
                # Perform searches for each category
                for category, terms in search_categories.items():
                    # Combine terms for this category
                    combined_terms = ' OR '.join(terms)
                    logger.info(f"Searching r/{subreddit_name} for category: {category} with terms: {combined_terms}")
                    
                    try:
                        # Search with pagination (up to 100 posts)
                        search_results = make_reddit_api_call(
                            lambda: subreddit.search(
                                query=combined_terms,
                                sort='relevance',
                                time_filter=time_filter,  # Use the time_filter parameter
                                limit=50
                            )
                        )
                        
                        # Process results
                        post_count = 0
                        for post in search_results:
                            if not post.stickied:  # Skip stickied posts
                                all_posts.append(post)
                                post_count += 1
                        
                        logger.info(f"Found {post_count} posts in r/{subreddit_name} for category: {category}")
                    
                    except prawcore.exceptions.Forbidden:
                        logger.warning(f"Cannot access r/{subreddit_name} for {category} - subreddit may be private or quarantined")
                        continue
                    except prawcore.exceptions.NotFound:
                        logger.warning(f"Subreddit r/{subreddit_name} not found for {category}")
                        continue
                    except Exception as e:
                        logger.error(f"Error searching r/{subreddit_name} for {category}: {e}")
                        continue
                    
                    # Add delay to avoid rate limits
                    time.sleep(1)
                
            except prawcore.exceptions.Forbidden:
                logger.warning(f"Cannot access r/{subreddit_name} - subreddit may be private or quarantined")
                continue
            except prawcore.exceptions.NotFound:
                logger.warning(f"Subreddit r/{subreddit_name} not found")
                continue
            except Exception as e:
                logger.error(f"Error accessing r/{subreddit_name}: {e}")
                network_error_occurred = True
                continue
            
            # Add delay between subreddits
            time.sleep(2)
        
        # If no posts found or network error, use fallback data
        if network_error_occurred or len(all_posts) == 0:
            logger.warning("Network error or no posts found. Using fallback data.")
            return get_fallback_posts()

        # Remove duplicates by post ID
        unique_posts = []
        seen_ids = set()
        for post in all_posts:
            if post.id not in seen_ids:
                unique_posts.append(post)
                seen_ids.add(post.id)
        
        logger.info(f"Found {len(unique_posts)} unique posts after deduplication")

        if len(unique_posts) == 0:
            logger.warning("No unique posts found, using fallback data")
            return get_fallback_posts()

        # Process posts
        processed_posts = []
        for post in unique_posts:
            try:
                content = post.selftext if hasattr(post, 'selftext') else ""
                potential_misinformation = contains_potential_misinformation(post.title + " " + content)
                
                # Calculate engagement score
                engagement_score = (post.score or 0) + \
                                 (post.num_comments or 0) * 2 + \
                                 (getattr(post, 'total_awards_received', 0) or 0) * 1.5
                
                # Skip low-engagement posts
                if engagement_score < min_engagement_score:
                    continue
                
                author_name = post.author.name if post.author else "Unknown"
                subreddit_name = f"r/{post.subreddit.display_name}" if hasattr(post, 'subreddit') else "r/unknown"
                
                processed_posts.append({
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
                })
            except Exception as e:
                logger.error(f"Error processing post {post.id}: {e}")
                continue
        
        # Sort posts by misinformation status and engagement score
        processed_posts.sort(
            key=lambda x: (-1 if x["isFalse"] else 0, -x["engagementScore"])
        )
        
        # Limit to top 10 posts
        top_posts = processed_posts[:10]
        
        if not top_posts:
            logger.warning("No posts met engagement criteria, using fallback data")
            return get_fallback_posts()
        
        # Save posts to cache
        save_posts_to_file(top_posts)
        
        logger.info(f"Returning {len(top_posts)} processed posts")
        return top_posts
    
    except Exception as e:
        logger.error(f"Critical error fetching Reddit posts: {e}")
        return get_fallback_posts()

# Placeholder for required functions (assumed to exist in app.py)
def initialize_reddit():
    """Placeholder for Reddit initialization."""
    pass

def make_reddit_api_call(api_call, max_retries=3, initial_delay=5):
    """Placeholder for rate-limited API call."""
    pass

def contains_potential_misinformation(text: str) -> Dict[str, Any]:
    """Placeholder for misinformation detection."""
    pass

def save_posts_to_file(posts: List[Dict[str, Any]]) -> None:
    """Placeholder for saving posts to cache."""
    pass

def get_fallback_posts() -> List[Dict[str, Any]]:
    """Placeholder for fallback posts."""
    return []