// Simple test to verify frontend-backend connectivity
const axios = require('axios');

async function testConnection() {
  console.log('🔧 Testing Frontend-Backend Connection...\n');
  
  const tests = [
    { name: 'Backend Health (Direct)', url: 'http://localhost:5001/health' },
    { name: 'Backend Login (Direct)', url: 'http://localhost:5001/api/auth/login', method: 'POST', data: { email: 'test@example.com', password: 'Test123!' } },
    { name: 'Frontend Proxy to Backend Health', url: 'http://localhost:3000/health' },
    { name: 'Frontend Proxy to Backend Login', url: 'http://localhost:3000/api/auth/login', method: 'POST', data: { email: 'test@example.com', password: 'Test123!' } },
    { name: 'Frontend Port 3001 to Backend Health', url: 'http://localhost:3001/health' },
    { name: 'Frontend Port 3001 to Backend Login', url: 'http://localhost:3001/api/auth/login', method: 'POST', data: { email: 'test@example.com', password: 'Test123!' } },
  ];

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      
      const config = {
        method: test.method || 'GET',
        url: test.url,
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      if (test.data) {
        config.data = test.data;
      }
      
      const response = await axios(config);
      console.log(`✅ Success: ${response.status} ${response.statusText}`);
      if (test.data) {
        console.log(`   Response: ${response.data.success ? 'Login successful' : JSON.stringify(response.data).substring(0, 100)}`);
      }
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`❌ Connection refused: Service not running`);
      } else if (error.code === 'ETIMEDOUT') {
        console.log(`❌ Timeout: Service not responding`);
      } else {
        console.log(`❌ Error: ${error.message}`);
      }
    }
    console.log('');
  }
}

testConnection().catch(console.error);