
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testWithV1() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
  try {
    console.log("Attempting gemini-1.5-flash with apiVersion v1...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: 'v1' });
    const result = await model.generateContent("Hello, are you alive?");
    const response = await result.response;
    console.log("Success with gemini-1.5-flash (v1):", response.text());
  } catch (err) {
    console.error("Error with gemini-1.5-flash (v1):", err.message);
  }
}

testWithV1();
