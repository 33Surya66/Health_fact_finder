import React from "react";

function FAQ() {
  const faqs = [
    {
      question: "How does HealthFact Finder work?",
      answer:
        "HealthFact Finder uses advanced algorithms to search through verified medical databases and provide accurate health information based on your queries.",
    },
    {
      question: "Is the information reliable?",
      answer:
        "Yes, all information is sourced from peer-reviewed medical journals and verified by healthcare professionals.",
    },
    {
      question: "How often is the content updated?",
      answer:
        "Our database is updated daily with the latest medical research and health information.",
    },
  ];

  return (
    <section id="faq" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          Frequently Asked Questions
        </h2>
        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <div key={index} className="mb-6 bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-2">{faq.question}</h3>
              <p className="text-gray-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FAQ;
