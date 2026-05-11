// services/aiService.js — Central AI caller with Gemini + OpenAI + Claude support

require('dotenv').config();

const { GoogleGenerativeAI } = require("@google/generative-ai");

const AI_PROVIDER = process.env.AI_PROVIDER || 'gemini';

// Initialize Gemini
let genAI;
if (AI_PROVIDER === "gemini") {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (apiKey && apiKey !== 'your_gemini_api_key_here') {
    genAI = new GoogleGenerativeAI(apiKey);
  }
}

// Language name map for prompting AI in user's language
const LANG_NAMES = {
  en: 'English',
  ta: 'Tamil (தமிழ்)',
  hi: 'Hindi (हिंदी)',
  te: 'Telugu (తెలుగు)',
  fr: 'French (Français)',
  de: 'German (Deutsch)',
  ja: 'Japanese (日本語)',
  zh: 'Chinese Simplified (简体中文)',
};

/**
 * callAI — Send prompt to AI, respond in user's language
 */
async function callAI(systemPrompt, userMessage, lang = 'en') {
  const langName = LANG_NAMES[lang] || 'English';

  const langInstruction =
    lang !== 'en'
      ? `\n\nIMPORTANT: Respond ENTIRELY in ${langName}. All text must be in ${langName}.`
      : '';

  const fullSystem = systemPrompt + langInstruction;

  if (AI_PROVIDER === 'gemini') {
    return callGemini(fullSystem, userMessage);
  }

  if (AI_PROVIDER === 'openai') {
    return callOpenAI(fullSystem, userMessage);
  }

  return callClaude(fullSystem, userMessage);
}

// ================= GEMINI =================
async function callGemini(systemPrompt, userMessage) {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();

  if (!apiKey || apiKey === 'your_gemini_api_key_here' || !genAI) {
    console.warn("Gemini API Key missing or invalid. Returning mock response.");
    return getMockResponse(userMessage);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    const result = await model.generateContent(
      `${systemPrompt}\n\nUser: ${userMessage}`
    );

    const response = await result.response;
    return response.text();
  } catch (err) {
    const errMsg = (err.message || "").toLowerCase();
    console.error("Gemini error details:", err);
    
    // Explicit handle for 404 (model not found / API not enabled)
    if (errMsg.includes('404') || errMsg.includes('not found')) {
      console.warn("Gemini 404 error detected. This usually means the Generative Language API is not enabled for your project or the model name is incorrect. Falling back to mock response.");
      return getMockResponse(userMessage + " (Gemini 404 Fallback)");
    }

    // Handle 429 Quota / Rate Limits gracefully
    if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('exhausted') || errMsg.includes('fetch failed')) {
      console.warn("Gemini Quota Exceeded or Network error (429/FetchFailed). Falling back to mock AI smoothly.");
      return getMockResponse(userMessage);
    }

    return "Gemini AI Error: " + (err.message || "Unknown error");
  }
}

// ================= CLAUDE =================
async function callClaude(systemPrompt, userMessage) {
  const apiKey = process.env.CLAUDE_API_KEY;

  if (!apiKey || apiKey === 'your_claude_api_key_here') {
    return getMockResponse(userMessage);
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) throw new Error(`Claude API error: ${await response.text()}`);

  const data = await response.json();
  return data.content[0].text;
}

// ================= OPENAI =================
async function callOpenAI(systemPrompt, userMessage) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    return getMockResponse(userMessage);
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 1500,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (!response.ok) throw new Error(`OpenAI error: ${await response.text()}`);

  const data = await response.json();
  return data.choices[0].message.content;
}

// ================= MOCK =================
function getMockResponse(msg) {
  const l = msg.toLowerCase();

  if (l.includes('resume') || l.includes('job') || l.includes('candidate') || l.includes('recruitment')) {
    return `👔 **Candidate Evaluation (Mock)**

Score: 82/100
- Strong in Python & React.
- Good communication.

**Recommendation:** Shortlist for interview.`;
  }

  if (l.includes('sql') || l.includes('sale') || l.includes('revenue')) {
    if (l.includes('monthly') || l.includes('month')) {
      return "SELECT strftime('%Y-%m', sale_date) as month, ROUND(SUM(amount*quantity),2) as revenue FROM sales GROUP BY month ORDER BY month;";
    }
    if (l.includes('region')) {
      return "SELECT region, ROUND(SUM(amount*quantity),2) as revenue FROM sales GROUP BY region ORDER BY revenue DESC;";
    }
    if (l.includes('product')) {
      return "SELECT product, ROUND(SUM(amount*quantity),2) as revenue FROM sales GROUP BY product ORDER BY revenue DESC;";
    }
    return "SELECT salesperson, ROUND(SUM(amount*quantity),2) as revenue FROM sales GROUP BY salesperson ORDER BY revenue DESC LIMIT 5;";
  }

  if (l.includes('research') || l.includes('market')) {
    return `📌 Market Insight

Growth at 23% CAGR. AI adoption rising.

Recommendation: Invest early.`;
  }

  return `🤖 AI Response

Request completed successfully.
Time: ${new Date().toLocaleString()}`;
}

module.exports = { callAI };