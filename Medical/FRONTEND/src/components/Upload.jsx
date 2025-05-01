import React, { useState } from "react";
import * as mammoth from 'mammoth';

function Upload() {
  const [files, setFiles] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [error, setError] = useState(null);

  // Simulated verification function
  const verifyDocument = (text) => {
    // Split the text into sentences
    const sentences = text.split(/(?<=[.!?])\s+/);
    
    // For demo purposes, simulate verification
    return sentences.map(sentence => ({
      text: sentence,
      isTrue: Math.random() > 0.3, // 70% true for demonstration
    }));
  };

  // Extract text based on file type
  const extractTextFromFile = async (file) => {
    try {
      const fileType = file.name.split('.').pop().toLowerCase();
      
      if (['docx'].includes(fileType)) {
        // Handle Word documents using mammoth
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value; // This is the plain text content
      } else if (['txt', 'md', 'rtf'].includes(fileType)) {
        // Handle plain text files
        return await file.text();
      } else {
        // For unsupported file types
        throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (err) {
      console.error("Error extracting text:", err);
      throw err;
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
      // Process each file
      for (const file of files) {
        try {
          const content = await extractTextFromFile(file);
          const verifiedContent = verifyDocument(content);
          
          newDocuments.push({
            name: file.name,
            content: verifiedContent
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
          Upload Documents
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
                    {isProcessing ? "Processing..." : "Verify Documents"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {isAnalyzed && documents.length > 0 && (
            <div className="mt-8 bg-white p-8 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-6">Verification Results</h2>
              {documents.map((doc, docIndex) => (
                <div key={docIndex} className="mb-6">
                  <h3 className="font-medium text-lg mb-2">{doc.name}</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    {doc.content.map((sentence, idx) => (
                      <span 
                        key={idx} 
                        className={`${sentence.isTrue ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} rounded px-1 py-0.5 inline`}
                      >
                        {sentence.text}{' '}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-between text-sm">
                    <div>
                      <span className="inline-block w-3 h-3 bg-green-100 rounded-full mr-1"></span>
                      <span className="text-gray-600">True statements</span>
                    </div>
                    <div>
                      <span className="inline-block w-3 h-3 bg-red-100 rounded-full mr-1"></span>
                      <span className="text-gray-600">False or uncertain statements</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default Upload;