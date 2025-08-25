const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testSimple() {
  try {
    // Test server connection first
    console.log('Testing server connection...');
    const healthCheck = await axios.get(`${API_BASE_URL}/auth/profile`, {
      headers: { 'Authorization': 'Bearer invalid' },
      validateStatus: function (status) {
        return status < 500; // Accept any status less than 500
      }
    });
    console.log(`✅ Server responding (status: ${healthCheck.status})`);
    
    // Test login
    console.log('\nTesting admin login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@supplychain.com',
      password: 'Admin@123456'
    });
    
    console.log('✅ Login successful');
    console.log(`User: ${loginResponse.data.data.user.name}`);
    console.log(`Email: ${loginResponse.data.data.user.email}`);
    console.log(`Role: ${loginResponse.data.data.user.role}`);
    console.log(`User Key: ${loginResponse.data.data.user.userKey}`);
    
    // Test fetching participants
    const token = loginResponse.data.data.token;
    const headers = { 'Authorization': `Bearer ${token}` };
    
    console.log('\nTesting participant fetch...');
    const participantsResponse = await axios.get(`${API_BASE_URL}/participants`, { headers });
    console.log(`✅ Found ${participantsResponse.data.data.length} participants`);
    
    participantsResponse.data.data.forEach((p, index) => {
      console.log(`  ${index + 1}. ${p.name} (${p.role}) - ${p.email}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    console.error('Request URL:', error.config?.url);
    console.error('Status:', error.response?.status);
  }
}

testSimple();