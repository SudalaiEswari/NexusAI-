const axios = require('axios');
const fs = require('fs');

const API = 'http://localhost:3001/api';
let TOKEN = '';

async function testExport() {
  try {
    // 1. Login
    console.log('Logging in...');
    const loginRes = await axios.post(`${API}/auth/login`, {
      email: 'admin@nexusai.com',
      password: 'admin123'
    });
    TOKEN = loginRes.data.token;
    console.log('Login successful.');

    // 2. Test Analyst Export
    console.log('Testing Analyst PDF Export...');
    const analystRes = await axios.post(`${API}/analyst/export-pdf`, {
      question: 'What is the total revenue?',
      sql: 'SELECT SUM(amount) FROM sales',
      results: [{ 'SUM(amount)': 50000 }],
      insights: 'The business is doing great!'
    }, {
      headers: { 'Authorization': `Bearer ${TOKEN}` },
      responseType: 'arraybuffer'
    });
    fs.writeFileSync('test_analyst_report.pdf', analystRes.data);
    console.log('✅ Analyst PDF saved to test_analyst_report.pdf');

    // 3. Test Recruitment Export (assuming candidate ID 1 exists)
    console.log('Testing Recruitment PDF Export (ID 1)...');
    try {
      const recruitRes = await axios.get(`${API}/recruitment/export-pdf/1`, {
        headers: { 'Authorization': `Bearer ${TOKEN}` },
        responseType: 'arraybuffer'
      });
      fs.writeFileSync('test_recruit_report.pdf', recruitRes.data);
      console.log('✅ Recruitment PDF saved to test_recruit_report.pdf');
    } catch (e) {
      console.warn('⚠️ Could not test Recruitment PDF (Candidate ID 1 might not exist).', e.message);
    }

  } catch (e) {
    console.error('❌ Test failed:', e.response ? e.response.data : e.message);
  }
}

testExport();
