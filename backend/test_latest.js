
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testLatest() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
  try {
    console.log("Attempting gemini-1.5-flash-latest...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const result = await model.generateContent("Hello, are you alive?");
    const response = await result.response;
    console.log("Success with gemini-1.5-flash-latest:", response.text());
  } catch (err) {
    console.error("Error with gemini-1.5-flash-latest:", err.message);
  }
}

testLatest();
