import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, HelpCircle, RefreshCw, ExternalLink } from 'lucide-react';
import './RedditMisinformationWidget.css';

const RedditMisinformationWidget = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch misinformation posts from the API
  const fetchMisinformationPosts = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/misinformation');
      if (!response.ok) {
        throw new Error('Failed to fetch misinformation data');
      }
      const data = await response.json();
      setPosts(data.posts || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching misinformation data:', err);
      setError('Failed to load misinformation data. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchMisinformationPosts();
  }, []);

  // Filter posts based on active tab
  const filteredPosts = activeTab === 'all' 
    ? posts 
    : activeTab === 'misinformation' 
      ? posts.filter(post => post.isFalse) 
      : posts.filter(post => !post.isFalse);

  // Format date to relative time (e.g., "2 days ago")
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);
    
    if (diffSeconds < 60) return 'just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} minutes ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} hours ago`;
    return `${Math.floor(diffSeconds / 86400)} days ago`;
  };

  // Handle refresh button click
  const handleRefresh = () => {
    fetchMisinformationPosts();
  };

  // Render confidence gauge
  const ConfidenceGauge = ({ falseConf, trueConf, notKnownConf }) => {
    return (
      <div className="confidence-gauge">
        <div className="gauge-label">Confidence Assessment:</div>
        <div className="gauge-bars">
          <div className="gauge-bar">
            <div className="gauge-fill false" style={{ width: `${falseConf * 100}%` }}></div>
            <span className="gauge-label">False</span>
          </div>
          <div className="gauge-bar">
            <div className="gauge-fill true" style={{ width: `${trueConf * 100}%` }}></div>
            <span className="gauge-label">True</span>
          </div>
          <div className="gauge-bar">
            <div className="gauge-fill unknown" style={{ width: `${notKnownConf * 100}%` }}></div>
            <span className="gauge-label">Uncertain</span>
          </div>
        </div>
      </div>
    );
  };

  // Render post card
  const PostCard = ({ post }) => (
    <div className={`post-card ${post.isFalse ? 'false-info' : 'true-info'}`}>
      <div className="post-header">
        <div className="post-meta">
          <span className="subreddit">{post.subreddit}</span>
          <span className="username">u/{post.username}</span>
          <span className="date">{formatRelativeTime(post.created_at)}</span>
        </div>
        <div className="post-status">
          {post.isFalse ? (
            <div className="status-icon false">
              <AlertCircle size={18} />
              <span>Likely Misinformation</span>
            </div>
          ) : (
            <div className="status-icon true">
              <CheckCircle size={18} />
              <span>Potentially Valid</span>
            </div>
          )}
        </div>
      </div>
      
      <h3 className="post-title">{post.title}</h3>
      
      {post.content && (
        <div className="post-content">
          {post.content.length > 250 
            ? `${post.content.substring(0, 250)}...` 
            : post.content}
        </div>
      )}
      
      <div className="post-engagement">
        <span className="score">↑ {post.score} points</span>
        <span className="comments">{post.comments} comments</span>
        {post.awards > 0 && <span className="awards">🏆 {post.awards}</span>}
      </div>
      
      {post.isFalse && (
        <div className="fact-check">
          <h4>
            <AlertCircle size={16} />
            Health Fact Check: {post.category}
          </h4>
          <p>{post.evidence}</p>
        </div>
      )}
      
      <ConfidenceGauge 
        falseConf={post.false_confidence || 0.1} 
        trueConf={post.true_confidence || 0.1} 
        notKnownConf={post.not_known_confidence || 0.8} 
      />
      
      <div className="post-footer">
        <a 
          href={`https://reddit.com${post.permalink}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="view-source"
        >
          <ExternalLink size={16} />
          View on Reddit
        </a>
      </div>
    </div>
  );

  return (
    <div className="reddit-misinformation-widget">
      <div className="widget-header">
        <h2>Health Misinformation Tracker</h2>
        <div className="widget-tabs">
          <button 
            className={activeTab === 'all' ? 'active' : ''} 
            onClick={() => setActiveTab('all')}
          >
            All Posts
          </button>
          <button 
            className={activeTab === 'misinformation' ? 'active' : ''} 
            onClick={() => setActiveTab('misinformation')}
          >
            Misinformation
          </button>
          <button 
            className={activeTab === 'valid' ? 'active' : ''} 
            onClick={() => setActiveTab('valid')}
          >
            Valid Info
          </button>
        </div>
        <button 
          className={`refresh-button ${refreshing ? 'refreshing' : ''}`}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw size={16} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      <div className="widget-content">
        {loading && !refreshing ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading health misinformation data...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <AlertCircle size={24} />
            <p>{error}</p>
            <button onClick={handleRefresh}>Try Again</button>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="empty-state">
            <HelpCircle size={24} />
            <p>No posts found for the selected filter.</p>
          </div>
        ) : (
          <div className="posts-grid">
            {filteredPosts.map((post, index) => (
              <PostCard key={index} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RedditMisinformationWidget;