const axios = require('axios');

const API_BASE_URL = 'http://localhost:5003/api'; // Note: Using port 5003 based on error

async function testParticipantCreation() {
  try {
    console.log('=== Testing Participant Creation Fix ===\n');
    
    // 1. Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@supplychain.com',
      password: 'Admin@123456'
    });
    
    const token = loginResponse.data.data.token;
    console.log(`✅ Admin logged in successfully`);
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // 2. Create a test participant
    console.log('\n2. Creating test participant...');
    const participantData = {
      name: 'Test Contact Person',
      email: 'testparticipant@example.com',
      role: 'supplier',
      company: 'Test Company Ltd',
      location: 'New York, USA',
      phone: '+1-555-0100'
    };
    
    console.log('Sending participant data:', participantData);
    
    const createResponse = await axios.post(`${API_BASE_URL}/participants`, participantData, { headers });
    console.log('✅ Participant created successfully:', createResponse.data.data);
    
    // 3. List all participants to verify
    console.log('\n3. Fetching all participants...');
    const listResponse = await axios.get(`${API_BASE_URL}/participants`, { headers });
    console.log(`✅ Found ${listResponse.data.data.length} participants`);
    
    console.log('\n=== Test completed successfully! ===');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data?.errors) {
      console.error('Validation errors:', error.response.data.errors);
    }
    console.error('Status:', error.response?.status);
    console.error('Request URL:', error.config?.url);
  }
}

testParticipantCreation();