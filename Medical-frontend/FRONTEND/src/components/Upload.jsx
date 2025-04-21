import React from "react";

function Upload() {
  return (
    <section id="upload" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          Upload Documents
        </h2>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-gray-600 mb-4">
                Drag and drop your medical documents here, or click to select
                files
              </p>
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
                Select Files
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Upload;
