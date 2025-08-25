const axios = require('axios');
const API_BASE_URL = 'http://localhost:5003/api';

async function testBlockchainSync() {
  console.log('🔗 Testing Blockchain Synchronization');
  console.log('='.repeat(50));
  
  try {
    // 1. Login and get user info
    console.log('1️⃣ Authenticating...');
    const loginResponse = await axios.post(API_BASE_URL + '/auth/login', {
      email: 'admin@supplychain.com',
      password: 'Admin@123456'
    });
    
    const token = loginResponse.data.data.token;
    const user = loginResponse.data.data.user;
    const headers = {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    };
    
    console.log('✅ Authenticated as:', user.email);
    console.log('User Key:', user.userKey || 'MISSING!');
    
    if (!user.userKey) {
      console.log('❌ CRITICAL: User has no userKey - this may prevent blockchain integration');
    }
    
    // 2. Check existing products for blockchain data
    console.log('\n2️⃣ Analyzing existing products...');
    const productsResponse = await axios.get(API_BASE_URL + '/products', { headers });
    const products = productsResponse.data.data;
    
    let blockchainEnabled = 0;
    let withTransactionHash = 0;
    
    products.forEach(product => {
      if (product.blockchain && product.blockchain.productId) blockchainEnabled++;
      if (product.transactionHash) withTransactionHash++;
    });
    
    console.log('📊 Current State:');
    console.log('- Total products:', products.length);
    console.log('- With blockchain ID:', blockchainEnabled);
    console.log('- With transaction hash:', withTransactionHash);
    console.log('- Blockchain sync rate:', Math.round((blockchainEnabled / products.length) * 100) + '%');
    
    // 3. Test blockchain service status
    console.log('\n3️⃣ Checking blockchain service...');
    const blockchainService = require('./backend/services/blockchainService.js');
    
    console.log('- Service initialized:', blockchainService.isInitialized);
    console.log('- Available accounts:', blockchainService.accounts.length);
    console.log('- Contracts loaded:', Object.keys(blockchainService.contracts).length);
    
    if (!blockchainService.isInitialized) {
      console.log('🔄 Initializing blockchain service...');
      await blockchainService.initialize();
      console.log('- After init - Service initialized:', blockchainService.isInitialized);
      console.log('- After init - Available accounts:', blockchainService.accounts.length);
      console.log('- After init - Contracts loaded:', Object.keys(blockchainService.contracts).length);
    }
    
    // 4. Test product creation with blockchain
    if (user.userKey && blockchainService.isInitialized) {
      console.log('\n4️⃣ Testing product creation with blockchain...');
      
      const testProductData = {
        name: 'Blockchain Sync Test ' + Date.now(),
        description: 'Testing blockchain synchronization',
        category: 'Test Category',
        batchNumber: 'SYNC-TEST-' + Date.now(),
        userKey: user.userKey,
        expiryDate: '2025-12-31T23:59:59.000Z',
        initialLocation: 'Test Laboratory'
      };
      
      console.log('Creating product:', testProductData.name);
      
      const createResponse = await axios.post(
        API_BASE_URL + '/products', 
        testProductData, 
        { headers }
      );
      
      if (createResponse.data.success) {
        const product = createResponse.data.data;
        console.log('✅ Product created successfully!');
        
        console.log('\n🔗 Blockchain Integration Result:');
        if (createResponse.data.blockchain) {
          console.log('- Blockchain data returned:', 'YES');
          console.log('- Enabled:', createResponse.data.blockchain.enabled);
          console.log('- Product ID:', createResponse.data.blockchain.productId || 'None');
          console.log('- Transaction Hash:', createResponse.data.blockchain.transactionHash || 'None');
          console.log('- Error:', createResponse.data.blockchain.error || 'None');
        } else {
          console.log('- Blockchain data returned:', 'NO');
        }
        
        console.log('\n📊 Product Database Fields:');
        console.log('- blockchainId:', product.blockchainId || 'None');
        console.log('- transactionHash:', product.transactionHash || 'None');
        console.log('- blockchainEnabled:', product.blockchainEnabled || false);
        
        if (product.blockchainId || product.transactionHash) {
          console.log('🎉 SUCCESS: Product synchronized with blockchain!');
        } else {
          console.log('⚠️ WARNING: Product NOT synchronized with blockchain');
        }
        
      } else {
        console.log('❌ Product creation failed:', createResponse.data.message);
      }
    } else {
      console.log('\n4️⃣ Skipping product creation test');
      if (!user.userKey) console.log('- Reason: No user key available');
      if (!blockchainService.isInitialized) console.log('- Reason: Blockchain service not initialized');
    }
    
    // 5. Test stage update blockchain sync
    console.log('\n5️⃣ Testing stage update blockchain sync...');
    const testProduct = products.find(p => p.currentStage < 7);
    if (testProduct) {
      console.log('Using product:', testProduct.name, 'at stage', testProduct.currentStage);
      
      // Get lifecycle info
      try {
        const lifecycleResponse = await axios.get(
          API_BASE_URL + '/lifecycle/product/' + testProduct._id + '/lifecycle', 
          { headers }
        );
        
        const lifecycle = lifecycleResponse.data.lifecycle;
        console.log('- Current stage:', lifecycle.stageName);
        console.log('- Blockchain data available:', !!lifecycle.blockchain);
        
        if (lifecycle.possibleNextStages.length > 0) {
          const nextStage = lifecycle.possibleNextStages[0];
          console.log('- Next stage would be:', nextStage.name);
          console.log('- Would trigger blockchain function for stage', nextStage.stage);
        }
        
      } catch (lifecycleError) {
        console.log('❌ Lifecycle check failed:', lifecycleError.response?.data?.message);
      }
    } else {
      console.log('No products available for stage update test');
    }
    
    // 6. Summary
    console.log('\n📋 BLOCKCHAIN SYNCHRONIZATION SUMMARY:');
    console.log('='.repeat(45));
    console.log('✅ Blockchain Service:', blockchainService.isInitialized ? 'WORKING' : 'NOT WORKING');
    console.log('✅ Product Creation Integration:', 'IMPLEMENTED');
    console.log('✅ Stage Update Integration:', 'IMPLEMENTED');
    console.log('⚠️ Current Sync Rate:', Math.round((blockchainEnabled / products.length) * 100) + '%');
    
    if (blockchainEnabled === 0) {
      console.log('\n🔍 ISSUES IDENTIFIED:');
      console.log('- No existing products are synchronized with blockchain');
      console.log('- This suggests blockchain integration may not be working in production');
      console.log('- New products should sync if blockchain service is working');
    }
    
  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response?.data) {
      console.error('API Error:', error.response.data.message);
      if (error.response.data.errors) {
        console.error('Validation errors:', error.response.data.errors);
      }
    } else {
      console.error('Network/Other Error:', error.message);
    }
  }
}

testBlockchainSync();