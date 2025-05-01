import React, { useState, useEffect, useRef } from "react";

function Analyze() {
  const scrollRef = useRef(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  
  // Sample medical misinformation posts with usernames
  const posts = [
    {
      username: "HealthGuru42",
      content: "Drinking lemon water with baking soda can cure cancer by alkalizing your blood. The cancer cells can't survive in an alkaline environment!",
      likes: 127,
      isFalse: true
    },
    {
      username: "NaturalMedicine2023",
      content: "Vaccines contain microchips that allow the government to track your movements. This is why 5G towers were built at the same time as COVID vaccines.",
      likes: 84,
      isFalse: true
    },
    {
      username: "TruthSeeker777",
      content: "You can detox your body from toxins by placing onions in your socks while you sleep. The onions will turn black as they absorb all the toxins through your feet!",
      likes: 241,
      isFalse: true
    },
    {
      username: "WellnessWarrior",
      content: "Taking vitamin C megadoses (10,000mg daily) will prevent you from getting any viral infections. Big Pharma doesn't want you to know this!",
      likes: 319,
      isFalse: true
    },
    {
      username: "HolisticHealer",
      content: "Autism is caused by too many vaccines given at once. The mercury in vaccines overloads the child's immune system causing permanent brain damage.",
      likes: 156,
      isFalse: true
    }
  ];
  
  // Auto-scroll effect
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    let animationId;
    
    const scroll = () => {
      if (scrollContainer && isAutoScrolling) {
        scrollContainer.scrollLeft += 1;
        
        // Reset scroll position when reaching the end
        if (scrollContainer.scrollLeft >= scrollContainer.scrollWidth - scrollContainer.clientWidth) {
          scrollContainer.scrollLeft = 0;
        }
        
        animationId = requestAnimationFrame(scroll);
      }
    };
    
    animationId = requestAnimationFrame(scroll);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isAutoScrolling]);

  return (
    <section id="analyze" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          Analyze Health Information
        </h2>
        
        <div className="max-w-6xl mx-auto mb-12">
          <h3 className="text-xl font-semibold mb-4">Common Medical Misinformation</h3>
          <div className="relative">
            <div 
              ref={scrollRef}
              className="flex overflow-x-auto pb-4 gap-4 scrollbar-hide"
              onMouseEnter={() => setIsAutoScrolling(false)}
              onMouseLeave={() => setIsAutoScrolling(true)}
            >
              {posts.map((post, index) => (
                <div key={index} className="flex-shrink-0 w-80 bg-white p-4 rounded-lg shadow-md border border-gray-200">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
                      {post.username.charAt(0)}
                    </div>
                    <div className="ml-2">
                      <p className="font-medium text-gray-800">u/{post.username}</p>
                      <p className="text-xs text-gray-500">Posted 2 days ago</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-3">{post.content}</p>
                  
                  {post.isFalse && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-2 mb-3">
                      <p className="text-red-700 text-sm font-medium">Misinformation Alert: This claim is false and not supported by scientific evidence.</p>
                    </div>
                  )}
                  
                  <div className="flex items-center text-gray-500 text-sm">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12.586l-4.293-4.293-1.414 1.414L10 15.414l5.707-5.707-1.414-1.414z" />
                    </svg>
                    <span>{post.likes} likes</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* <div className="max-w-4xl mx-auto">
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
        </div> */}
      </div>
    </section>
  );
}

export default Analyze;