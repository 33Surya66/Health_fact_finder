import React, { useState, useEffect } from 'react';
import { FaReddit, FaArrowUp, FaArrowDown, FaComment } from 'react-icons/fa';

// Probabilistic trie for username generation
class TrieNode {
  constructor() {
    this.children = {};
    this.isEndOfWord = false;
    this.probability = 0;
  }
}

class ProbabilisticTrie {
  constructor() {
    this.root = new TrieNode();
    this.prefixes = [
      "health", "doc", "med", "dr", "nurse", "patient", "fit", "wellness", 
      "bio", "life", "cure", "heal", "care", "body", "mind", "organic"
    ];
    this.suffixes = [
      "guru", "pro", "expert", "fan", "lover", "geek", "nerd", "master",
      "guy", "gal", "enthusiast", "advocate", "coach", "buff", "junkie"
    ];
    this.numbers = ["123", "420", "69", "777", "911", "2020", "1337", "101", "007"];
    
    // Build the trie with common username patterns
    this.buildTrie();
  }

  buildTrie() {
    // Add prefix + suffix combinations
    for (const prefix of this.prefixes) {
      for (const suffix of this.suffixes) {
        this.insert(`${prefix}${suffix}`);
      }
    }
    
    // Add prefix + number combinations
    for (const prefix of this.prefixes) {
      for (const num of this.numbers) {
        this.insert(`${prefix}${num}`);
      }
    }
    
    // Add suffix + number combinations
    for (const suffix of this.suffixes) {
      for (const num of this.numbers) {
        this.insert(`${suffix}${num}`);
      }
    }
  }

  insert(word) {
    let node = this.root;
    for (const char of word) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
    }
    node.isEndOfWord = true;
  }

  generateRandomUsername() {
    // 70% chance to use trie pattern, 30% chance for completely random
    if (Math.random() < 0.7) {
      const prefix = this.prefixes[Math.floor(Math.random() * this.prefixes.length)];
      
      // Decide between suffix or number (or both)
      const pattern = Math.random();
      if (pattern < 0.4) {
        // prefix + suffix
        const suffix = this.suffixes[Math.floor(Math.random() * this.suffixes.length)];
        return `${prefix}${suffix}`;
      } else if (pattern < 0.7) {
        // prefix + number
        const num = this.numbers[Math.floor(Math.random() * this.numbers.length)];
        return `${prefix}${num}`;
      } else {
        // prefix + suffix + number
        const suffix = this.suffixes[Math.floor(Math.random() * this.suffixes.length)];
        const num = this.numbers[Math.floor(Math.random() * this.numbers.length)];
        return `${prefix}${suffix}${num}`;
      }
    } else {
      // Completely random username
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      const length = Math.floor(Math.random() * 8) + 5; // 5-12 chars
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }
  }
}

function RedditMisinformationWithVerification() {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const usernameGenerator = new ProbabilisticTrie();
  
  // Health misinformation topics and claims (all false statements)
  const healthMisinformationData = [
    {
      title: "I stopped taking all my medications and cured my diabetes with this one herb",
      content: "Doctors don't want you to know this but I've been completely cured after taking this special herb from South America. Big pharma is keeping this secret from you!",
      subreddit: "r/AlternativeHealth",
      claim: "Diabetes can be cured with herbs alone",
      evidence: "Diabetes is a chronic condition that requires medical management. While some herbs may have mild effects on blood glucose, none have been scientifically proven to cure diabetes. Stopping prescribed medications can lead to serious complications including diabetic ketoacidosis, which can be fatal.",
      false_confidence: 0.93,
      true_confidence: 0.02,
      not_known_confidence: 0.05
    },
    {
      title: "Vaccines actually caused the outbreak they were supposed to prevent",
      content: "My cousin works at a hospital and said almost everyone coming in with the illness was actually vaccinated. The media won't report this!",
      subreddit: "r/HealthTruth",
      claim: "Vaccines cause the diseases they're meant to prevent",
      evidence: "Vaccines contain either killed or weakened forms of pathogens that cannot cause the full disease in healthy individuals. When breakthrough infections occur in vaccinated populations, it's typically due to waning immunity or viral mutations, not the vaccine itself causing the disease.",
      false_confidence: 0.98,
      true_confidence: 0.01,
      not_known_confidence: 0.01
    },
    {
      title: "5G towers are causing cancer rates to spike in neighborhoods",
      content: "I've compiled data showing cancer rates are 400% higher in areas with 5G towers. I contacted the FCC but they're in on it with telecom companies.",
      subreddit: "r/RadiationDangers",
      claim: "5G towers cause cancer",
      evidence: "Multiple scientific studies have found no causal link between 5G networks and cancer. 5G radio waves are non-ionizing radiation, which means they don't have enough energy to damage DNA directly. The World Health Organization and international radiation protection agencies continue to monitor research but have found no evidence of health risks at exposure levels below international guidelines.",
      false_confidence: 0.95,
      true_confidence: 0.01,
      not_known_confidence: 0.04
    },
    {
      title: "Drinking your own urine has reversed my arthritis completely",
      content: "Started urine therapy 6 months ago and my doctor was shocked when all inflammation markers disappeared. Ancient cultures knew this worked!",
      subreddit: "r/NaturalHealing",
      claim: "Drinking urine cures arthritis",
      evidence: "There is no scientific evidence supporting urine therapy for arthritis or any other medical condition. Urine contains waste products the body has already filtered out, and drinking it can lead to dehydration and electrolyte imbalances. It may also reintroduce toxins the body was trying to eliminate.",
      false_confidence: 0.97,
      true_confidence: 0.01,
      not_known_confidence: 0.02
    },
    {
      title: "Hospitals are paid to list COVID on death certificates",
      content: "My uncle died of a heart attack but they listed COVID. A nurse told my family they get $30k extra for each COVID death they report.",
      subreddit: "r/MedicalConspiracies",
      claim: "Hospitals are paid to falsify COVID death certificates",
      evidence: "While hospitals received higher Medicare payments for COVID-19 patients due to the increased cost of treatment, there is no evidence of widespread fraudulent reporting. Death certificates are legal documents, and falsifying them is a criminal offense. Multiple reviews by medical examiners have confirmed the accuracy of COVID-19 death reporting.",
      false_confidence: 0.89,
      true_confidence: 0.03,
      not_known_confidence: 0.08
    },
    {
      title: "This cheap supplement completely replaced my heart medication",
      content: "My blood pressure dropped 40 points in just 3 days after taking this supplement. My doctor tried to convince me to keep taking meds but I showed him the results.",
      subreddit: "r/BiohackingSecrets",
      claim: "Supplements can replace prescription heart medications",
      evidence: "Dietary supplements are not regulated with the same rigor as pharmaceuticals and cannot be recommended as replacements for prescribed medications. While some supplements may have mild effects on blood pressure or cholesterol, stopping prescribed heart medications can lead to serious complications including heart attack or stroke. Always consult with a healthcare provider before changing medication regimens.",
      false_confidence: 0.91,
      true_confidence: 0.03,
      not_known_confidence: 0.06
    },
    {
      title: "They're putting chemicals in food that make us dependent on pharmaceuticals",
      content: "I worked for a major food company and saw the documents. They add substances that slowly damage organs so we need medication later in life.",
      subreddit: "r/FoodTruth",
      claim: "Food companies deliberately add harmful chemicals to make people need medications",
      evidence: "Food additives must undergo safety testing and receive approval from regulatory agencies like the FDA before being allowed in food products. While some food additives may have health concerns in very high doses, there is no evidence of a conspiracy between food companies and pharmaceutical companies to deliberately harm consumers. Such actions would violate numerous laws and regulations.",
      false_confidence: 0.94,
      true_confidence: 0.01,
      not_known_confidence: 0.05
    },
    {
      title: "Cancer is actually a fungus and can be cured with baking soda",
      content: "Italian doctor discovered cancer is actually a fungal infection. I've been treating mine with alkaline baking soda solution and tumors are shrinking!",
      subreddit: "r/CancerAlternatives",
      claim: "Cancer is a fungus that can be cured with baking soda",
      evidence: "Cancer is not a fungal infection but a disease characterized by abnormal cell growth and division. The claim that cancer is a fungus has been thoroughly debunked by oncologists and pathologists. Baking soda cannot cure cancer and relying on such treatments instead of evidence-based medical care can delay proper treatment and worsen outcomes.",
      false_confidence: 0.99,
      true_confidence: 0.01,
      not_known_confidence: 0.00
    },
    {
      title: "Dentists are deliberately causing cavities during cleanings",
      content: "Former dental assistant here. They scratch your enamel during cleanings so you'll need fillings later. It's how they maintain repeat business.",
      subreddit: "r/DentalScams",
      claim: "Dentists deliberately damage teeth during cleanings",
      evidence: "Dental professionals are bound by ethical codes and licenses that require them to act in the best interest of patients. Professional dental tools are designed specifically to remove plaque and tartar without damaging tooth enamel. Multiple studies on dental hygiene practices show that regular cleanings reduce, rather than increase, the need for dental interventions.",
      false_confidence: 0.96,
      true_confidence: 0.01,
      not_known_confidence: 0.03
    },
    {
      title: "This ancient breathing technique cured my chronic fatigue in just 3 days",
      content: "After struggling for years with doctors who couldn't help, I discovered this breathing method from a monk. Energy levels through the roof now!",
      subreddit: "r/EnergyHealing",
      claim: "Breathing techniques can completely cure chronic fatigue syndrome in days",
      evidence: "While breathing exercises may provide some benefit for energy levels and stress management, they are not a cure for chronic fatigue syndrome (CFS), which is a complex condition that typically requires multidisciplinary treatment. CFS has multiple potential causes and mechanisms, and no single intervention has been shown to fully resolve symptoms in a matter of days.",
      false_confidence: 0.87,
      true_confidence: 0.04,
      not_known_confidence: 0.09
    }
  ];
  
  useEffect(() => {
    // Generate fake posts with random usernames and scores
    const generatedPosts = healthMisinformationData.map(post => {
      return {
        ...post,
        username: usernameGenerator.generateRandomUsername(),
        score: Math.floor(Math.random() * 10000) - 2000, // Score between -2000 and 8000
        comments: Math.floor(Math.random() * 500), // 0-500 comments
        timePosted: `${Math.floor(Math.random() * 24) + 1} hours ago`,
        awards: Math.floor(Math.random() * 5) // 0-4 awards
      };
    });
    
    // Shuffle the posts
    const shuffledPosts = generatedPosts.sort(() => Math.random() - 0.5);
    setPosts(shuffledPosts);
  }, []);
  
  const handlePostClick = (post) => {
    setSelectedPost(post);
    // Scroll to top of verification section
    const verificationSection = document.getElementById('verification-section');
    if (verificationSection) {
      verificationSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="bg-blue-800 text-white p-4">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold flex items-center">
            <FaReddit className="mr-2" /> Health Misinformation Detector
          </h1>
          <p className="text-blue-100 mt-2">Learn to identify and verify dubious health claims</p>
        </div>
      </header>

      {/* Verification Result Section */}
      {selectedPost && (
        <section id="verification-section" className="py-6 bg-white border-b border-gray-200">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold text-blue-800 mb-4">Fact Check Results</h2>
              
              <div className="mb-4">
                <span className="font-medium text-gray-700">Claim analyzed: </span>
                <span className="font-semibold">{selectedPost.claim}</span>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-semibold text-lg mb-2">
                    Fact Check Result:
                    <span className="ml-2 text-red-600">FALSE</span>
                  </h3>
                  
                  <div className="mb-4">
                    <div className="flex items-center mb-1">
                      <div className="w-20 text-sm">True:</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-green-600 h-2.5 rounded-full" 
                          style={{width: `${selectedPost.true_confidence * 100}%`}}
                        ></div>
                      </div>
                      <div className="ml-2 text-sm">{(selectedPost.true_confidence * 100).toFixed(1)}%</div>
                    </div>
                    <div className="flex items-center mb-1">
                      <div className="w-20 text-sm">False:</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-red-600 h-2.5 rounded-full" 
                          style={{width: `${selectedPost.false_confidence * 100}%`}}
                        ></div>
                      </div>
                      <div className="ml-2 text-sm">{(selectedPost.false_confidence * 100).toFixed(1)}%</div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-20 text-sm">Uncertain:</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-yellow-500 h-2.5 rounded-full" 
                          style={{width: `${selectedPost.not_known_confidence * 100}%`}}
                        ></div>
                      </div>
                      <div className="ml-2 text-sm">{(selectedPost.not_known_confidence * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-md">
                  <h3 className="font-semibold text-lg mb-2">Medical Information:</h3>
                  <p className="text-gray-700">{selectedPost.evidence}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Reddit Posts Section */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <div className="section-header mb-8">
            <h2 className="text-3xl font-bold text-blue-800 flex items-center mb-4">
              <FaReddit className="mr-2 text-red-500" /> Health Misinformation Examples
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl">
              Below are examples of health misinformation commonly found on social media.
              Click on any post to view its fact check analysis.
            </p>
          </div>

          <div className="posts-container space-y-6 max-w-4xl mx-auto">
            {posts.map((post, index) => (
              <div key={index} className="reddit-post bg-white rounded-lg shadow-md overflow-hidden flex cursor-pointer hover:shadow-lg transition-shadow duration-200" onClick={() => handlePostClick(post)}>
                <div className="vote-section bg-gray-50 p-3 text-center flex flex-col items-center">
                  <FaArrowUp className="text-gray-400 hover:text-orange-500" />
                  <span className={`font-medium my-2 ${post.score > 0 ? 'text-orange-500' : 'text-blue-500'}`}>
                    {Math.abs(post.score) > 999 
                      ? `${(Math.abs(post.score)/1000).toFixed(1)}k` 
                      : Math.abs(post.score)}
                  </span>
                  <FaArrowDown className="text-gray-400 hover:text-blue-500" />
                </div>
                
                <div className="post-content p-4 flex-1">
                  <div className="post-header text-sm text-gray-500 mb-2">
                    <span className="subreddit font-medium text-blue-600">{post.subreddit}</span>
                    <span className="post-info ml-2">
                      Posted by u/{post.username} • {post.timePosted}
                      {post.awards > 0 && <span className="awards ml-2">🏅 {post.awards}</span>}
                    </span>
                  </div>
                  
                  <h3 className="post-title text-xl font-medium mb-2">{post.title}</h3>
                  <p className="post-text text-gray-700 mb-4">{post.content}</p>
                  
                  <div className="post-footer flex items-center justify-between text-sm text-gray-500">
                    <span className="comments flex items-center">
                      <FaComment className="mr-1" /> {post.comments} comments
                    </span>
                    <div className="post-actions flex space-x-4">
                      <button className="action-button hover:text-blue-600" onClick={(e) => e.stopPropagation()}>Share</button>
                      <button className="action-button hover:text-blue-600" onClick={(e) => e.stopPropagation()}>Save</button>
                      <button className="action-button hover:text-red-600" onClick={(e) => e.stopPropagation()}>Report</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="disclaimer mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded max-w-4xl mx-auto">
            <strong>Important:</strong> These posts are fictional examples created to illustrate 
            common health misinformation. Always verify health information from credible sources 
            such as healthcare providers, academic institutions, or recognized health organizations.
          </div>
        </div>
      </section>
    </div>
  );
}

export default RedditMisinformationWithVerification;