import { useState } from "react";
import { 
  AlertTriangle, 
  User, 
  Calendar, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp 
} from "lucide-react";

// Hardcoded posts data
const hardcodedPosts = [
  {
    username: "BiggieTwiggy1two3",
    subreddit: "r/Health",
    title: "Wisconsin Man Who’s Spent Years Letting Deadly Snakes Bite Him May Have Unlocked The Ultimate Antivenom",
    content: "",
    permalink: "/r/Health/comments/1kd802u/wisconsin_man_whos_spent_years_letting_deadly/",
    isFalse: true,
    category: "General Health",
    evidence: "This post doesn't contain common misinformation markers.",
    scientific_evidence: "Antivenom is developed through controlled immunization of animals with venom, not by humans repeatedly enduring snake bites. Such practices are dangerous and lack scientific support for producing effective antivenom (World Health Organization guidelines on snakebite management).",
    created_at: "2025-05-02T23:51:42",
    false_confidence: 0.85,
    true_confidence: 0.10,
    not_known_confidence: 0.05
  },
  {
    username: "ra561013",
    subreddit: "r/UlcerativeColitis",
    title: "Natural treatment?",
    content: "Hi, 27 (F) just got diagnosed 3 months ago after about a year of bleeding. Started seeing naturopathic doctor because I am scared of western medicine and can’t wrap my mind around this not being caused by an imbalance or infection. \n\nStarted on VSL #3 probiotics for UC, butyrate, GI Complete, and Fibermend supplements. Had bleeding go away for about a month but it’s back again and worse. She now wants me to take food sensitivity testing. I have cut out gluten and lactose to see if it will help, it hasn’t.\n\nGoing in for another scope soon, but I know it’s not going to look good. Does anybody have experience with trying the natural ways? Has anybody had success? \n\nAlso, how do you explain this to work people when it doesn’t look or sound like you have issues?\n\n\nEdit: thank you all so much for the responses, and tough love in a sense. I think it’s helped me come to terms in a way and I decided I will do both medicine routes because I realize now how serious this is. It’s scary but I can’t describe how thankful I am for all of your time in responding.",
    permalink: "/r/UlcerativeColitis/comments/18bt1nc/natural_treatment/",
    isFalse: true,
    category: "Natural Remedy Exaggeration",
    evidence: "While some natural substances have medicinal properties, claims of curing serious conditions often lack scientific support.",
    scientific_evidence: "Ulcerative colitis is a chronic autoimmune condition requiring medical management, such as anti-inflammatory drugs or immunosuppressants. Probiotics and dietary changes may support symptom management but lack evidence for curing UC. Studies (e.g., PubMed) show no consistent benefit from probiotics like VSL#3 or supplements like butyrate in achieving remission.",
    created_at: "2023-12-06T07:34:36",
    false_confidence: 0.85,
    true_confidence: 0.10,
    not_known_confidence: 0.05
  },
  {
    username: "Raoul27",
    subreddit: "r/neuropathy",
    title: "Is there any natural treatment for neuropathy? Oils, plants, herbal tea?",
    content: "Is there any natural treatment for neuropathy? Oils, plants, CBD, tea?",
    permalink: "/r/neuropathy/comments/1j76xgl/is_there_any_natural_treatment_for_neuropathy/",
    isFalse: true,
    category: "Natural Remedy Exaggeration",
    evidence: "While some natural substances have medicinal properties, claims of curing serious conditions often lack scientific support.",
    scientific_evidence: "Neuropathy, often caused by diabetes, injury, or other conditions, typically requires medical treatments like anticonvulsants or antidepressants. Natural remedies such as CBD or herbal teas lack robust clinical evidence for curing neuropathy. Limited studies suggest CBD may alleviate pain but not reverse nerve damage (Journal of Pain Research).",
    created_at: "2025-03-09T18:18:31",
    false_confidence: 0.85,
    true_confidence: 0.10,
    not_known_confidence: 0.05
  },
  {
    username: "cancerthrowmeaway",
    subreddit: "r/offmychest",
    title: "I’m glad I have cancer.",
    content: "I was diagnosed in early December with a rare form of breast cancer, Inflammatory Breast Cancer. Stage 4 de novo. It’s like regular breast cancer, but significantly more aggressive and a lot worse. I was diagnosed 9 days before my birthday and a week and a half after losing my job. It’s just been shit luck after shit luck since then.\n\nI have a small group of people in my life who love me and support me however they can. My finances are in the toilet and I’ll probably have to file for bankruptcy soon, even after having qualified for federal disability payments due to being diagnosed with a disorder that is guaranteed to end in death (their words, not mine). My life is just stressor after stressor after stressor.\n\nI’ve completed over 20 rounds of IV chemo and look like a gremlin as a result. No hair, my fingernails and toenails are horrific, and of course none of that glamorous Hollywood cancer weight loss—try weight gain. And a lot of it. It sucks. Now I’m supposed to take pills and eventually have a mastectomy and maybe have my ovaries out too, and along the way probably once or twice need my lungs drained of fluid, hope upon hope that my many many tumors don’t infiltrate my brain too, and eventually in about 4-5 years I’ll kick the bucket.\n\nThe real off my chest bit here is that I wish it would just happen faster. Cancer is the most tedious, brutally painful, absolute slowest marathon and I am just done with it.\n\nI have an appointment with my oncologist next week and I’m going to ask about hospice. How close to deaths door do I need to be to quality. When can I just say, enough is enough. I used to have things I looked forward to, things I wouldn’t want to miss if I were dead, but I don’t have any of that anymore. I just want it to be over. I’m sick of the endless financial stress and the endless cancer aches and pains and the endless infusions and appointments and hospitalizations. I’m just done with it all.\n\nAnd now I’m going to tell you my greatest secret ever. I’ve already stopped taking my cancer meds. I throw them out instead of taking them. Because I WANT my tumors to grow, I want the blood clots in my lungs to grow, I want it all to get worse so I can finally just enter hospice and be done with it. I’m so tired.\n\nAnd I’m only 34.",
    permalink: "/r/offmychest/comments/1f4pmdd/im_glad_i_have_cancer/",
    isFalse: true,
    category: "General Health",
    evidence: "This post doesn't contain common misinformation markers.",
    scientific_evidence: "Stopping prescribed cancer treatments, such as chemotherapy or targeted therapies, can accelerate disease progression and reduce survival rates. Clinical guidelines (e.g., NCCN) emphasize adherence to treatment plans for inflammatory breast cancer to manage symptoms and extend life. Psychological support and palliative care can address distress without abandoning treatment.",
    created_at: "2024-08-30T13:19:37",
    false_confidence: 0.90,
    true_confidence: 0.05,
    not_known_confidence: 0.05
  },
  {
    username: "amdtek",
    subreddit: "r/rheumatoid",
    title: "Natural Herbs & Rheumatoid Arthritis",
    content: "I heard natural herbs like turmeric and ginger will curb the inflammation arising in rheumatoid arthritis. Does that further translate to curing it if they are consumed regularly in high dose regularly?\n\nSecond question is, can these herbs cure the deformities occuring due to this?\n\nI have zero pain but has to live with the deformities in my hands and toes, something which I'd like to find a cure for.",
    permalink: "/r/rheumatoid/comments/1gwsddh/natural_herbs_rheumatoid_arthritis/",
    isFalse: true,
    category: "General Health",
    evidence: "This post doesn't contain common misinformation markers.",
    scientific_evidence: "Rheumatoid arthritis is a chronic autoimmune disease requiring DMARDs or biologics to manage progression. Turmeric and ginger may have anti-inflammatory effects, but clinical trials (e.g., Arthritis Research & Therapy) show they cannot cure RA or reverse joint deformities, which result from irreversible cartilage and bone damage.",
    created_at: "2024-11-22T04:03:45",
    false_confidence: 0.85,
    true_confidence: 0.10,
    not_known_confidence: 0.05
  },
  {
    username: "Fangydangymangy",
    subreddit: "r/keratosis",
    title: "Remedy skin",
    content: "Has anyone tried remedy skin’s body bump lotion? I’m a bit skeptical about how well it works since it’s only 10% urea but it does have retinol.",
    permalink: "/r/keratosis/comments/1h01le5/remedy_skin/",
    isFalse: true,
    category: "General Health",
    evidence: "This post doesn't contain common misinformation markers.",
    scientific_evidence: "Keratosis pilaris is managed with exfoliants like urea or prescription retinoids. Over-the-counter lotions with 10% urea may provide mild relief, but dermatological studies (e.g., Journal of the American Academy of Dermatology) recommend 20–40% urea or tretinoin for significant improvement.",
    created_at: "2024-11-26T08:19:55",
    false_confidence: 0.85,
    true_confidence: 0.10,
    not_known_confidence: 0.05
  }
];

function HealthMisinformationAnalyzer() {
  // State management
  const [posts, setPosts] = useState(hardcodedPosts);
  const [expandedEvidence, setExpandedEvidence] = useState(null);

  // Toggle scientific evidence display
  const toggleEvidence = (permalink) => {
    setExpandedEvidence(expandedEvidence === permalink ? null : permalink);
  };

  // Format post date to relative time
  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return "Recently";
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);
    
    if (diffSeconds < 60) return "just now";
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} minutes ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} hours ago`;
    return `${Math.floor(diffSeconds / 86400)} days ago`;
  };

  // Render confidence gauge component
  const ConfidenceGauge = ({ falseConf, trueConf, notKnownConf }) => {
    return (
      <div className="mt-4 mb-2">
        <div className="text-xs font-medium text-gray-700 mb-1">Confidence Assessment:</div>
        <div className="space-y-2">
          <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-red-400 rounded-l-full" 
              style={{ width: `${falseConf * 100}%` }}
            ></div>
            <span className="absolute left-1 top-0 text-xs font-medium text-gray-600">False</span>
          </div>
          <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-green-400 rounded-l-full" 
              style={{ width: `${trueConf * 100}%` }}
            ></div>
            <span className="absolute left-1 top-0 text-xs font-medium text-gray-600">True</span>
          </div>
          <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-gray-300 rounded-l-full" 
              style={{ width: `${notKnownConf * 100}%` }}
            ></div>
            <span className="absolute left-1 top-0 text-xs font-medium text-gray-600">Uncertain</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section id="misinformation" className="py-16 bg-slate-100">
      <div className="container mx-auto px-4">
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-blue-900 text-center mb-3">
            Health Misinformation Tracker
          </h2>
          <p className="text-gray-600 text-center max-w-3xl mx-auto">
            Exploring common medical misinformation found on Reddit.
            Learn to identify misleading health claims and understand the scientific evidence.
          </p>
        </div>

        <div className="max-w-6xl mx-auto mb-12">
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">
                <AlertTriangle className="inline-block text-amber-500 mr-2" />
                Misinformation Posts
              </h3>
            </div>

            {posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <AlertTriangle className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No posts available.</p>
              </div>
            ) : (
              <div 
                className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide snap-x scroll-smooth"
              >
                {posts.map((post, index) => (
                  <div 
                    key={index} 
                    className="flex-shrink-0 w-80 snap-start bg-white rounded-lg shadow-sm border border-red-100 hover:shadow-md hover:-translate-y-1"
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-800 font-bold border border-blue-200 shadow-sm">
                            <User className="w-5 h-5 text-blue-700 opacity-80" />
                          </div>
                          <div className="ml-2">
                            <p className="font-medium text-gray-800">{post.username}</p>
                            <p className="text-xs text-gray-500">
                              {post.subreddit} • {formatRelativeTime(post.created_at)}
                            </p>
                          </div>
                        </div>
                        {/* <div className="flex items-center px-2 py-1 bg-red-50 text-red-600 text-xs font-medium rounded-full">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          <span>Misinformation</span>
                        </div> */}
                      </div>

                      <h4 className="font-medium text-gray-800 mb-2">{post.title}</h4>
                      <p className="text-gray-700 mb-3 leading-relaxed text-sm line-clamp-3">
                        {post.content}
                      </p>

                      <div className="mt-4 mb-3 bg-gradient-to-r from-red-50 to-amber-50 p-4 rounded-md border border-red-100">
                        <h4 className="font-bold text-red-800 mb-2">Why this may be misinformation:</h4>
                        <p className="text-gray-700 text-sm">{post.evidence}</p>
                      </div>

                      {post.scientific_evidence && (
                        <div className="mb-3">
                          <button 
                            className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                            onClick={() => toggleEvidence(post.permalink)}
                          >
                            {expandedEvidence === post.permalink ? (
                              <>
                                <ChevronUp className="w-3 h-3 mr-1" />
                                Hide Scientific Evidence
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3 h-3 mr-1" />
                                Show Scientific Evidence
                              </>
                            )}
                          </button>
                          {expandedEvidence === post.permalink && (
                            <div className="mt-4 mb-3 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-md border border-blue-100">
                              <h4 className="font-bold text-blue-800 mb-2">Scientific Evidence:</h4>
                              <p className="text-gray-700 text-sm">{post.scientific_evidence}</p>
                            </div>
                          )}
                        </div>
                      )}

                      <ConfidenceGauge 
                        falseConf={post.false_confidence} 
                        trueConf={post.true_confidence} 
                        notKnownConf={post.not_known_confidence} 
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
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-center mt-6">
              <p className="text-sm text-gray-500">
                Click "Show Scientific Evidence" to view detailed scientific analysis
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HealthMisinformationAnalyzer;