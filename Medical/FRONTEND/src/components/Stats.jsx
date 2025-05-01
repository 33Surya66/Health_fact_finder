import React from 'react';

function Stats() {
  return (
    <section id="stats" className="py-20 bg-blue-600">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-white text-center">
          <div>
            <h3 className="text-4xl font-bold mb-2">10,000+</h3>
            <p>Verified Health Facts</p>
          </div>
          <div>
            <h3 className="text-4xl font-bold mb-2">50+</h3>
            <p>Medical Experts</p>
          </div>
          <div>
            <h3 className="text-4xl font-bold mb-2">24/7</h3>
            <p>Information Access</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Stats;
