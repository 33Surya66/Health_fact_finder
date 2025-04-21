import React from "react";

function Analyze() {
  return (
    <section id="analyze" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          Analyze Health Information
        </h2>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600 text-center mb-6">
              Upload medical documents or enter symptoms to get detailed
              analysis and information.
            </p>
            <div className="flex justify-center">
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
                Start Analysis
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Analyze;
