/**
 * Test authentication and product creation
 * Run: node test-auth.js
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testAuth() {
  try {
    console.log('1. Testing Login...');
    
    // Login with admin credentials
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'Admin123!'
    });
    
    console.log('✓ Login successful!');
    console.log('Response:', JSON.stringify(loginResponse.data, null, 2));
    
    const token = loginResponse.data.data?.token || loginResponse.data.token;
    console.log('Token:', token);
    console.log('User:', loginResponse.data.data?.user || loginResponse.data.user);
    
    // Test fetching products with authentication
    console.log('\n2. Fetching products with auth token...');
    const productsResponse = await axios.get(`${API_URL}/products`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✓ Products fetched successfully!');
    console.log('Total products:', productsResponse.data.data ? productsResponse.data.data.length : 0);
    
    // Test creating a product
    console.log('\n3. Creating a test product...');
    const productData = {
      name: 'Test Product ' + Date.now(),
      description: 'This is a test product created via API',
      category: 'electronics',
      batchNumber: 'BATCH-' + Date.now(),
      initialLocation: 'Test Warehouse'
    };
    
    const createResponse = await axios.post(`${API_URL}/products`, productData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✓ Product created successfully!');
    console.log('New product:', createResponse.data.data);
    
    console.log('\n✅ All tests passed!');
    console.log('\nTo use in the frontend:');
    console.log('1. Go to http://localhost:3001/login');
    console.log('2. Use email: admin@example.com');
    console.log('3. Use password: Admin123!');
    console.log('4. After login, navigate to Products page');
    
  } catch (error) {
    console.error('❌ Error:', error.response ? error.response.data : error.message);
    
    if (error.response && error.response.status === 401) {
      console.log('\nAuthentication failed. Make sure the user exists.');
      console.log('Run: cd backend && node seed.js');
    }
  }
}

testAuth();