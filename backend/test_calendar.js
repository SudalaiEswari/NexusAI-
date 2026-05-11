const axios = require('axios');

const API = 'http://localhost:3001/api';
let TOKEN = '';

async function testCalendar() {
  try {
    // 1. Login
    console.log('Logging in...');
    const loginRes = await axios.post(`${API}/auth/login`, {
      email: 'admin@nexusai.com',
      password: 'admin123'
    });
    TOKEN = loginRes.data.token;
    
    // 2. Schedule Interview (Assuming candidate 1 exists)
    console.log('Scheduling interview...');
    const res = await axios.post(`${API}/recruitment/schedule`, {
      candidateId: 1,
      scheduledAt: "2026-05-10T14:30",
      interviewer: "Hiring Manager",
      mode: "Online (Zoom)"
    }, {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    
    console.log('✅ Schedule response:', res.data);
    console.log('Check the server console for the [ICS CALENDAR ATTACHED] log.');

  } catch (e) {
    console.error('❌ Test failed:', e.response ? e.response.data : e.message);
  }
}

testCalendar();
