import React, { useState } from "react";
import * as mammoth from 'mammoth';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

function Upload() {
  const [files, setFiles] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [error, setError] = useState(null);

  // Classification categories with corresponding colors
  const classificationColors = {
    relevant: "bg-green-100 text-green-800",
    irrelevant: "bg-gray-100 text-gray-800",
    probabilistic: "bg-yellow-100 text-yellow-800",
    falsePrescription: "bg-red-100 text-red-800"
  };

  // Medical conditions for classification
  const medicalConditions = [
    "Diabetes", "Hypertension", "Asthma", "Heart Disease", 
    "Cancer", "Alzheimer's", "Arthritis", "Depression"
  ];

  // Extract text based on file type
  const extractTextFromFile = async (file) => {
    try {
      const fileType = file.name.split('.').pop().toLowerCase();
      
      if (['docx'].includes(fileType)) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
      } else if (['txt', 'md', 'rtf'].includes(fileType)) {
        return await file.text();
      } else {
        throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (err) {
      console.error("Error extracting text:", err);
      throw err;
    }
  };

  // Analyze medical document text
  const analyzeDocument = (text) => {
    const sentences = text.split(/(?<=[.!?])\s+/);
    
    return sentences.map(sentence => {
      const hasPrescriptionPattern = /\d+\s*mg|\d+\s*tablet|take\s+\d+|prescribed|medication|dosage/i.test(sentence);
      const isPrescription = hasPrescriptionPattern;
      
      const conditionMatches = medicalConditions.filter(condition => 
        sentence.toLowerCase().includes(condition.toLowerCase())
      );
      
      let classification = "irrelevant";
      if (conditionMatches.length > 0) {
        classification = "relevant";
      }
      
      if (/may|might|possibly|probably|could|likely|chance|risk|potential/i.test(sentence)) {
        classification = "probabilistic";
      }
      
      if (isPrescription && /unsafe|contraindicated|dangerous|not recommended|caution|warning/i.test(sentence)) {
        classification = "falsePrescription";
      }
      
      return {
        text: sentence,
        classification,
        conditions: conditionMatches,
        isPrescription
      };
    });
  };

  // Call Gemini API for enhanced analysis
  const callGeminiAPI = async (text) => {
    if (!GEMINI_API_KEY) {
      setError("Gemini API key is not configured");
      return null;
    }
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Analyze this medical document for potential issues, inconsistencies, and medical accuracy:
              
              ${text}
              
              Provide a structured analysis in the following format:
              - **Detected Medical Conditions**: List any medical conditions found
              - **Potential Incorrect Prescriptions**: Note any problematic prescriptions
              - **Consistency Issues**: Highlight any contradictions
              - **Concerning Medical Advice**: Flag any risky advice`
            }]
          }]
        })
      });
      
      const data = await response.json();
      return data;
    } catch (err) {
      console.error("Error calling Gemini API:", err);
      setError(`Error calling Gemini API: ${err.message}`);
      return null;
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
      setError(null);
    }
  };

  const processFiles = async () => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    setError(null);
    const newDocuments = [];
    
    try {
      for (const file of files) {
        try {
          const content = await extractTextFromFile(file);
          const analyzedContent = analyzeDocument(content);
          const geminiResult = await callGeminiAPI(content);
          
          newDocuments.push({
            name: file.name,
            content: analyzedContent,
            rawText: content,
            geminiAnalysis: geminiResult
          });
        } catch (err) {
          console.error(`Error processing file ${file.name}:`, err);
          setError(`Error processing file ${file.name}: ${err.message}`);
        }
      }
      
      setDocuments(newDocuments);
      setIsAnalyzed(true);
    } catch (err) {
      console.error("Error in processing:", err);
      setError(`Error in processing: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      setFiles(Array.from(e.dataTransfer.files));
      setError(null);
    }
  };

  return (
    <section id="upload" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          Medical Document Analyzer
        </h2>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => document.getElementById("fileInput").click()}
            >
              <p className="text-gray-600 mb-4">
                Drag and drop your medical documents here, or click to select files
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Supported formats: .txt, .docx, .rtf, .md
              </p>
              <input
                id="fileInput"
                type="file"
                multiple
                accept=".txt,.docx,.rtf,.md"
                className="hidden"
                onChange={handleFileChange}
              />
              <button 
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                onClick={(e) => {
                  e.stopPropagation();
                  document.getElementById("fileInput").click();
                }}
              >
                Select Files
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}

            {files.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Selected Files ({files.length})</h3>
                <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                  {files.map((file, index) => (
                    <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                      <div className="w-0 flex-1 flex items-center">
                        <svg className="flex-shrink-0 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                        </svg>
                        <span className="ml-2 flex-1 w-0 truncate">{file.name}</span>
                      </div>
                      <div className="ml-4 flex-shrink-0 text-gray-400">{(file.size / 1024).toFixed(2)} KB</div>
                    </li>
                  ))}
                </ul>
                <div className="mt-4">
                  <button
                    onClick={processFiles}
                    disabled={isProcessing}
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-blue-300 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? "Processing..." : "Analyze Documents"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {isAnalyzed && documents.length > 0 && (
            <div className="mt-8 bg-white p-8 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-6">Analysis Results</h2>
              {documents.map((doc, docIndex) => (
                <div key={docIndex} className="mb-6">
                  <h3 className="font-medium text-lg mb-2">{doc.name}</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    {doc.content.map((sentence, idx) => (
                      <span 
                        key={idx} 
                        className={`${classificationColors[sentence.classification]} rounded px-1 py-0.5 inline`}
                        title={sentence.conditions.length > 0 ? `Related to: ${sentence.conditions.join(', ')}` : ''}
                      >
                        {sentence.text}{' '}
                      </span>
                    ))}
                  </div>
                  {doc.geminiAnalysis && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-md font-medium mb-2">Gemini AI Analysis</h4>
                      <div className="bg-blue-50 p-4 rounded-md text-blue-800">
                        {doc.geminiAnalysis.candidates && doc.geminiAnalysis.candidates[0]?.content?.parts[0]?.text ? (
                          <div className="whitespace-pre-line">
                            {doc.geminiAnalysis.candidates[0].content.parts[0].text}
                          </div>
                        ) : (
                          <p>No analysis available. Please check your API configuration.</p>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="mt-4 flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="inline-block w-3 h-3 bg-green-100 rounded-full mr-1"></span>
                      <span className="text-gray-600">Relevant medical information</span>
                    </div>
                    <div>
                      <span className="inline-block w-3 h-3 bg-yellow-100 rounded-full mr-1"></span>
                      <span className="text-gray-600">Probabilistic statements</span>
                    </div>
                    <div>
                      <span className="inline-block w-3 h-3 bg-red-100 rounded-full mr-1"></span>
                      <span className="text-gray-600">Potential false prescriptions</span>
                    </div>
                    <div>
                      <span className="inline-block w-3 h-3 bg-gray-100 rounded-full mr-1"></span>
                      <span className="text-gray-600">Irrelevant information</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {documents.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium mb-3">Medical Conditions Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {medicalConditions.map(condition => {
                      const count = documents.reduce((acc, doc) => {
                        return acc + doc.content.filter(sentence => 
                          sentence.conditions.includes(condition)
                        ).length;
                      }, 0);
                      
                      return (
                        <div key={condition} className="bg-white p-3 rounded-md border border-gray-200">
                          <div className="font-medium">{condition}</div>
                          <div className="text-sm text-gray-600">
                            {count > 0 ? `${count} mentions found` : 'No mentions found'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default Upload;