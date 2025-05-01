# Medical/backend/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
from sentence_transformers import SentenceTransformer
from weaviate import Client
from weaviate.auth import AuthApiKey

# Add helper functions import
sys.path.append(os.path.dirname(__file__))
from vector_search import compare_claims, get_embedding

app = Flask(__name__)
CORS(app)  # This enables CORS for all routes

# Initialize Weaviate client
weaviate_url = "https://hbuwdzekqiyn5xieverkyq.c0.asia-southeast1.gcp.weaviate.cloud"
weaviate_api_key = "y7dMKERfOkGXHjkidDp8ytltYW6f82ddKvMT"

client = Client(
    url=weaviate_url,
    auth_client_secret=AuthApiKey(api_key=weaviate_api_key)
)

# Initialize sentence model
print("Loading sentence model...")
sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
print("Model loaded successfully")

@app.route('/api/verify-claim', methods=['POST'])
def verify_claim():
    data = request.get_json()
    
    if not data or 'claim' not in data:
        return jsonify({"error": "No claim provided"}), 400
    
    claim = data['claim']
    print(f"Received claim: {claim}")
    
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
        print(f"Error processing claim: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)