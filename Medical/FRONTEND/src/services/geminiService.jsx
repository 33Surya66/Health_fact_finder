// geminiService.js
// Service for interacting with Google's Gemini API

// For Vite, use import.meta.env instead of process.env
// IMPORTANT: Never commit your API key to version control
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

/**
 * Analyzes symptoms using the Gemini API
 * @param {string} symptoms - User's symptom description
 * @returns {Promise<Object>} - Parsed analysis results
 */
export const analyzeSymptomWithGemini = async (symptoms) => {
  try {
    // Check if API key is available
    if (!GEMINI_API_KEY) {
      console.warn("Gemini API key not found. Please set the VITE_GEMINI_API_KEY environment variable.");
      throw new Error("API key not configured");
    }

    // Craft the prompt for Gemini to analyze symptoms
    const prompt = `
      You are a medical symptom analyzer AI. Based on the symptoms described below, 
      provide possible diagnoses with probabilities (High, Medium, or Low), 
      brief descriptions, recommendations, and when to see a doctor.
      
      Analyze these symptoms and return exactly 3 possible conditions:
      ${symptoms}
      
      Format your response in JSON with this structure:
      {
        "possibleConditions": [
          {
            "name": "Condition Name",
            "probability": "High/Medium/Low",
            "description": "Brief description of the condition",
            "recommendations": "Self-care recommendations",
            "whenToSeeDoctor": "When to seek professional medical help"
          }
        ],
        "disclaimer": "Medical disclaimer text"
      }
    `;

    // Make the API request to Gemini
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    // Extract the generated text from Gemini's response
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      throw new Error('No response generated from Gemini API');
    }
    
    // Extract and parse the JSON from the response text
    // We need to find the JSON object in the text, as Gemini might add additional text
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Could not extract valid JSON from Gemini response');
    }
    
    const parsedResponse = JSON.parse(jsonMatch[0]);
    
    // Add a default disclaimer if none is provided
    if (!parsedResponse.disclaimer) {
      parsedResponse.disclaimer = "This analysis is for informational purposes only and does not constitute medical advice. Please consult with a healthcare professional for proper diagnosis and treatment.";
    }
    
    return parsedResponse;
    
  } catch (error) {
    console.error('Error analyzing symptoms with Gemini:', error);
    throw error;
  }
};

/**
 * Fallback function for testing when API is unavailable
 * @param {string} symptoms - User's symptom description 
 * @returns {Promise<Object>} - Mock analysis results
 */
export const getMockAnalysis = async (symptoms) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Generate slightly different mock responses based on symptoms text
  // to make testing more realistic
  const conditions = [
    {
      name: "Common Cold",
      probability: "High",
      description: "A viral infection of the upper respiratory tract. Usually harmless and resolves within 7-10 days.",
      recommendations: "Rest, stay hydrated, and take over-the-counter pain relievers if needed.",
      whenToSeeDoctor: "If symptoms persist for more than 10 days or are unusually severe."
    },
    {
      name: "Seasonal Allergies",
      probability: "Medium",
      description: "An immune system response to environmental triggers like pollen or dust.",
      recommendations: "Try over-the-counter antihistamines and avoid known allergens.",
      whenToSeeDoctor: "If symptoms significantly impact your quality of life or don't respond to OTC treatments."
    },
    {
      name: "Sinusitis",
      probability: "Low",
      description: "Inflammation of the sinuses, often following a cold or due to allergies.",
      recommendations: "Nasal irrigation, steam inhalation, and OTC decongestants may help.",
      whenToSeeDoctor: "If symptoms last longer than 10 days or include severe headache and fever."
    }
  ];
  
  // Customize the response slightly based on symptom content
  if (symptoms.toLowerCase().includes("headache")) {
    conditions[0] = {
      name: "Tension Headache",
      probability: "High",
      description: "The most common type of headache, often described as a constant ache or pressure around the head.",
      recommendations: "Over-the-counter pain relievers, rest, and stress management techniques.",
      whenToSeeDoctor: "If headaches are severe, wake you from sleep, or are accompanied by fever, stiff neck, or neurological symptoms."
    };
  }
  
  if (symptoms.toLowerCase().includes("stomach") || symptoms.toLowerCase().includes("nausea")) {
    conditions[1] = {
      name: "Gastroenteritis",
      probability: "Medium",
      description: "Inflammation of the stomach and intestines, typically resulting from a viral or bacterial infection.",
      recommendations: "Stay hydrated, eat bland foods, and get plenty of rest.",
      whenToSeeDoctor: "If symptoms persist more than 3 days, if there's blood in vomit or stool, or if you can't keep fluids down."
    };
  }
  
  return {
    possibleConditions: conditions,
    disclaimer: "This analysis is for informational purposes only and does not constitute medical advice. Please consult with a healthcare professional for proper diagnosis and treatment."
  };
};