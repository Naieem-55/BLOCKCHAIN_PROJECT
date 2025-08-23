/**
 * Test product fetching through frontend
 */

const axios = require('axios');

async function testProductsFrontend() {
  try {
    // Step 1: Login first
    console.log('1. Logging in...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@example.com',
      password: 'Admin123!'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✓ Logged in successfully');
    
    // Step 2: Fetch products with token
    console.log('\n2. Fetching products with authentication...');
    const productsResponse = await axios.get('http://localhost:5000/api/products', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✓ Products fetched successfully');
    console.log(`Found ${productsResponse.data.data.length} products`);
    
    if (productsResponse.data.data.length > 0) {
      console.log('\nFirst product:');
      const product = productsResponse.data.data[0];
      console.log('- Name:', product.name);
      console.log('- Batch:', product.batchNumber);
      console.log('- Status:', product.status);
    }
    
    console.log('\n✅ Frontend should now display products correctly!');
    console.log('\nMake sure you:');
    console.log('1. Are logged in (check localStorage for token)');
    console.log('2. Refresh the Products page');
    console.log('3. Products should now load properly');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testProductsFrontend();