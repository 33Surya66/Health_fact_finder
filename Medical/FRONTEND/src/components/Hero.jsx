import React, { useState } from 'react';

function Hero() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Connect to our Flask backend API that interfaces with Weaviate
      const response = await fetch('/api/verify-claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ claim: searchTerm }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setSearchResults(data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch medical information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePopularSearch = (term) => {
    setSearchTerm(term);
    // Submit the form programmatically with the selected term
    handleSearch({ preventDefault: () => {} });
  };

  return (
    <section className="bg-gradient-to-b from-blue-100 to-white py-12 px-4">
      <div className="container mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-blue-800 mb-6">
          Find Reliable Health Information
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto">
          Accurate, evidence-based health facts at your fingertips.
          Search our database of verified medical information.
        </p>
        
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
          <div className="flex flex-col md:flex-row">
            <input
              type="text"
              placeholder="Enter a medical fact or claim to verify..."
              className="flex-1 p-4 rounded-lg md:rounded-r-none text-lg border-2 border-blue-300 focus:border-blue-500 focus:outline-none mb-3 md:mb-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg md:rounded-l-none text-lg transition duration-300"
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Verify'}
            </button>
          </div>
        </form>
        
        <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600 mb-8">
          <span>Popular searches:</span>
          <button onClick={() => handlePopularSearch("Vitamin C can cure the common cold")} className="text-blue-600 hover:text-blue-800">Vitamin C & Colds</button>
          <button onClick={() => handlePopularSearch("Diabetes is caused by eating too much sugar")} className="text-blue-600 hover:text-blue-800">Diabetes Causes</button>
          <button onClick={() => handlePopularSearch("Exercise can help reduce symptoms of depression")} className="text-blue-600 hover:text-blue-800">Exercise & Depression</button>
          <button onClick={() => handlePopularSearch("Vaccines cause autism")} className="text-blue-600 hover:text-blue-800">Vaccines & Autism</button>
          <button onClick={() => handlePopularSearch("Drinking water helps with weight loss")} className="text-blue-600 hover:text-blue-800">Water & Weight Loss</button>
        </div>
        
        {error && (
          <div className="max-w-2xl mx-auto p-4 mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
            <p>{error}</p>
          </div>
        )}
        
        {loading && (
          <div className="max-w-2xl mx-auto p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Checking our medical database...</p>
          </div>
        )}
        
        {searchResults && !loading && (
          <div className="max-w-3xl mx-auto mt-8 bg-white p-6 rounded-lg shadow-md text-left">
            <h2 className="text-2xl font-bold text-blue-800 mb-4">Results</h2>
            
            <div className="mb-4">
              <span className="font-medium text-gray-700">You asked about: </span>
              <span className="font-semibold">{searchResults.claim}</span>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-semibold text-lg mb-2">
                  Fact Check Result:
                  <span className={`ml-2 ${
                    searchResults.vector_result.prediction === 'true' ? 'text-green-600' : 
                    searchResults.vector_result.prediction === 'false' ? 'text-red-600' : 
                    'text-yellow-600'
                  }`}>
                    {searchResults.vector_result.prediction === 'true' ? 'TRUE' : 
                     searchResults.vector_result.prediction === 'false' ? 'FALSE' : 
                     'UNCERTAIN'}
                  </span>
                </h3>
                
                <div className="mb-4">
                  <div className="flex items-center mb-1">
                    <div className="w-20 text-sm">True:</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-green-600 h-2.5 rounded-full" 
                        style={{width: `${searchResults.vector_result.true_confidence * 100}%`}}
                      ></div>
                    </div>
                    <div className="ml-2 text-sm">{(searchResults.vector_result.true_confidence * 100).toFixed(1)}%</div>
                  </div>
                  <div className="flex items-center mb-1">
                    <div className="w-20 text-sm">False:</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-red-600 h-2.5 rounded-full" 
                        style={{width: `${searchResults.vector_result.false_confidence * 100}%`}}
                      ></div>
                    </div>
                    <div className="ml-2 text-sm">{(searchResults.vector_result.false_confidence * 100).toFixed(1)}%</div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-20 text-sm">Uncertain:</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-yellow-500 h-2.5 rounded-full" 
                        style={{width: `${searchResults.vector_result.not_known_confidence * 100}%`}}
                      ></div>
                    </div>
                    <div className="ml-2 text-sm">{(searchResults.vector_result.not_known_confidence * 100).toFixed(1)}%</div>
                  </div>
                </div>
              </div>
              
              {searchResults.vector_result.evidence && (
                <div className="bg-blue-50 p-4 rounded-md">
                  <h3 className="font-semibold text-lg mb-2">Medical Information:</h3>
                  <p className="text-gray-700">{searchResults.vector_result.evidence}</p>
                </div>
              )}
              
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500">
                  Our AI analyzes medical databases and research to verify health claims.
                  All information is extracted from legitimate sources including cdc.gov.
                  Always consult with healthcare professionals for personal medical advice.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default Hero;