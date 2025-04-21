import React from "react";

function About() {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          About HealthFact Finder
        </h2>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-gray-600 mb-6">
            HealthFact Finder is your trusted source for accurate and reliable
            health information. Our mission is to make evidence-based health
            knowledge accessible to everyone.
          </p>
          <p className="text-gray-600">
            We work with medical professionals and healthcare experts to ensure
            all information is accurate, up-to-date, and easy to understand.
          </p>
        </div>
      </div>
    </section>
  );
}

export default About;
