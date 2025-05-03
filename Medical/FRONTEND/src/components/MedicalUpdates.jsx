import React, { useState, useEffect, useRef } from "react";
import { 
  FaHeartbeat, 
  FaThumbsUp, 
  FaUniversity, 
  FaArrowRight, 
  FaArrowLeft, 
  FaSync, 
  FaCalendarAlt, 
  FaTag, 
  FaExternalLinkAlt 
} from "react-icons/fa";
import { fetchMedicalUpdates, saveMedicalUpdatesToStorage, getMedicalUpdatesFromStorage, shouldRefreshMedicalUpdates } from "../services/medicalUpdatesService";

function MedicalUpdates() {
  const scrollRef = useRef(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const [updates, setUpdates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [selectedSource, setSelectedSource] = useState("all");
  const [expandedUpdate, setExpandedUpdate] = useState(null);
  
  // Fetch updates initially and set up periodic checking
  useEffect(() => {
    loadUpdates();
    
    // Set up interval to check if updates should be refreshed (every 3 hours)
    const checkInterval = setInterval(() => {
      if (shouldRefreshMedicalUpdates()) {
        loadUpdates();
      }
    }, 3 * 60 * 60 * 1000); // Check every 3 hours
    
    return () => clearInterval(checkInterval);
  }, []);
  
  // Function to load updates (either from storage or API)
  const loadUpdates = async () => {
    setIsLoading(true);
    
    try {
      let updatesData;
      
      // Check if we should use cached data or fetch new data
      if (shouldRefreshMedicalUpdates()) {
        // Fetch new updates
        const newUpdates = await fetchMedicalUpdates();
        
        // Save to storage with current timestamp
        saveMedicalUpdatesToStorage(newUpdates);
        updatesData = newUpdates;
        
        // Update last fetch time
        setLastFetchTime(new Date().toLocaleString());
      } else {
        // Use cached data
        const storedData = getMedicalUpdatesFromStorage();
        updatesData = storedData.data;
        
        // Update last fetch time from storage
        setLastFetchTime(new Date(storedData.timestamp).toLocaleString());
      }
      
      setUpdates(updatesData);
    } catch (error) {
      console.error("Error loading medical updates:", error);
      // If everything fails, use empty array
      setUpdates([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Manual refresh function
  const handleManualRefresh = () => {
    loadUpdates();
  };
  
  // Calculate maximum scroll value
  useEffect(() => {
    if (scrollRef.current) {
      const scrollWidth = scrollRef.current.scrollWidth;
      const clientWidth = scrollRef.current.clientWidth;
      setMaxScroll(scrollWidth - clientWidth);
    }
  }, [updates, selectedSource]);
  
  // Manual scroll control
  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'right' ? 300 : -300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
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
  
  // Toggle expanded state
  const toggleUpdateExpansion = (updateId) => {
    if (expandedUpdate === updateId) {
      setExpandedUpdate(null);
    } else {
      setExpandedUpdate(updateId);
    }
  };

  // Format the update date
  const formatUpdateDate = (timestamp) => {
    if (!timestamp) return "Recently";
    
    const now = new Date();
    const updateDate = new Date(timestamp);
    const diffTime = Math.abs(now - updateDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  };
  
  // Filter updates by source
  const filteredUpdates = selectedSource === "all" 
    ? updates 
    : updates.filter(update => update.source.toLowerCase().includes(selectedSource));

  return (
    <section id="medical-updates" className="py-16 bg-slate-100">
      <div className="container mx-auto px-4">
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-blue-900 text-center mb-3">
            Latest Medical Updates
          </h2>
          <p className="text-gray-600 text-center max-w-3xl mx-auto">
            Stay informed about the most recent developments in medical research and healthcare
            from trusted sources like Harvard Health, The New England Journal of Medicine, and CDC.
          </p>
        </div>
        
        <div className="max-w-6xl mx-auto mb-12">
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 md:mb-0">
                <FaHeartbeat className="inline-block text-red-500 mr-2" />
                Medical News & Research
              </h3>
              
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center mr-2 bg-gray-100 rounded-lg p-1">
                  <button 
                    onClick={() => setSelectedSource("all")}
                    className={`px-3 py-1 rounded-md text-xs font-medium ${
                      selectedSource === "all" ? 'bg-blue-100 text-blue-800' : 'text-gray-700'
                    }`}
                  >
                    All
                  </button>
                  <button 
                    onClick={() => setSelectedSource("harvard")}
                    className={`px-3 py-1 rounded-md text-xs font-medium ${
                      selectedSource === "harvard" ? 'bg-blue-100 text-blue-800' : 'text-gray-700'
                    }`}
                  >
                    Harvard
                  </button>
                  <button 
                    onClick={() => setSelectedSource("nejm")}
                    className={`px-3 py-1 rounded-md text-xs font-medium ${
                      selectedSource === "nejm" ? 'bg-blue-100 text-blue-800' : 'text-gray-700'
                    }`}
                  >
                    NEJM
                  </button>
                  <button 
                    onClick={() => setSelectedSource("cdc")}
                    className={`px-3 py-1 rounded-md text-xs font-medium ${
                      selectedSource === "cdc" ? 'bg-blue-100 text-blue-800' : 'text-gray-700'
                    }`}
                  >
                    CDC
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleManualRefresh}
                    className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors duration-200 text-gray-700 mr-2"
                    disabled={isLoading}
                  >
                    <FaSync className={`${isLoading ? "animate-spin text-blue-500" : "text-gray-700"}`} />
                  </button>
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
            </div>
            
            {lastFetchTime && (
              <div className="mb-4">
                <p className="text-xs text-gray-500">Last updated: {lastFetchTime}</p>
              </div>
            )}
            
            <div className="relative">
              {isLoading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-blue-200 mb-3"></div>
                    <div className="h-4 bg-blue-100 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-100 rounded w-24"></div>
                  </div>
                </div>
              ) : filteredUpdates.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500">No updates available. Please try refreshing or selecting a different source.</p>
                </div>
              ) : (
                <div 
                  ref={scrollRef}
                  className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide snap-x scroll-smooth"
                  onScroll={handleScrollUpdate}
                >
                  {filteredUpdates.map((update, index) => (
                    <div 
                      key={index} 
                      className={`flex-shrink-0 w-80 snap-start bg-white rounded-lg shadow-sm border transition-all duration-300 ${
                        expandedUpdate === index 
                          ? "border-blue-300 ring-2 ring-blue-200" 
                          : "border-gray-200 hover:shadow-md hover:-translate-y-1"
                      }`}
                      onClick={() => toggleUpdateExpansion(index)}
                    >
                      <div className="p-4">
                        {/* Source badge */}
                        <div className="mb-3">
                          <SourceBadge source={update.source} />
                        </div>
                        
                        {/* Image */}
                        {update.image && (
                          <div className="mb-3 rounded-lg overflow-hidden h-40 bg-gray-100">
                            <img 
                              src={update.image} 
                              alt={update.title} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        
                        {/* Title and content */}
                        <h4 className="font-medium text-gray-800 mb-2 line-clamp-2">{update.title}</h4>
                        <p className="text-gray-700 mb-3 leading-relaxed text-sm line-clamp-3">{update.description}</p>
                        
                        {/* Meta information */}
                        <div className="flex flex-wrap gap-2 mt-2 mb-3">
                          <div className="text-xs text-gray-500 flex items-center">
                            <FaCalendarAlt className="mr-1 w-3 h-3" />
                            {formatUpdateDate(update.pubDate)}
                          </div>
                          {update.category && (
                            <div className="text-xs text-gray-500 flex items-center">
                              <FaTag className="mr-1 w-3 h-3" />
                              {update.category}
                            </div>
                          )}
                        </div>
                        
                        {/* Read more - only shows when expanded */}
                        {expandedUpdate === index && (
                          <div className="mt-4">
                            <a 
                              href={update.link} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Read Full Article
                              <FaExternalLinkAlt className="ml-2 w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex justify-center mt-6">
                <p className="text-sm text-gray-500">
                  {expandedUpdate !== null ? 'Click a card again to collapse' : 'Click any card to see reading options'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="p-6 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 shadow-sm">
            <div className="flex items-start">
              <div className="mr-4 mt-1">
                <FaUniversity className="text-blue-500 text-2xl" />
              </div>
              <div>
                <h3 className="font-bold text-blue-800 text-lg mb-2">Trusted Medical Sources</h3>
                <ul className="space-y-2 text-gray-700">
                  <li><span className="font-medium">Harvard Health Blog:</span> Medical information from experts at Harvard Medical School.</li>
                  <li><span className="font-medium">The New England Journal of Medicine:</span> One of the world's leading medical journals featuring breakthrough research.</li>
                  <li><span className="font-medium">Centers for Disease Control and Prevention (CDC):</span> Official updates on public health matters and disease outbreaks.</li>
                  <li><span className="font-medium">Why these sources?</span> These respected institutions provide evidence-based information vetted by medical professionals.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Helper component for source badges
function SourceBadge({ source }) {
  if (source.toLowerCase().includes('harvard')) {
    return (
      <span className="px-2 py-1 bg-red-50 text-red-700 rounded-md text-xs font-medium inline-flex items-center">
        <FaUniversity className="mr-1" />
        Harvard Health
      </span>
    );
  } else if (source.toLowerCase().includes('nejm') || source.toLowerCase().includes('new england')) {
    return (
      <span className="px-2 py-1 bg-green-50 text-green-700 rounded-md text-xs font-medium inline-flex items-center">
        <FaUniversity className="mr-1" />
        NEJM
      </span>
    );
  } else if (source.toLowerCase().includes('cdc')) {
    return (
      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium inline-flex items-center">
        <FaUniversity className="mr-1" />
        CDC
      </span>
    );
  } else {
    return (
      <span className="px-2 py-1 bg-gray-50 text-gray-700 rounded-md text-xs font-medium inline-flex items-center">
        <FaUniversity className="mr-1" />
        {source}
      </span>
    );
  }
}

export default MedicalUpdates;