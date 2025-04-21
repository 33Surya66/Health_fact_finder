import React from "react";

function Features() {
  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">
              Evidence-Based Information
            </h3>
            <p className="text-gray-600">
              Access reliable, scientifically-backed health information.
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Easy Search</h3>
            <p className="text-gray-600">
              Find health information quickly with our powerful search.
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Verified Sources</h3>
            <p className="text-gray-600">
              All information is verified by medical professionals.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Features;
