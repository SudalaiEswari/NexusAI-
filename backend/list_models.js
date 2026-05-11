require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) return console.log("Missing API key");
  
  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
    const data = await response.json();
    console.log("Available Models (v1):");
    if (data.models) {
      data.models.forEach(m => console.log(`- ${m.name}`));
    } else {
      console.log("No models found or error:", data);
    }
    
    const responseBeta = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const dataBeta = await responseBeta.json();
    console.log("\nAvailable Models (v1beta):");
    if (dataBeta.models) {
      dataBeta.models.forEach(m => console.log(`- ${m.name}`));
    } else {
      console.log("No models found in v1beta or error:", dataBeta);
    }
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

listModels();
