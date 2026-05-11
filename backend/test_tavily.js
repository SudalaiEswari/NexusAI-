
require('dotenv').config();
const axios = require('axios');

async function testTavily() {
  const apiKey = process.env.TAVILY_API_KEY;
  console.log("Testing Tavily with API Key:", apiKey.substring(0, 8) + "...");
  
  try {
    const response = await axios.post('https://api.tavily.com/search', {
      api_key: apiKey,
      query: "Who is the PM of India",
      search_depth: "basic",
      include_answer: true
    });
    
    console.log("--- TAVILY SUCCESS ---");
    console.log("Answer:", response.data.answer);
    console.log("Results found:", response.data.results.length);
  } catch (error) {
    console.error("--- TAVILY FAILED ---");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error("Error:", error.message);
    }
  }
}

testTavily();
