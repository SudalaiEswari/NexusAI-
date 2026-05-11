
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGeminiPro() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
  try {
    console.log("Attempting gemini-pro...");
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent("Hello, are you alive?");
    const response = await result.response;
    console.log("Success with gemini-pro:", response.text());
  } catch (err) {
    console.error("Error with gemini-pro:", err.message);
  }
}

testGeminiPro();
