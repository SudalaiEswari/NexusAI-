
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testOldModel() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
  try {
    console.log("Attempting gemini-1.0-pro-001...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro-001" });
    const result = await model.generateContent("Hello?");
    const response = await result.response;
    console.log("Success with gemini-1.0-pro-001:", response.text());
  } catch (err) {
    console.error("Error with gemini-1.0-pro-001:", err.message);
  }
}

testOldModel();
