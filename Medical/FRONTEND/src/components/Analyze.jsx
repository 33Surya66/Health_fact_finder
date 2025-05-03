import React, { useState, useEffect, useRef } from "react";
import { 
  AlertCircle, 
  CheckCircle, 
  HelpCircle, 
  RefreshCw, 
  ExternalLink,
  User,
  ThumbsUp,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  MessageSquare,
  Award
} from "lucide-react";
import { 
  fetchHealthMisinformationPosts, 
  savePostsToStorage, 
  getPostsFromStorage, 
  shouldRefreshPosts 
} from "../services/redditService";

function Analyze() {
  const scrollRef = useRef(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  
  // Fetch posts initially and set up periodic checking
  useEffect(() => {
    loadPosts();
    
    // Set up interval to check if posts should be refreshed (every hour)
    const checkInterval = setInterval(() => {
      if (shouldRefreshPosts()) {
        loadPosts();
      }
    }, 60 * 60 * 1000); // Check every hour
    
    return () => clearInterval(checkInterval);
  }, []);
  
  // Function to load posts (either from storage or API)
  const loadPosts = async () => {
    setIsLoading(true);
    setRefreshing(true);
    
    try {
      let postsData;
      
      // Check if we should use cached data or fetch new data
      if (shouldRefreshPosts()) {
        // Fetch new posts
        const newPosts = await fetchHealthMisinformationPosts();
        
        // Save to storage with current timestamp
        savePostsToStorage(newPosts);
        postsData = newPosts;
        
        // Update last fetch time
        setLastFetchTime(new Date().toLocaleString());
      } else {
        // Use cached data
        const storedData = getPostsFromStorage();
        postsData = storedData.data;
        
        // Update last fetch time from storage
        setLastFetchTime(new Date(storedData.timestamp).toLocaleString());
      }
      
      setPosts(postsData);
      setError(null);
    } catch (error) {
      console.error("Error loading posts:", error);
      setError('Failed to load misinformation data. Please try again later.');
      // If everything fails, use empty array
      setPosts([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  // Manual refresh function
  const handleManualRefresh = () => {
    loadPosts();
  };
  
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
    if (selectedPost && selectedPost.username === post.username) {
      setSelectedPost(null);
    } else {
      setSelectedPost(post);
    }
  };

  // Format the post date to relative time
  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return "Recently";
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);
    
    if (diffSeconds < 60) return 'just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} minutes ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} hours ago`;
    return `${Math.floor(diffSeconds / 86400)} days ago`;
  };

  // Filter posts based on active tab
  const filteredPosts = activeTab === 'all' 
    ? posts 
    : activeTab === 'misinformation' 
      ? posts.filter(post => post.isFalse) 
      : posts.filter(post => !post.isFalse);

  // Render confidence gauge component
  const ConfidenceGauge = ({ falseConf, trueConf, notKnownConf }) => {
    return (
      <div className="mt-4 mb-2">
        <div className="text-xs font-medium text-gray-700 mb-1">Confidence Assessment:</div>
        <div className="space-y-2">
          <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="absolute top-0 left-0 h-full bg-red-400 rounded-l-full" style={{ width: `${falseConf * 100}%` }}></div>
            <span className="absolute left-1 top-0 text-xs font-medium text-gray-600">False</span>
          </div>
          <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="absolute top-0 left-0 h-full bg-green-400 rounded-l-full" style={{ width: `${trueConf * 100}%` }}></div>
            <span className="absolute left-1 top-0 text-xs font-medium text-gray-600">True</span>
          </div>
          <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="absolute top-0 left-0 h-full bg-gray-300 rounded-l-full" style={{ width: `${notKnownConf * 100}%` }}></div>
            <span className="absolute left-1 top-0 text-xs font-medium text-gray-600">Uncertain</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section id="analyze" className="py-16 bg-slate-100">
      <div className="container mx-auto px-4">
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-blue-900 text-center mb-3">
            Analyze Health Misinformation
          </h2>
          <p className="text-gray-600 text-center max-w-3xl mx-auto">
            Exploring common medical misinformation found on Reddit.
            Learn to identify misleading health claims and understand the scientific evidence.
          </p>
        </div>
        
        <div className="max-w-6xl mx-auto mb-12">
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 sm:mb-0">
                <AlertTriangle className="inline-block text-amber-500 mr-2" />
                Health Misinformation Tracker
              </h3>
              
              <div className="flex flex-wrap items-center gap-2">
                {/* Tab controls */}
                <div className="flex bg-gray-100 rounded-lg p-1 mr-2">
                  <button 
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'all' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-800'
                    }`}
                    onClick={() => setActiveTab('all')}
                  >
                    All Posts
                  </button>
                  <button 
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'misinformation' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-800'
                    }`}
                    onClick={() => setActiveTab('misinformation')}
                  >
                    Misinformation
                  </button>
                  <button 
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'valid' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-800'
                    }`}
                    onClick={() => setActiveTab('valid')}
                  >
                    Valid Info
                  </button>
                </div>
                
                {/* Navigation and refresh controls */}
                <button 
                  onClick={handleManualRefresh}
                  className={`p-2 rounded-full transition-colors duration-200 ${
                    refreshing ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  disabled={refreshing}
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
                <button 
                  onClick={() => handleScroll('left')}
                  className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors duration-200 text-gray-700"
                  disabled={scrollPosition <= 5}
                >
                  <ArrowLeft className={`w-4 h-4 ${scrollPosition <= 5 ? 'text-gray-400' : 'text-gray-700'}`} />
                </button>
                <button 
                  onClick={() => handleScroll('right')}
                  className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors duration-200 text-gray-700"
                  disabled={scrollPosition >= maxScroll - 5}
                >
                  <ArrowRight className={`w-4 h-4 ${scrollPosition >= maxScroll - 5 ? 'text-gray-400' : 'text-gray-700'}`} />
                </button>
                <button
                  onClick={() => setIsAutoScrolling(!isAutoScrolling)}
                  className={`px-3 py-1 rounded-md text-xs font-medium ${isAutoScrolling ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                >
                  Auto-Scroll: {isAutoScrolling ? 'ON' : 'OFF'}
                </button>
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
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                  <p className="text-gray-600 mb-3">{error}</p>
                  <button 
                    onClick={handleManualRefresh}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <HelpCircle className="w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">No posts available for the selected filter.</p>
                </div>
              ) : (
                <div 
                  ref={scrollRef}
                  className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide snap-x scroll-smooth"
                  onScroll={handleScrollUpdate}
                >
                  {filteredPosts.map((post, index) => (
                    <div 
                      key={index} 
                      className={`flex-shrink-0 w-80 snap-start bg-white rounded-lg shadow-sm border transition-all duration-300 ${
                        selectedPost && selectedPost.username === post.username 
                          ? "border-blue-300 ring-2 ring-blue-200" 
                          : post.isFalse
                            ? "border-red-100 hover:shadow-md hover:-translate-y-1"
                            : "border-green-100 hover:shadow-md hover:-translate-y-1"
                      }`}
                      onClick={() => togglePostSelection(post)}
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-800 font-bold border border-blue-200 shadow-sm">
                              <User className="w-5 h-5 text-blue-700 opacity-80" />
                            </div>
                            <div className="ml-2">
                              <p className="font-medium text-gray-800">{post.username}</p>
                              <p className="text-xs text-gray-500">{post.subreddit} • {formatRelativeTime(post.created_at)}</p>
                            </div>
                          </div>
                          <div>
                            {post.isFalse ? (
                              <div className="flex items-center px-2 py-1 bg-red-50 text-red-600 text-xs font-medium rounded-full">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                <span>Misinformation</span>
                              </div>
                            ) : (
                              <div className="flex items-center px-2 py-1 bg-green-50 text-green-600 text-xs font-medium rounded-full">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                <span>Valid Info</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <h4 className="font-medium text-gray-800 mb-2">{post.title}</h4>
                        <p className="text-gray-700 mb-3 leading-relaxed text-sm line-clamp-3">{post.content}</p>
                        
                        {selectedPost && selectedPost.username === post.username && (
                          <>
                            {post.isFalse && (
                              <div className="mt-4 mb-3 bg-gradient-to-r from-red-50 to-amber-50 p-4 rounded-md border border-red-100">
                                <h4 className="font-bold text-red-800 mb-2">Scientific Evidence:</h4>
                                <p className="text-gray-700 text-sm">{post.evidence}</p>
                                <p className="text-xs text-red-700 mt-2 font-medium">Category: {post.category}</p>
                              </div>
                            )}
                            
                            <ConfidenceGauge 
                              falseConf={post.false_confidence || (post.isFalse ? 0.8 : 0.1)} 
                              trueConf={post.true_confidence || (post.isFalse ? 0.1 : 0.7)} 
                              notKnownConf={post.not_known_confidence || 0.2} 
                            />
                            
                            {post.permalink && (
                              <div className="mt-3">
                                <a 
                                  href={`https://reddit.com${post.permalink}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                                >
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  View on Reddit
                                </a>
                              </div>
                            )}
                          </>
                        )}
                        
                        <div className="flex justify-between items-center mt-4">
                          <div className="flex items-center gap-3 text-gray-500 text-xs">
                            <div className="flex items-center">
                              <ThumbsUp className="w-3 h-3 mr-1" />
                              <span>{post.score}</span>
                            </div>
                            <div className="flex items-center">
                              <MessageSquare className="w-3 h-3 mr-1" />
                              <span>{post.comments}</span>
                            </div>
                            {post.awards > 0 && (
                              <div className="flex items-center">
                                <Award className="w-3 h-3 mr-1 text-amber-500" />
                                <span>{post.awards}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex justify-center mt-6">
                <p className="text-sm text-gray-500">
                  {selectedPost ? 'Click a card again to collapse details' : 'Click any card to see scientific evidence and confidence assessment'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="p-6 rounded-xl bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-400 shadow-sm">
            <div className="flex items-start">
              <div className="mr-4 mt-1">
                <AlertTriangle className="text-yellow-500 text-2xl" />
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