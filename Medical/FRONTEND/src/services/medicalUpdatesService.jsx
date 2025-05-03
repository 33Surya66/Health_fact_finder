// src/services/medicalUpdatesService.js

import { Parser } from 'rss-parser';

// Storage keys
const STORAGE_KEY = 'health_fact_finder_medical_updates';
const REFRESH_INTERVAL = 3 * 60 * 60 * 1000; // 3 hours in milliseconds

/**
 * Fetch medical updates from Harvard Health, NEJM, and CDC RSS feeds
 * @returns {Promise<Array>} Array of medical update objects
 */
export async function fetchMedicalUpdates() {
  try {
    // Define RSS feed URLs
    const feedUrls = {
      harvard: 'https://www.health.harvard.edu/blog/feed',
      nejm: 'https://www.nejm.org/action/showFeed?jc=nejm&type=etoc&feed=rss',
      cdc: 'https://tools.cdc.gov/podcasts/rss.asp'
    };
    
    // Create a new RSS parser
    const parser = new Parser({
      customFields: {
        item: [
          ['media:content', 'media'],
          ['media:thumbnail', 'thumbnail'],
          ['enclosure', 'enclosure']
        ]
      }
    });
    
    // Function to fetch and parse a single feed
    const fetchFeed = async (url, sourceName) => {
      try {
        const feed = await parser.parseURL(corsProxyUrl(url));
        
        return feed.items.map(item => {
          // Extract image from various possible locations in the feed
          let image = null;
          if (item.media && item.media.$ && item.media.$.url) {
            image = item.media.$.url;
          } else if (item.thumbnail && item.thumbnail.$ && item.thumbnail.$.url) {
            image = item.thumbnail.$.url;
          } else if (item.enclosure && item.enclosure.url) {
            image = item.enclosure.url;
          } else if (item['media:content'] && item['media:content']['$'] && item['media:content']['$'].url) {
            image = item['media:content']['$'].url;
          } else {
            // Try to extract image from content if available
            image = extractImageFromContent(item.content || item['content:encoded'] || '');
          }

          // Extract category
          let category = '';
          if (item.categories && item.categories.length > 0) {
            category = item.categories[0];
          }
          
          return {
            title: item.title,
            link: item.link,
            pubDate: item.pubDate || item.isoDate,
            description: stripHtmlTags(item.contentSnippet || item.summary || ''),
            content: stripHtmlTags(item.content || item['content:encoded'] || ''),
            image: image,
            category: category,
            source: sourceName
          };
        });
      } catch (error) {
        console.error(`Error fetching ${sourceName} feed:`, error);
        return [];
      }
    };
    
    // Fetch all feeds in parallel
    const [harvardUpdates, nejmUpdates, cdcUpdates] = await Promise.all([
      fetchFeed(feedUrls.harvard, 'Harvard Health Blog'),
      fetchFeed(feedUrls.nejm, 'New England Journal of Medicine'),
      fetchFeed(feedUrls.cdc, 'CDC')
    ]);
    
    // Combine and sort all updates by date (newest first)
    const allUpdates = [...harvardUpdates, ...nejmUpdates, ...cdcUpdates]
      .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    
    // If we have no updates, use fallback data
    if (allUpdates.length === 0) {
      return fallbackMedicalUpdates;
    }
    
    return allUpdates;
  } catch (error) {
    console.error('Error in fetchMedicalUpdates:', error);
    // Return fallback data in case of error
    return fallbackMedicalUpdates;
  }
}

/**
 * Save medical updates to local storage
 * @param {Array} updates - Array of update objects
 */
export function saveMedicalUpdatesToStorage(updates) {
  if (!updates || !Array.isArray(updates)) {
    console.error('Invalid updates data for storage');
    return;
  }
  
  const storageData = {
    timestamp: new Date().getTime(),
    data: updates
  };
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));
  } catch (error) {
    console.error('Error saving updates to storage:', error);
  }
}

/**
 * Get medical updates from local storage
 * @returns {Object} Object containing timestamp and data
 */
export function getMedicalUpdatesFromStorage() {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    
    if (!storedData) {
      return { timestamp: 0, data: fallbackMedicalUpdates };
    }
    
    const parsedData = JSON.parse(storedData);
    
    // If stored data is empty, use fallback data
    if (!parsedData.data || parsedData.data.length === 0) {
      return { timestamp: parsedData.timestamp, data: fallbackMedicalUpdates };
    }
    
    return parsedData;
  } catch (error) {
    console.error('Error retrieving updates from storage:', error);
    return { timestamp: 0, data: fallbackMedicalUpdates };
  }
}

/**
 * Check if medical updates should be refreshed based on the last fetch time
 * @returns {boolean} True if updates should be refreshed
 */
export function shouldRefreshMedicalUpdates() {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    
    if (!storedData) {
      return true;
    }
    
    const { timestamp } = JSON.parse(storedData);
    const now = new Date().getTime();
    
    return now - timestamp > REFRESH_INTERVAL;
  } catch (error) {
    console.error('Error checking if updates should be refreshed:', error);
    return true;
  }
}

/**
 * Helper function to use a CORS proxy for RSS feeds
 * @param {string} url - The original RSS feed URL
 * @returns {string} The proxied URL
 */
function corsProxyUrl(url) {
  // You can use a public CORS proxy like allorigins or corsanywhere
  // For production, you should set up your own proxy or use a server-side solution
  return `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  
  // Alternative proxies:
  // return `https://cors-anywhere.herokuapp.com/${url}`;
  // return `https://thingproxy.freeboard.io/fetch/${url}`;
}

/**
 * Helper function to strip HTML tags from content
 * @param {string} html - HTML content
 * @returns {string} Plain text without HTML tags
 */
function stripHtmlTags(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Extract image URL from HTML content
 * @param {string} content - HTML content
 * @returns {string|null} Image URL or null
 */
function extractImageFromContent(content) {
  if (!content) return null;
  
  const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
  return imgMatch ? imgMatch[1] : null;
}

/**
 * Handle RSS feed errors by trying alternative methods
 * @param {string} sourceName - The name of the source
 * @param {string} url - The feed URL
 * @returns {Promise<Array>} Array of medical update objects
 */
async function handleFeedError(sourceName, url) {
  console.warn(`Attempting alternative method for ${sourceName} feed`);
  
  // Try with different proxy
  try {
    const altProxyUrl = `https://thingproxy.freeboard.io/fetch/${url}`;
    const parser = new Parser();
    const feed = await parser.parseURL(altProxyUrl);
    
    return feed.items.map(item => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate || item.isoDate,
      description: stripHtmlTags(item.contentSnippet || item.summary || ''),
      content: stripHtmlTags(item.content || item['content:encoded'] || ''),
      image: extractImageFromContent(item.content || item['content:encoded'] || ''),
      category: item.categories && item.categories.length > 0 ? item.categories[0] : '',
      source: sourceName
    }));
  } catch (error) {
    console.error(`Alternative method for ${sourceName} failed:`, error);
    
    // Return source-specific fallback data
    return fallbackMedicalUpdates.filter(update => update.source === sourceName);
  }
}

// Fallback data in case the API calls fail
export const fallbackMedicalUpdates = [
  {
    title: "Diet Drinks and Possible Health Risks",
    link: "https://www.health.harvard.edu/blog/diet-drinks-and-possible-health-risks-202104082439",
    pubDate: "2023-11-15T14:30:00Z",
    description: "Research suggests artificial sweeteners may impact health in unexpected ways, from altered gut bacteria to increased cravings.",
    content: "Artificial sweeteners have long been positioned as a healthier alternative to sugar, but recent research is raising questions about their impact on health. Studies suggest that artificial sweeteners might alter gut bacteria composition, potentially affecting metabolism. Some research also indicates that these sweeteners may actually increase cravings for sweet foods by disrupting the brain's reward pathways.",
    image: "https://www.health.harvard.edu/media/content/images/diet-soda-GettyImages-1202469434.jpg",
    category: "Nutrition",
    source: "Harvard Health Blog"
  },
  {
    title: "Monoclonal Antibody Treatment for COVID-19",
    link: "https://www.nejm.org/doi/full/10.1056/NEJMoa2108163",
    pubDate: "2023-11-10T10:15:00Z",
    description: "A clinical trial examining the efficacy of monoclonal antibodies in treating mild to moderate COVID-19 shows promising results for high-risk patients.",
    content: "In this randomized, double-blind, placebo-controlled trial, researchers evaluated the efficacy of a combination of two monoclonal antibodies in treating high-risk patients with mild to moderate COVID-19. The treatment significantly reduced viral load and the need for medical care compared to placebo. The results suggest this approach may be valuable for patients at high risk for disease progression.",
    image: "https://www.nejm.org/na101/home/literatum/publisher/mms/journals/content/nejm/2021/nejm_2021.384.issue-10/nejmoa2108163/20210305/images/img_xlarge/nejmoa2108163_f1.jpeg",
    category: "COVID-19",
    source: "New England Journal of Medicine"
  },
  {
    title: "Updated Guidance on Childhood Vaccinations",
    link: "https://www.cdc.gov/vaccines/schedules/hcp/imz/child-adolescent.html",
    pubDate: "2023-11-05T16:45:00Z",
    description: "The CDC has updated its guidance for childhood vaccination schedules, with particular emphasis on catch-up vaccinations following pandemic-related delays.",
    content: "The Centers for Disease Control and Prevention has released updated vaccination schedules for children and adolescents. The new guidance addresses concerns about missed vaccinations during the COVID-19 pandemic and provides recommendations for catch-up schedules. Healthcare providers are encouraged to use every opportunity to administer needed vaccines to help close immunization gaps that emerged during the pandemic.",
    image: "https://www.cdc.gov/vaccines/parents/images/vaccines-children-sm.jpg",
    category: "Immunizations",
    source: "CDC"
  },
  {
    title: "The Link Between Sleep and Heart Health",
    link: "https://www.health.harvard.edu/blog/sleep-and-heart-health-202110072610",
    pubDate: "2023-10-28T09:20:00Z",
    description: "Recent studies confirm the importance of quality sleep for cardiovascular health, with poor sleep linked to higher risks of heart disease.",
    content: "The connection between sleep quality and heart health continues to strengthen through research. Recent studies have found that irregular sleep patterns and sleep deprivation are associated with higher calcium scores in coronary arteries, a marker for atherosclerosis. Additionally, individuals with sleep apnea show elevated risks for hypertension, arrhythmias, and heart failure. Experts recommend prioritizing sleep hygiene as an important component of heart disease prevention.",
    image: "https://www.health.harvard.edu/media/content/images/sleep-heart-GettyImages-1174385883.jpg",
    category: "Heart Health",
    source: "Harvard Health Blog"
  },
  {
    title: "Novel Gene Therapy for Sickle Cell Disease",
    link: "https://www.nejm.org/doi/full/10.1056/NEJMoa2117175",
    pubDate: "2023-10-20T13:40:00Z",
    description: "A breakthrough gene therapy approach shows significant promise in reducing painful crises in sickle cell disease patients.",
    content: "In a landmark clinical trial, researchers report successful outcomes from a novel gene therapy for sickle cell disease. The therapy involves modifying patients' own stem cells to produce healthy hemoglobin, then reinfusing these cells after a conditioning regimen. Trial participants experienced substantial reductions in vaso-occlusive crises and hospitalizations, with some achieving complete freedom from symptoms during the follow-up period. While long-term effects require further study, these results represent a potential paradigm shift in sickle cell disease treatment.",
    image: "https://www.nejm.org/na101/home/literatum/publisher/mms/journals/content/nejm/2022/nejm_2022.386.issue-3/nejmoa2117175/20220121/images/img_xlarge/nejmoa2117175_f1.jpeg",
    category: "Genetics",
    source: "New England Journal of Medicine"
  },
  {
    title: "New Data on Firearm Injuries Among American Youth",
    link: "https://www.cdc.gov/violenceprevention/firearms/fastfact.html",
    pubDate: "2023-10-15T11:25:00Z",
    description: "CDC researchers report alarming trends in firearm-related injuries among children and adolescents, highlighting the need for prevention strategies.",
    content: "A new CDC report reveals concerning statistics about firearm injuries among American youth. According to the data, firearms have become one of the leading causes of death among children and adolescents in the United States. The report emphasizes the need for comprehensive prevention strategies, including secure storage practices, behavioral interventions, and community-based programs to reduce access to firearms among at-risk youth. Public health officials call for increased research funding to better understand and address this growing crisis.",
    image: "https://www.cdc.gov/violenceprevention/images/firearm-violence/prevent-firearm-violence.jpg",
    category: "Public Health",
    source: "CDC"
  },
  {
    title: "The Benefits of Mindfulness for Chronic Pain",
    link: "https://www.health.harvard.edu/blog/mindfulness-and-chronic-pain-202308280987",
    pubDate: "2023-10-05T08:50:00Z",
    description: "Harvard researchers review evidence supporting mindfulness practices as complementary approaches for managing chronic pain conditions.",
    content: "A growing body of research supports the effectiveness of mindfulness-based interventions for managing chronic pain. Harvard researchers have found that regular mindfulness practice can help reduce pain intensity by changing how the brain processes pain signals. Additionally, mindfulness techniques may improve pain coping skills, reduce reliance on pain medications, and address common comorbidities like anxiety and depression. The review suggests that even brief daily mindfulness practices can yield benefits when incorporated into comprehensive pain management strategies.",
    image: "https://www.health.harvard.edu/media/content/images/meditation-GettyImages-1371893553.jpg",
    category: "Pain Management",
    source: "Harvard Health Blog"
  },
  {
    title: "Long-term Outcomes of SARS-CoV-2 Vaccination",
    link: "https://www.nejm.org/doi/full/10.1056/NEJMoa2115481",
    pubDate: "2023-09-25T15:10:00Z",
    description: "Three-year follow-up data from early COVID-19 vaccine clinical trials shows sustained protection against severe disease with minimal long-term safety concerns.",
    content: "This study presents three-year follow-up data from participants in the initial COVID-19 vaccine clinical trials. The findings indicate that while antibody levels wane over time, protection against severe disease and hospitalization remains robust. The long-term safety profile appears favorable, with no significant increase in adverse events compared to control groups. Researchers note that these results support the durability of vaccine-induced immunity, though periodic boosters may be necessary for optimal protection, particularly in high-risk populations.",
    image: "https://www.nejm.org/na101/home/literatum/publisher/mms/journals/content/nejm/2022/nejm_2022.386.issue-17/nejmoa2115481/20220429/images/img_xlarge/nejmoa2115481_f1.jpeg",
    category: "Vaccines",
    source: "New England Journal of Medicine"
  },
  {
    title: "Update on Antimicrobial Resistance Threats",
    link: "https://www.cdc.gov/drugresistance/biggest-threats.html",
    pubDate: "2023-09-18T12:30:00Z",
    description: "The CDC's latest report on antimicrobial resistance highlights emerging threats and progress in containing previously identified resistant organisms.",
    content: "The CDC has released an updated report on antimicrobial resistance threats in the United States. The report identifies several newly emerging resistant pathogens while tracking progress in containing previously identified threats. Of particular concern are carbapenem-resistant Enterobacterales and drug-resistant Candida auris, which continue to spread in healthcare settings. The report emphasizes the importance of antimicrobial stewardship programs, infection control measures, and continued investment in new antibiotic development to address this growing public health challenge.",
    image: "https://www.cdc.gov/drugresistance/images/ar-threats-bacteria.jpg",
    category: "Infectious Diseases",
    source: "CDC"
  },
  {
    title: "Mediterranean Diet and Cognitive Health",
    link: "https://www.health.harvard.edu/blog/mediterranean-diet-may-help-protect-against-cognitive-decline-202209092811",
    pubDate: "2023-09-10T09:55:00Z",
    description: "Long-term study finds adherence to the Mediterranean diet associated with slower cognitive decline and reduced risk of Alzheimer's disease.",
    content: "A 25-year longitudinal study provides further evidence supporting the cognitive benefits of the Mediterranean diet. Participants who closely followed this dietary pattern showed significantly slower rates of cognitive decline and lower incidence of Alzheimer's disease compared to those with poor adherence. The researchers identified specific components, including regular consumption of olive oil, fish, nuts, and plant-based foods, as particularly beneficial. The study also observed a dose-response relationship, with those adhering most strictly to the diet experiencing the greatest cognitive protection.",
    image: "https://www.health.harvard.edu/media/content/images/mediterranean-diet-GettyImages-1288189485.jpg",
    category: "Nutrition",
    source: "Harvard Health Blog"
  }
];