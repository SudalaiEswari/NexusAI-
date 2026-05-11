
require('dotenv').config();
const { callAI } = require('./services/aiService');

async function test() {
  console.log("Testing Gemini AI integration...");
  console.log("AI_PROVIDER:", process.env.AI_PROVIDER);
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("GEMINI_API_KEY EXISTS:", !!apiKey);
  if (apiKey) {
    console.log("GEMINI_API_KEY length:", apiKey.length);
    console.log("GEMINI_API_KEY starts with space:", apiKey.startsWith(' '));
  }
  
  try {
    const response = await callAI("You are a helpful assistant.", "Hello, are you working?", "en");
    console.log("--- RESPONSE START ---");
    console.log(response);
    console.log("--- RESPONSE END ---");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

test();
