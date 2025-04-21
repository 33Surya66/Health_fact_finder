import React from 'react';

function Hero() {
  const [searchTerm, setSearchTerm] = React.useState('');
  
  const handleSearch = (e) => {
    e.preventDefault();
    // Search functionality would go here
    console.log('Searching for:', searchTerm);
  };
  
  return (
    <section className="bg-gradient-to-b from-blue-100 to-white py-20 px-4">
      <div className="container mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-blue-800 mb-6">
          Find Reliable Health Information
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto">
          Accurate, evidence-based health facts at your fingertips. 
          Search our database of verified medical information.
        </p>
        
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-12">
          <div className="flex flex-col md:flex-row">
            <input
              type="text"
              placeholder="Search for health topics, symptoms, or treatments..."
              className="flex-1 p-4 rounded-lg md:rounded-r-none text-lg border-2 border-blue-300 focus:border-blue-500 focus:outline-none mb-3 md:mb-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg md:rounded-l-none text-lg transition duration-300"
            >
              Search
            </button>
          </div>
        </form>
        
        <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
          <span>Popular searches:</span>
          <a href="#" className="text-blue-600 hover:text-blue-800">COVID-19</a>
          <a href="#" className="text-blue-600 hover:text-blue-800">Diabetes</a>
          <a href="#" className="text-blue-600 hover:text-blue-800">Heart Disease</a>
          <a href="#" className="text-blue-600 hover:text-blue-800">Mental Health</a>
          <a href="#" className="text-blue-600 hover:text-blue-800">Nutrition</a>
        </div>
      </div>
    </section>
  );
}

export default Hero;
