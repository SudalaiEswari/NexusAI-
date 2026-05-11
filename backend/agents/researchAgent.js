// agents/researchAgent.js — Real web search + AI synthesis

const { callAI } = require('../services/aiService');
const { webSearch } = require('../services/searchService');
const db = require('../db/database');

const RESEARCH_PROMPT = `You are a professional Business Research Analyst.
Synthesize the provided search results into a structured report:

📌 **Executive Summary** (2–3 sentences)
📊 **Key Findings** (5–6 bullet points with specific numbers/data)
🌐 **Market/Industry Context** (1 paragraph)
⚠️ **Challenges & Risks** (2–3 bullets)
💡 **Recommendations** (3 actionable insights)
📅 Report Date: today

Be concise, data-driven, and under 500 words. Use the search data provided.`;

async function conductResearch(topic, lang = 'en', userId = null) {
  // Step 1: Real web search (Tavily or mock fallback)
  const searchData = await webSearch(topic, 5);

  // Step 2: Build context from search results
  const sourceSummary = searchData.results.map((r, i) =>
    `Source ${i+1}: ${r.title}\nURL: ${r.url}\nContent: ${r.summary}\n`
  ).join('\n');

  const prompt = `Research Topic: "${topic}"
${searchData.answer ? `Quick Answer: ${searchData.answer}\n` : ''}
Search Results:\n${sourceSummary}

Generate a comprehensive research report based on the above sources.`;

  // Step 3: AI synthesis
  const report = await callAI(RESEARCH_PROMPT, prompt, lang);

  // Step 4: Save to DB
  if (userId) {
    db.prepare(`INSERT INTO research_reports (topic, report, sources, user_id) VALUES (?,?,?,?)`)
      .run(topic, report, JSON.stringify(searchData.results), userId);
  }

  return {
    success: true,
    topic,
    provider: searchData.provider,
    sources: searchData.results,
    quickAnswer: searchData.answer,
    report,
    generatedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  };
}

function getSavedReports(userId) {
  return db.prepare(`SELECT id, topic, created_at FROM research_reports WHERE user_id=? ORDER BY created_at DESC LIMIT 20`).all(userId);
}

function getReportById(id, userId) {
  return db.prepare(`SELECT * FROM research_reports WHERE id=? AND user_id=?`).get(id, userId);
}

module.exports = { conductResearch, getSavedReports, getReportById };
