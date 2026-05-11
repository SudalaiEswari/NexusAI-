// services/searchService.js — Real web search via Tavily API

const axios = require('axios');
require('dotenv').config();

const TAVILY_KEY = process.env.TAVILY_API_KEY;
const HAS_TAVILY = TAVILY_KEY && TAVILY_KEY !== 'your_tavily_api_key_here';

/**
 * webSearch — Perform a real web search using Tavily API
 * Falls back to curated mock data if no API key
 * @param {string} query - Search query
 * @param {number} maxResults - Number of results (default 5)
 */
async function webSearch(query, maxResults = 5) {
  if (HAS_TAVILY) {
    return tavilySearch(query, maxResults);
  }
  console.log('[Search] No Tavily key — using mock search data');
  return mockSearch(query);
}

/** Real Tavily API search */
async function tavilySearch(query, maxResults) {
  try {
    const response = await axios.post('https://api.tavily.com/search', {
      api_key: TAVILY_KEY,
      query,
      search_depth: 'advanced',
      max_results: maxResults,
      include_answer: true,
      include_raw_content: false,
    }, { timeout: 15000 });

    const data = response.data;
    const results = (data.results || []).map(r => ({
      title:   r.title,
      url:     r.url,
      summary: r.content?.substring(0, 300) || 'No summary available',
      score:   r.score || 0,
      published: r.published_date || 'Unknown date'
    }));

    return {
      success: true,
      provider: 'Tavily',
      query,
      answer: data.answer || null,
      results
    };
  } catch (err) {
    console.error('[Tavily] Search error:', err.message);
    // Fall back to mock if API fails
    return mockSearch(query);
  }
}

/** Mock search data for testing without API key */
function mockSearch(query) {
  const lower = query.toLowerCase();
  let results = [];

  if (lower.includes('ai') || lower.includes('machine learning') || lower.includes('artificial')) {
    results = [
      { title: 'Global AI Market Report 2024 — Gartner', url: 'https://gartner.com/ai-report-2024', summary: 'The global AI market is projected to reach $1.8 trillion by 2030, growing at a CAGR of 37%. Generative AI alone accounts for $36 billion in 2024. Enterprise AI adoption doubled over 2 years with 78% of large companies deploying AI tools in production environments.', published: '2024-03-15' },
      { title: 'AI in Business Operations — McKinsey Global', url: 'https://mckinsey.com/ai-business-2024', summary: 'Companies using AI report 40% productivity gains on average. 60% of current work activities could be automated using existing AI technology. Top adoption areas: customer service (85%), data analysis (79%), and content generation (71%).', published: '2024-02-20' },
      { title: 'India AI Mission — NASSCOM Report', url: 'https://nasscom.in/india-ai-2024', summary: 'India has 3,000+ AI startups and ranks 3rd globally for AI talent. Government investing ₹10,000 crore in India AI Mission. Bangalore, Hyderabad, and Chennai are leading AI hubs with average salaries of ₹18–35 LPA.', published: '2024-04-01' },
    ];
  } else if (lower.includes('startup') || lower.includes('funding') || lower.includes('venture')) {
    results = [
      { title: 'India Startup Ecosystem 2024 — Inc42', url: 'https://inc42.com/startup-report-2024', summary: 'India has 1,17,000+ DPIIT-recognized startups. 108 unicorns valued at $340+ billion. Fintech, SaaS, and Healthtech lead funding. Q1 2024 saw $3.5B in VC investment despite global slowdown.', published: '2024-03-10' },
      { title: 'Global VC Funding Trends — Crunchbase', url: 'https://crunchbase.com/funding-2024', summary: 'Global VC funding reached $285B in 2024. AI startups received 35% of all investment. Seed rounds are increasingly competitive with average pre-money valuations up 23% YoY.', published: '2024-02-28' },
      { title: 'Startup Failure Analysis — CB Insights', url: 'https://cbinsights.com/failure-2024', summary: 'Top failure causes: no market need (38%), cash depletion (29%), wrong team (23%). Startups that pivot raise 2.5x more. Time to PMF averages 18–24 months across sectors.', published: '2024-01-15' },
    ];
  } else if (lower.includes('ecommerce') || lower.includes('retail') || lower.includes('shopping')) {
    results = [
      { title: 'India E-commerce Market 2024 — RedSeer', url: 'https://redseer.com/ecommerce-2024', summary: 'India e-commerce projected to reach $350B by 2030. Tier-2/3 cities contribute 45% of orders. Quick commerce (10-min delivery) grew 80% YoY. Meesho overtook Amazon in seller count.', published: '2024-03-20' },
      { title: 'Consumer Behavior Post-COVID — Deloitte', url: 'https://deloitte.com/consumer-2024', summary: '73% of Indian consumers prefer online for electronics and fashion. Mobile commerce is 82% of all transactions. Return rates reduced to 15% with AI-powered size recommendations.', published: '2024-02-10' },
      { title: 'Future of Retail Tech — Forrester', url: 'https://forrester.com/retail-tech-2024', summary: 'AR try-on increases conversion by 40%. AI personalization lifts revenue 15–25%. Omnichannel brands see 89% higher customer retention vs single-channel competitors.', published: '2024-01-30' },
    ];
  } else if (lower.includes('cyber') || lower.includes('security') || lower.includes('hack')) {
    results = [
      { title: 'Global Cybersecurity Market 2024 — Statista', url: 'https://statista.com/cyber-2024', summary: 'Cybersecurity market to reach $298B by 2028. Average data breach cost is $4.88M (IBM 2024). 95% of breaches involve human error. Zero-trust architecture adoption grew 60% in 2024.', published: '2024-03-05' },
      { title: 'India Cyber Threats — CERT-In Annual Report', url: 'https://cert-in.org.in/annual-2024', summary: 'India faced 79 million cyberattacks in 2024. Banking, healthcare, and government are top targets. Ransomware incidents rose 55% YoY. Government investing ₹517 crore in cyber infrastructure.', published: '2024-02-14' },
      { title: 'AI in Cybersecurity — Gartner Insight', url: 'https://gartner.com/cyber-ai-2024', summary: 'AI-powered threat detection reduces response time by 60%. By 2026, 40% of defenses will use AI. Security teams using AI handle 3x more incidents per analyst per day.', published: '2024-01-22' },
    ];
  } else {
    results = [
      { title: `${query} — Industry Overview 2024`, url: `https://industryreports.com/${encodeURIComponent(query)}`, summary: `The ${query} sector is experiencing significant transformation driven by technology, changing consumer preferences, and regulatory changes. Market analysts project strong growth over the next 5 years with multiple opportunities for new entrants.`, published: '2024-03-01' },
      { title: `Market Analysis: ${query} Trends`, url: `https://marketwatch.com/analysis/${encodeURIComponent(query)}`, summary: `Key trends shaping ${query} include digitization, sustainability focus, and AI integration. Leaders in these areas show 2–3x higher revenue growth. Customer expectations are rising, demanding faster and more personalized experiences.`, published: '2024-02-15' },
      { title: `Future of ${query} — Expert Roundtable 2024`, url: `https://businessinsider.com/${encodeURIComponent(query)}-future`, summary: `Experts predict major disruption in ${query} over the next 5 years. Top factors: tech investment, talent development, strategic partnerships. Early AI adopters report 30–40% efficiency gains already.`, published: '2024-01-10' },
    ];
  }

  return { success: true, provider: 'Mock (add TAVILY_API_KEY for real search)', query, answer: null, results };
}

module.exports = { webSearch };
