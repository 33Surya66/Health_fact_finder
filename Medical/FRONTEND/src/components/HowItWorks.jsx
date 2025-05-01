import React from "react";

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 text-2xl font-bold">1</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Search</h3>
            <p className="text-gray-600">Enter your health-related query</p>
          </div>
          <div className="text-center">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 text-2xl font-bold">2</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Analyze</h3>
            <p className="text-gray-600">Our system processes your query</p>
          </div>
          <div className="text-center">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 text-2xl font-bold">3</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Get Results</h3>
            <p className="text-gray-600">Receive verified information</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
