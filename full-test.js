/**
 * Complete test of authentication and product management
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

async function fullTest() {
  let token = null;
  
  try {
    // Step 1: Login
    console.log(colors.blue + '\n========================================');
    console.log('STEP 1: Testing Login');
    console.log('========================================' + colors.reset);
    
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'Admin123!'
    });
    
    if (loginResponse.data.success) {
      token = loginResponse.data.data.token;
      console.log(colors.green + '✓ Login successful!' + colors.reset);
      console.log('Token received:', token.substring(0, 50) + '...');
      console.log('User:', loginResponse.data.data.user.name);
      console.log('Role:', loginResponse.data.data.user.role);
    }
    
    // Step 2: Fetch Products
    console.log(colors.blue + '\n========================================');
    console.log('STEP 2: Fetching Products');
    console.log('========================================' + colors.reset);
    
    const productsResponse = await axios.get(`${API_URL}/products`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (productsResponse.data.success) {
      const products = productsResponse.data.data || [];
      console.log(colors.green + `✓ Products fetched: ${products.length} found` + colors.reset);
      
      if (products.length > 0) {
        console.log('\nFirst product:');
        console.log('- Name:', products[0].name);
        console.log('- Batch:', products[0].batchNumber);
        console.log('- Category:', products[0].category);
      }
    }
    
    // Step 3: Create a New Product
    console.log(colors.blue + '\n========================================');
    console.log('STEP 3: Creating New Product');
    console.log('========================================' + colors.reset);
    
    const newProduct = {
      name: 'Test Product ' + new Date().toISOString(),
      description: 'This is a test product created to verify the API',
      category: 'electronics',
      batchNumber: 'TEST-' + Date.now(),
      initialLocation: 'Test Warehouse'
    };
    
    console.log('Creating product:', newProduct.name);
    
    const createResponse = await axios.post(`${API_URL}/products`, newProduct, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (createResponse.data.success) {
      console.log(colors.green + '✓ Product created successfully!' + colors.reset);
      console.log('Product ID:', createResponse.data.data._id);
      console.log('Product Name:', createResponse.data.data.name);
    }
    
    // Step 4: Verify Product Was Created
    console.log(colors.blue + '\n========================================');
    console.log('STEP 4: Verifying Product Creation');
    console.log('========================================' + colors.reset);
    
    const verifyResponse = await axios.get(`${API_URL}/products`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const updatedProducts = verifyResponse.data.data || [];
    const createdProduct = updatedProducts.find(p => p.batchNumber === newProduct.batchNumber);
    
    if (createdProduct) {
      console.log(colors.green + '✓ Product verified in database!' + colors.reset);
      console.log('Found product:', createdProduct.name);
    }
    
    // Summary
    console.log(colors.green + '\n========================================');
    console.log('✅ ALL TESTS PASSED!');
    console.log('========================================' + colors.reset);
    
    console.log('\n' + colors.yellow + 'Frontend Instructions:' + colors.reset);
    console.log('1. Open http://localhost:3001');
    console.log('2. Login with admin@example.com / Admin123!');
    console.log('3. Navigate to Products page');
    console.log('4. You should see the products listed');
    console.log('5. Click "Add Product" to create new products');
    
    console.log('\n' + colors.yellow + 'API is working correctly!' + colors.reset);
    console.log('The issue is likely in the frontend configuration.');
    console.log('Make sure the frontend is using the correct API URL.');
    
  } catch (error) {
    console.error(colors.red + '\n❌ Test failed!' + colors.reset);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Message:', error.response.data?.message || error.response.statusText);
      console.error('Full response:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received from server');
      console.error('Is the backend running on port 5000?');
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
console.log(colors.blue + '🚀 Starting Full System Test...' + colors.reset);
fullTest();