
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
  try {
    // There is no direct listModels in the SDK for client side, 
    // but some SDKs have it. Let's try to see if it exists.
    // Otherwise, we'll try different model names.
    console.log("Attempting to call gemini-1.5-flash...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("test");
    console.log("Success with gemini-1.5-flash");
  } catch (err) {
    console.error("Error with gemini-1.5-flash:", err.message);
    
    try {
      console.log("Attempting to call gemini-1.5-pro...");
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      const result = await model.generateContent("test");
      console.log("Success with gemini-1.5-pro");
    } catch (err2) {
      console.error("Error with gemini-1.5-pro:", err2.message);
    }
  }
}

listModels();
