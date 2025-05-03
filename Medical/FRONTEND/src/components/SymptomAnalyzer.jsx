import React, { useState, useRef } from "react";
import { 
  FaUser, 
  FaStethoscope, 
  FaExclamationTriangle, 
  FaSearch, 
  FaPaperPlane, 
  FaSpinner, 
  FaHistory, 
  FaClinicMedical 
} from "react-icons/fa";
import { analyzeSymptomWithGemini, getMockAnalysis } from "../services/geminiService";

function SymptomAnalyzer() {
  const [symptoms, setSymptoms] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const textareaRef = useRef(null);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!symptoms.trim()) {
      setError("Please enter your symptoms before submitting.");
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // Try using the Gemini API first, fall back to mock data if there's an issue
      let analysisResults;
      
      try {
        // Call the actual Gemini API
        analysisResults = await analyzeSymptomWithGemini(symptoms);
      } catch (apiError) {
        console.warn("Gemini API error, using fallback data:", apiError);
        // If API fails, use mock data as fallback
        analysisResults = await getMockAnalysis(symptoms);
      }
      
      // Update results and history
      setResults(analysisResults);
      setSearchHistory(prev => [
        { id: Date.now(), text: symptoms, timestamp: new Date() },
        ...prev.slice(0, 4) // Keep only last 5 searches
      ]);
      
    } catch (err) {
      setError("Unable to analyze symptoms at this time. Please try again later.");
      console.error("Symptom analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Load symptoms from history
  const loadFromHistory = (historyItem) => {
    setSymptoms(historyItem.text);
    setIsHistoryOpen(false);
    
    // Focus and adjust textarea height
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  };

  // Auto-resize textarea
  const handleTextareaChange = (e) => {
    setSymptoms(e.target.value);
    
    // Auto-adjust height
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  };

  // Format timestamp for history
  const formatTimestamp = (date) => {
    return new Date(date).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <section id="symptom-analyzer" className="py-16 bg-slate-100">
      <div className="container mx-auto px-4">
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-blue-900 text-center mb-3">
            Symptom Analyzer
          </h2>
          <p className="text-gray-600 text-center max-w-3xl mx-auto">
            Describe your symptoms in detail to receive possible diagnoses and recommendations.
            Our Gemini-powered AI tool helps you understand potential health concerns.
          </p>
        </div>
        
        <div className="max-w-6xl mx-auto">
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">
                <FaStethoscope className="inline-block text-blue-500 mr-2" />
                AI Symptom Analysis
              </h3>
              
              <div className="relative">
                <button
                  onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                  className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors duration-200 text-gray-700"
                >
                  <FaHistory className="text-gray-700" />
                </button>
                
                {isHistoryOpen && searchHistory.length > 0 && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                    <div className="py-2 px-3 border-b border-gray-100">
                      <h4 className="text-sm font-medium text-gray-700">Recent searches</h4>
                    </div>
                    <ul className="max-h-56 overflow-y-auto py-1">
                      {searchHistory.map((item) => (
                        <li key={item.id}>
                          <button
                            onClick={() => loadFromHistory(item)}
                            className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm"
                          >
                            <p className="font-medium text-gray-800 truncate">{item.text}</p>
                            <p className="text-xs text-gray-500">{formatTimestamp(item.timestamp)}</p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="mb-6">
              <div className="mb-4">
                <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700 mb-2">
                  Describe your symptoms
                </label>
                <div className="relative rounded-md shadow-sm">
                  <textarea
                    id="symptoms"
                    ref={textareaRef}
                    value={symptoms}
                    onChange={handleTextareaChange}
                    placeholder="Please describe your symptoms in detail. For example: I've had a headache for the past 2 days, along with a sore throat and mild fever of 99.5°F. I also feel fatigued and have a runny nose."
                    className="border border-gray-300 rounded-lg w-full p-4 focus:ring-blue-500 focus:border-blue-500 resize-none min-h-[120px]"
                    rows={3}
                  />
                  <div className="absolute bottom-3 right-3 text-gray-400">
                    <FaSearch />
                  </div>
                </div>
                {error && (
                  <p className="mt-2 text-sm text-red-600">{error}</p>
                )}
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isAnalyzing || !symptoms.trim()}
                  className={`
                    flex items-center px-4 py-2 rounded-md font-medium
                    ${isAnalyzing || !symptoms.trim() 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'}
                    transition-colors duration-200
                  `}
                >
                  {isAnalyzing ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane className="mr-2" />
                      Analyze Symptoms
                    </>
                  )}
                </button>
              </div>
            </form>
            
            {results && (
              <div className="mt-8">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Analysis Results</h4>
                
                <div className="space-y-4">
                  {results.possibleConditions.map((condition, index) => (
                    <div 
                      key={index}
                      className={`p-4 rounded-lg border ${
                        condition.probability === "High" 
                          ? "border-red-200 bg-red-50" 
                          : condition.probability === "Medium"
                            ? "border-yellow-200 bg-yellow-50"
                            : "border-green-200 bg-green-50"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-bold text-gray-800">{condition.name}</h5>
                        <span 
                          className={`text-xs font-medium px-2 py-1 rounded-full ${
                            condition.probability === "High" 
                              ? "bg-red-200 text-red-800" 
                              : condition.probability === "Medium"
                                ? "bg-yellow-200 text-yellow-800"
                                : "bg-green-200 text-green-800"
                          }`}
                        >
                          {condition.probability} probability
                        </span>
                      </div>
                      
                      <p className="text-gray-700 mb-3 text-sm">{condition.description}</p>
                      
                      <div className="bg-white p-3 rounded border border-gray-200 mb-2">
                        <h6 className="font-medium text-gray-800 text-sm mb-1">Recommendations:</h6>
                        <p className="text-gray-700 text-sm">{condition.recommendations}</p>
                      </div>
                      
                      <div className="flex items-start">
                        <FaExclamationTriangle className="text-amber-500 mt-1 mr-2 flex-shrink-0" />
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">When to see a doctor: </span>
                          {condition.whenToSeeDoctor}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start">
                    <FaClinicMedical className="text-blue-600 mt-1 mr-3 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium text-blue-800 mb-1">Important Notice</h5>
                      <p className="text-sm text-gray-700">{results.disclaimer}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="max-w-4xl mx-auto mt-12">
            <div className="p-6 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 shadow-sm">
              <div className="flex items-start">
                <div className="mr-4 mt-1">
                  <FaUser className="text-blue-500 text-2xl" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-800 text-lg mb-2">How to Get the Most Accurate Results</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li><span className="font-medium">Be specific:</span> Include when symptoms started, their severity, and any patterns you've noticed.</li>
                    <li><span className="font-medium">Mention relevant medical history:</span> Include any chronic conditions or medications you're taking.</li>
                    <li><span className="font-medium">Describe context:</span> Mention if symptoms appear after certain activities or foods.</li>
                    <li><span className="font-medium">Use clear language:</span> Avoid medical jargon unless you're certain about the terminology.</li>
                    <li><span className="font-medium">Always follow up:</span> This tool is not a replacement for professional medical care.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SymptomAnalyzer;