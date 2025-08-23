/**
 * Direct API test to verify backend is working
 */

const http = require('http');

// Test 1: Direct API call without authentication
console.log('Testing API directly...\n');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/products',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\nResponse:', data);
    
    if (res.statusCode === 401) {
      console.log('\n✓ API is working correctly - returning 401 for unauthenticated requests');
      console.log('This is expected behavior. Authentication is required.');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error connecting to API:', error.message);
  console.log('\nPlease ensure the backend is running on port 5000');
});

req.end();