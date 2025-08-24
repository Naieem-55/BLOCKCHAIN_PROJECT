const axios = require('axios');
const API_URL = 'http://localhost:5003/api';

async function testTamperingDetection() {
  console.log('🔐 Testing Tampering Detection via API\n');
  console.log('=' .repeat(50));

  try {
    // First, login to get a token
    console.log('Logging in...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'Admin123!'
    });

    const token = loginResponse.data.data.token;
    console.log('✅ Login successful\n');

    // Configure axios with auth token
    const authAxios = axios.create({
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Get a product
    console.log('Fetching products...');
    const productsResponse = await authAxios.get(`${API_URL}/products`);
    
    const products = productsResponse.data.data.products || productsResponse.data.data || [];
    if (products.length === 0) {
      console.log('No products found. Creating a test product...');
      
      // Create a test product
      const newProduct = await authAxios.post(`${API_URL}/products`, {
        name: 'Test Product for Tampering',
        description: 'Product to test tampering detection',
        category: 'Electronics',
        batchNumber: `BATCH-TEST-${Date.now()}`,
        quantity: 0,  // Testing with zero
        unit: 'pcs',
        price: 0,     // Testing with zero
        currentLocation: 'Test Warehouse'
      });
      
      const productId = newProduct.data.data._id;
      console.log(`✅ Created test product: ${productId}\n`);
      
      // Run tampering test
      console.log('Running tampering test scenarios...');
      const testResponse = await authAxios.post(`${API_URL}/immutability/test-scenarios/${productId}`);
      
      console.log('\n📊 Test Results:');
      console.log(`Total Scenarios: ${testResponse.data.data.testSummary.totalScenarios}`);
      console.log(`Detected: ${testResponse.data.data.testSummary.detectedCount}`);
      console.log(`Detection Rate: ${testResponse.data.data.testSummary.detectionRate}`);
      console.log(`Security Status: ${testResponse.data.data.testSummary.securityStatus}`);
      
      console.log('\n📋 Individual Test Results:');
      testResponse.data.data.scenarios.forEach(scenario => {
        const status = scenario.tamperingDetected ? '✅ DETECTED' : '❌ MISSED';
        console.log(`  ${scenario.name}: ${status}`);
      });
      
      if (testResponse.data.data.testSummary.detectionRate === '100.00%') {
        console.log('\n🎉 SUCCESS: All tampering scenarios detected!');
      } else {
        console.log('\n⚠️  WARNING: Some tampering scenarios were missed!');
      }
      
    } else {
      // Use existing product
      const product = products[0];
      console.log(`Using existing product: ${product.name} (${product._id})\n`);
      
      // Run tampering test
      console.log('Running tampering test scenarios...');
      const testResponse = await authAxios.post(`${API_URL}/immutability/test-scenarios/${product._id}`);
      
      console.log('\n📊 Test Results:');
      console.log(`Total Scenarios: ${testResponse.data.data.testSummary.totalScenarios}`);
      console.log(`Detected: ${testResponse.data.data.testSummary.detectedCount}`);
      console.log(`Detection Rate: ${testResponse.data.data.testSummary.detectionRate}`);
      console.log(`Security Status: ${testResponse.data.data.testSummary.securityStatus}`);
      
      console.log('\n📋 Individual Test Results:');
      testResponse.data.data.scenarios.forEach(scenario => {
        const status = scenario.tamperingDetected ? '✅ DETECTED' : '❌ MISSED';
        console.log(`  ${scenario.name}: ${status}`);
      });
      
      if (testResponse.data.data.testSummary.detectionRate === '100.00%') {
        console.log('\n🎉 SUCCESS: All tampering scenarios detected!');
      } else {
        console.log('\n⚠️  WARNING: Some tampering scenarios were missed!');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    process.exit(1);
  }
}

testTamperingDetection();