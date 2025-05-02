import React, { useState, useEffect, useRef } from "react";
import { FaUser, FaThumbsUp, FaExclamationTriangle, FaArrowRight, FaArrowLeft } from "react-icons/fa";

function Analyze() {
  const scrollRef = useRef(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const posts = [
    {
      username: "HealthGuru42",
      content: "Drinking lemon water with baking soda can cure cancer by alkalizing your blood. The cancer cells can't survive in an alkaline environment!",
      likes: 127,
      isFalse: true,
      evidence: "Blood pH is tightly regulated by the body. Consuming alkaline foods or drinks cannot significantly change blood pH, and cancer cells can adapt to various pH environments. This claim contradicts fundamental principles of human physiology."
    },
    {
      username: "NaturalMedicine2023",
      content: "Vaccines contain microchips that allow the government to track your movements. This is why 5G towers were built at the same time as COVID vaccines.",
      likes: 84,
      isFalse: true,
      evidence: "Vaccines do not contain microchips. The components of vaccines are well-documented and monitored by regulatory agencies. Microchips small enough to fit through a needle would not have the power source or technology to track individuals."
    },
    {
      username: "TruthSeeker777",
      content: "You can detox your body from toxins by placing onions in your socks while you sleep. The onions will turn black as they absorb all the toxins through your feet!",
      likes: 241,
      isFalse: true,
      evidence: "The human body detoxifies itself primarily through the liver and kidneys. There is no scientific evidence that toxins can be drawn out through the feet. Discoloration of onions is due to oxidation, not toxin absorption."
    },
    {
      username: "WellnessWarrior",
      content: "Taking vitamin C megadoses (10,000mg daily) will prevent you from getting any viral infections. Big Pharma doesn't want you to know this!",
      likes: 319,
      isFalse: true,
      evidence: "While vitamin C is important for immune function, high doses have not been proven to prevent viral infections. The body can only absorb a limited amount of vitamin C, and excess is typically excreted. High doses can cause digestive issues and kidney stones."
    },
    {
      username: "HolisticHealer",
      content: "Autism is caused by too many vaccines given at once. The mercury in vaccines overloads the child's immune system causing permanent brain damage.",
      likes: 156,
      isFalse: true,
      evidence: "Multiple large-scale studies have found no link between vaccines and autism. Modern vaccines for children no longer contain mercury (thimerosal). The original study suggesting this link was retracted due to serious procedural and ethical concerns."
    }
  ];
  
  // Calculate maximum scroll value
  useEffect(() => {
    if (scrollRef.current) {
      const scrollWidth = scrollRef.current.scrollWidth;
      const clientWidth = scrollRef.current.clientWidth;
      setMaxScroll(scrollWidth - clientWidth);
    }
  }, [posts]);
  
  // Manual scroll control
  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'right' ? 300 : -300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      // Removed setting isAutoScrolling to false when manually scrolling
    }
  };
  
  // Update scroll position
  const handleScrollUpdate = () => {
    if (scrollRef.current) {
      setScrollPosition(scrollRef.current.scrollLeft);
    }
  };
  
  // Auto-scroll effect
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    let animationId;
    
    const scroll = () => {
      if (scrollContainer && isAutoScrolling) {
        scrollContainer.scrollLeft += 1;
        setScrollPosition(scrollContainer.scrollLeft);
        
        // Reset scroll position when reaching the end
        if (scrollContainer.scrollLeft >= scrollContainer.scrollWidth - scrollContainer.clientWidth - 5) {
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

  // Handle selected post and expanded state
  const [selectedPost, setSelectedPost] = useState(null);
  
  const togglePostSelection = (post) => {
    // Removed setIsAutoScrolling(false) to keep auto-scrolling on
    if (selectedPost && selectedPost.username === post.username) {
      setSelectedPost(null);
    } else {
      setSelectedPost(post);
    }
  };

  return (
    <section id="analyze" className="py-16 bg-slate-100">
      <div className="container mx-auto px-4">
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-blue-900 text-center mb-3">
            Analyze Health Misinformation
          </h2>
          <p className="text-gray-600 text-center max-w-3xl mx-auto">
            Exploring common medical misinformation found on social media platforms. 
            Learn to identify misleading health claims and understand the scientific evidence.
          </p>
        </div>
        
        <div className="max-w-6xl mx-auto mb-12">
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">
                <FaExclamationTriangle className="inline-block text-amber-500 mr-2" />
                Common Medical Misinformation
              </h3>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleScroll('left')}
                  className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors duration-200 text-gray-700"
                  disabled={scrollPosition <= 5}
                >
                  <FaArrowLeft className={scrollPosition <= 5 ? "text-gray-400" : "text-gray-700"} />
                </button>
                <button 
                  onClick={() => handleScroll('right')}
                  className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors duration-200 text-gray-700"
                  disabled={scrollPosition >= maxScroll - 5}
                >
                  <FaArrowRight className={scrollPosition >= maxScroll - 5 ? "text-gray-400" : "text-gray-700"} />
                </button>
                <button
                  onClick={() => setIsAutoScrolling(!isAutoScrolling)}
                  className={`ml-2 px-3 py-1 rounded-md text-xs font-medium ${isAutoScrolling ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                >
                  Auto-Scroll: {isAutoScrolling ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
            
            <div className="relative">
              <div 
                ref={scrollRef}
                className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide snap-x scroll-smooth"
                onScroll={handleScrollUpdate}
                // Removed mouse enter/leave handlers that controlled auto-scrolling
              >
                {posts.map((post, index) => (
                  <div 
                    key={index} 
                    className={`flex-shrink-0 w-80 snap-start bg-white rounded-lg shadow-sm border transition-all duration-300 ${
                      selectedPost && selectedPost.username === post.username 
                        ? "border-blue-300 ring-2 ring-blue-200" 
                        : "border-gray-200 hover:shadow-md hover:-translate-y-1"
                    }`}
                    onClick={() => togglePostSelection(post)}
                  >
                    <div className="p-4">
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-800 font-bold border border-blue-200 shadow-sm">
                          <FaUser className="text-blue-700 opacity-80" />
                        </div>
                        <div className="ml-2">
                          <p className="font-medium text-gray-800">u/{post.username}</p>
                          <p className="text-xs text-gray-500">Posted 2 days ago</p>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-3 leading-relaxed">{post.content}</p>
                      
                      {selectedPost && selectedPost.username === post.username && (
                        <div className="mt-4 mb-3 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-md border border-blue-100">
                          <h4 className="font-bold text-blue-800 mb-2">Scientific Evidence:</h4>
                          <p className="text-gray-700 text-sm">{post.evidence}</p>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center mt-4">
                        <div className="flex items-center text-gray-500 text-sm">
                          <FaThumbsUp className="w-4 h-4 mr-1" />
                          <span>{post.likes} likes</span>
                        </div>
                        
                        {post.isFalse && (
                          <div className="flex items-center text-red-600 text-xs font-medium bg-red-50 px-2 py-1 rounded-full">
                            <FaExclamationTriangle className="w-3 h-3 mr-1" />
                            <span>Misinformation</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-center mt-6">
                <p className="text-sm text-gray-500">
                  {selectedPost ? 'Click a card again to collapse details' : 'Click any card to see scientific evidence'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="p-6 rounded-xl bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-400 shadow-sm">
            <div className="flex items-start">
              <div className="mr-4 mt-1">
                <FaExclamationTriangle className="text-yellow-500 text-2xl" />
              </div>
              <div>
                <h3 className="font-bold text-amber-800 text-lg mb-2">How to Identify Health Misinformation</h3>
                <ul className="space-y-2 text-gray-700">
                  <li><span className="font-medium">Check the source:</span> Verify if information comes from reputable health organizations or medical journals.</li>
                  <li><span className="font-medium">Look for scientific evidence:</span> Claims should be backed by peer-reviewed studies, not anecdotes.</li>
                  <li><span className="font-medium">Watch for sensationalism:</span> Phrases like "miracle cure" or "what doctors don't want you to know" are red flags.</li>
                  <li><span className="font-medium">Consult healthcare professionals:</span> Always discuss health decisions with qualified medical providers.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Analyze;