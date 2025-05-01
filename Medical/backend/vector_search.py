# Medical/backend/vector_search.py
import numpy as np
from functools import lru_cache
import re

@lru_cache(maxsize=512)
def get_embedding(text, model):
    """Cached function to get embeddings"""
    return model.encode(text, show_progress_bar=False).tolist()

def preprocess_claim(claim):
    """Split compound claims into simpler parts for better matching"""
    if " and " in claim or ", " in claim:
        subclaims = []
        for part in re.split(r' and |, ', claim):
            if len(part.strip()) > 10:
                subclaims.append(part.strip())
        return subclaims
    return [claim]

def cosine_similarity(a, b):
    """Calculate cosine similarity between two vectors"""
    try:
        # Convert to numpy arrays if they aren't already
        a_np = np.array(a)
        b_np = np.array(b)
        
        # Flatten arrays to 1D if they're multi-dimensional
        if a_np.ndim > 1:
            a_np = a_np.flatten()
        if b_np.ndim > 1:
            b_np = b_np.flatten()
        
        # Calculate norms
        norm_a = np.linalg.norm(a_np)
        norm_b = np.linalg.norm(b_np)
        
        # Handle zero norms
        if norm_a == 0 or norm_b == 0:
            return 0
        
        # Calculate dot product and return similarity
        return float(np.dot(a_np, b_np) / (norm_a * norm_b))
    except Exception as e:
        print(f"Error in cosine_similarity: {str(e)}")
        return 0  # Return 0 similarity on error

def process_single_claim(subclaim, client, model, class_name="MedicalFact", verbose=False, 
                       true_threshold=0.65, false_threshold=0.80):
    """Process a single claim and return confidence scores for both true and false"""
    # Input validation
    if not isinstance(subclaim, str):
        subclaim = str(subclaim)
    
    if verbose:
        print(f"\nProcessing claim: '{subclaim}'")
    
    # Safety check - empty string
    if not subclaim or subclaim.strip() == "":
        if verbose:
            print("\nRESULT: NOT KNOWN - Empty claim")
        return "not known", 0.1, 0.1, 0.8
    
    try:
        subclaim_embedding = get_embedding(subclaim, model)
        
        # Updated Weaviate query to use the correct API version
        try:
            response = client.query.get(class_name, ["diseaseName", "cause", "symptoms", "measures", "cure"]) \
                .with_near_vector({"vector": subclaim_embedding}) \
                .with_limit(10) \
                .do()
            
            # Handle the response according to the query format
            result_objects = response.get('data', {}).get('Get', {}).get(class_name, [])
        except Exception as e:
            if verbose:
                print(f"Error querying Weaviate: {str(e)}")
            return "not known", 0.1, 0.1, 0.8
        
        if not result_objects or len(result_objects) == 0:
            if verbose:
                print("\nRESULT: NOT KNOWN - No matches found")
            # Return equal low probabilities for true/false and high for not_known
            return "not known", 0.1, 0.1, 0.8
        
        best_similarity = 0
        best_match = None
        supporting_evidence_count = 0
        
        for i, item in enumerate(result_objects):
            if item is None:
                continue
                
            properties = item
            # Skip problematic items
            if not isinstance(properties, dict):
                continue
            
            # Safely extract text fields
            combined_text = " ".join([
                str(properties.get(field, "")) for field in 
                ["diseaseName", "cause", "symptoms", "measures", "cure"]
            ])
            
            # Skip if combined text is empty
            if not combined_text.strip():
                continue
                
            try:
                db_embedding = get_embedding(combined_text, model)
                
                # Use the cosine_similarity function
                semantic_similarity = cosine_similarity([subclaim_embedding], [db_embedding])
                
                # Safety checks for word_overlap_ratio
                subclaim_words = set(subclaim.lower().split()) if subclaim else set()
                combined_text_words = set(combined_text.lower().split()) if combined_text else set()
                
                if not subclaim_words:
                    word_overlap_ratio = 0
                else:
                    word_overlap_ratio = len(subclaim_words & combined_text_words) / len(subclaim_words)
                
                # Check for substring matches
                substring_match = False
                for phrase in subclaim.lower().split('.'):
                    if len(phrase.strip()) > 15 and phrase.strip() in combined_text.lower():
                        substring_match = True
                        break
                
                match_score = (semantic_similarity * 0.75) + (word_overlap_ratio * 0.25)
                
                if match_score > best_similarity:
                    best_similarity = match_score
                    best_match = {
                        "text": combined_text,
                        "score": match_score,
                        "similarity": semantic_similarity,
                        "overlap": word_overlap_ratio,
                        "substring": substring_match
                    }
                
                if match_score > 0.60:
                    supporting_evidence_count += 1
            except Exception as e:
                if verbose:
                    print(f"Error processing result {i}: {str(e)}")
                continue
        
        if best_match:
            # Calculate probabilistic confidence scores
            claim_length = len(subclaim.split())
            complexity_factor = min(1.1, max(0.9, claim_length / 15))
            base_threshold = true_threshold if any(term in subclaim.lower() for term in 
                                                ['can cause', 'can lead', 'associated with', 'risk factor', 'can result']) \
                            else false_threshold
            adjusted_threshold = base_threshold * complexity_factor
            
            # Calculate sigmoid normalized confidence scores
            def sigmoid(x):
                return 1 / (1 + np.exp(-5 * (x - 0.5)))
            
            # Calculate true confidence
            true_confidence = sigmoid(best_match['score']) * 0.8 + \
                            (supporting_evidence_count / 10) * 0.2
            
            # Calculate false confidence (inverse relationship with true confidence)
            false_confidence = sigmoid(1 - best_match['score']) * 0.7 + \
                              (1 - (supporting_evidence_count / 10)) * 0.3
            
            # Normalize to ensure sum is close to 1
            not_known_confidence = max(0, 1 - (true_confidence + false_confidence))
            
            # Final normalization
            total = true_confidence + false_confidence + not_known_confidence
            true_confidence /= total
            false_confidence /= total
            not_known_confidence /= total
            
            # Determine the most likely label
            if true_confidence >= false_confidence and true_confidence >= not_known_confidence:
                result = "true"
            elif false_confidence >= true_confidence and false_confidence >= not_known_confidence:
                result = "false"
            else:
                result = "not known"
            
            if verbose:
                print(f"\nRESULT: {result.upper()}")
                print(f"Confidence scores - TRUE: {true_confidence:.4f}, FALSE: {false_confidence:.4f}, NOT KNOWN: {not_known_confidence:.4f}")
            
            return result, true_confidence, false_confidence, not_known_confidence
        else:
            if verbose:
                print("\nRESULT: NOT KNOWN - No relevant matches")
            # Return low probabilities for true/false and high for not_known
            return "not known", 0.1, 0.1, 0.8
    except Exception as e:
        if verbose:
            print(f"Unexpected error in process_single_claim: {str(e)}")
        return "not known", 0.1, 0.1, 0.8

def compare_claims(claim, client, model, class_name="MedicalFact", verbose=False, 
                 true_threshold=0.65, false_threshold=0.80):
    """Enhanced comparison with probabilistic confidence scores"""
    # Ensure claim is a string
    if not isinstance(claim, str):
        if verbose:
            print(f"Warning: Non-string claim converted: {type(claim)} -> str")
        claim = str(claim)
    
    # Handle empty strings
    if not claim or claim.strip() == "":
        if verbose:
            print("Warning: Empty claim received")
        return "not known", 0.1, 0.1, 0.8
    
    # Process the claim
    subclaims = preprocess_claim(claim)
    
    # Handle case where preprocessing returns no subclaims
    if not subclaims:
        if verbose:
            print("Warning: No subclaims extracted")
        return "not known", 0.1, 0.1, 0.8
    
    subclaim_results = []
    true_confidences = []
    false_confidences = []
    not_known_confidences = []
    
    for subclaim in subclaims:
        try:
            result, true_conf, false_conf, not_known_conf = process_single_claim(
                subclaim, client, model, class_name, verbose, true_threshold, false_threshold
            )
            subclaim_results.append(result)
            true_confidences.append(true_conf)
            false_confidences.append(false_conf)
            not_known_confidences.append(not_known_conf)
            
            # If any subclaim is true with high confidence, return true
            if result == "true" and true_conf > 0.7:
                return "true", true_conf, false_conf, not_known_conf
        except Exception as e:
            if verbose:
                print(f"Error processing subclaim '{subclaim}': {str(e)}")
            # Don't append failed subclaims to prevent skewing results
    
    # If no subclaims were successfully processed, return not known
    if not subclaim_results:
        return "not known", 0.1, 0.1, 0.8
    
    # Average the confidences across subclaims
    avg_true_conf = sum(true_confidences) / len(true_confidences) if true_confidences else 0.0
    avg_false_conf = sum(false_confidences) / len(false_confidences) if false_confidences else 0.0
    avg_not_known_conf = sum(not_known_confidences) / len(not_known_confidences) if not_known_confidences else 0.0
    
    # Determine final result based on highest average confidence
    if avg_true_conf >= avg_false_conf and avg_true_conf >= avg_not_known_conf:
        return "true", avg_true_conf, avg_false_conf, avg_not_known_conf
    elif avg_false_conf >= avg_true_conf and avg_false_conf >= avg_not_known_conf:
        return "false", avg_true_conf, avg_false_conf, avg_not_known_conf
    else:
        return "not known", avg_true_conf, avg_false_conf, avg_not_known_conf