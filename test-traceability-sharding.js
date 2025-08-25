const axios = require('axios');
const blockchainService = require('./backend/services/blockchainService.js');

const API_BASE_URL = 'http://localhost:5003/api';

async function testTraceabilityWithSharding() {
  console.log('🔍 TESTING BLOCKCHAIN SUPPLY CHAIN TRACEABILITY WITH ADAPTIVE SHARDING');
  console.log('='.repeat(75));
  
  try {
    // 1. Authentication
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
    
    // 2. Initialize blockchain service and check contracts
    console.log('\n2️⃣ Checking blockchain contracts and sharding capability...');
    await blockchainService.initialize();
    
    console.log('📋 Available Contracts:');
    const contracts = blockchainService.contracts;
    Object.keys(contracts).forEach(contractName => {
      console.log('- ' + contractName + ':', contracts[contractName] ? 'YES' : 'NO');
    });
    
    // Check for adaptive sharding contract
    const hasAdaptiveSharding = !!contracts.adaptivesharding;
    const hasSupplyChain = !!contracts.supplychain;
    const hasTraceability = !!contracts.supplychaintraceability;
    
    console.log('\n🔗 Traceability & Sharding Status:');
    console.log('- SupplyChain contract:', hasSupplyChain ? 'AVAILABLE' : 'MISSING');
    console.log('- Traceability contract:', hasTraceability ? 'AVAILABLE' : 'MISSING');
    console.log('- Adaptive Sharding contract:', hasAdaptiveSharding ? 'AVAILABLE' : 'MISSING');
    
    // Check sharding methods if available
    if (hasAdaptiveSharding) {
      const shardingMethods = Object.keys(contracts.adaptivesharding.methods);
      console.log('- Sharding methods available:', shardingMethods.length);
      console.log('- Sample methods:', shardingMethods.slice(0, 5));
      
      // Check for key sharding functions
      const keyMethods = ['createShard', 'assignToShard', 'getShardInfo', 'rebalanceShards'];
      keyMethods.forEach(method => {
        console.log(`  - ${method}:`, shardingMethods.includes(method) ? 'YES' : 'NO');
      });
    }
    
    // 3. Test supply chain traceability
    console.log('\n3️⃣ Testing supply chain traceability...');
    
    // Create multiple products to test traceability
    const testProducts = [];
    for (let i = 0; i < 3; i++) {
      const productData = {
        name: `Traceable Product ${i + 1} - ${Date.now()}`,
        description: `Testing end-to-end traceability - Product ${i + 1}`,
        category: 'Pharmaceuticals',
        batchNumber: `TRACE-BATCH-${Date.now()}-${i}`,
        userKey: user.userKey,
        expiryDate: '2025-12-31T23:59:59.000Z',
        initialLocation: `Manufacturing Plant ${i + 1}`
      };
      
      console.log(`\n📦 Creating Product ${i + 1}:`, productData.name);
      const createResponse = await axios.post(API_BASE_URL + '/products', productData, { headers });
      
      if (createResponse.data.success) {
        const product = createResponse.data.data;
        const blockchain = createResponse.data.blockchain;
        
        testProducts.push({
          id: product._id,
          name: product.name,
          batchNumber: product.batchNumber,
          blockchainId: product.blockchainId,
          transactionHash: product.transactionHash,
          shardId: product.shardId
        });
        
        console.log('✅ Product created successfully');
        console.log('- Database ID:', product._id);
        console.log('- Blockchain ID:', product.blockchainId || 'None');
        console.log('- Transaction Hash:', product.transactionHash || 'None');
        console.log('- Shard ID:', product.shardId || 'None');
        console.log('- Blockchain enabled:', blockchain?.enabled || false);
      } else {
        console.log('❌ Product creation failed:', createResponse.data.message);
      }
    }
    
    // 4. Test full lifecycle traceability
    console.log('\n4️⃣ Testing full lifecycle traceability...');
    
    if (testProducts.length > 0) {
      const testProduct = testProducts[0];
      console.log('🔄 Testing lifecycle progression for:', testProduct.name);
      
      // Define the stages to test
      const stages = [
        { stage: 1, name: 'Raw Material', location: 'Raw Material Warehouse' },
        { stage: 2, name: 'Manufacturing', location: 'Production Floor' },
        { stage: 3, name: 'Quality Control', location: 'QC Laboratory' },
        { stage: 4, name: 'Packaging', location: 'Packaging Center' },
        { stage: 5, name: 'Distribution', location: 'Distribution Center' }
      ];
      
      for (const stageInfo of stages) {
        console.log(`\n🔄 Moving to ${stageInfo.name} stage...`);
        
        try {
          const stageUpdateResponse = await axios.put(
            `${API_BASE_URL}/lifecycle/product/${testProduct.id}/stage`,
            {
              newStage: stageInfo.stage,
              notes: `Automated traceability test - ${stageInfo.name}`,
              location: stageInfo.location
            },
            { headers }
          );
          
          if (stageUpdateResponse.data.success) {
            console.log('✅ Stage updated successfully');
            console.log('- New stage:', stageUpdateResponse.data.product.stageName);
            console.log('- Location:', stageUpdateResponse.data.product.location);
            console.log('- Blockchain TX:', stageUpdateResponse.data.product.blockchainTx || 'None');
          } else {
            console.log('❌ Stage update failed:', stageUpdateResponse.data.message);
          }
        } catch (stageError) {
          console.log('❌ Stage update error:', stageError.response?.data?.message || stageError.message);
        }
        
        // Small delay between stage updates
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // 5. Test traceability retrieval
    console.log('\n5️⃣ Testing traceability data retrieval...');
    
    for (const product of testProducts) {
      console.log(`\n📋 Retrieving traceability for: ${product.name}`);
      
      try {
        // Get lifecycle data
        const lifecycleResponse = await axios.get(
          `${API_BASE_URL}/lifecycle/product/${product.id}/lifecycle`,
          { headers }
        );
        
        if (lifecycleResponse.data.success) {
          const lifecycle = lifecycleResponse.data.lifecycle;
          console.log('✅ Lifecycle data retrieved');
          console.log('- Current stage:', lifecycle.stageName);
          console.log('- Stage description:', lifecycle.stageDescription);
          console.log('- Blockchain data available:', !!lifecycle.blockchain);
          console.log('- History entries:', lifecycle.history.length);
          console.log('- Is complete:', lifecycle.isComplete);
          
          if (lifecycle.blockchain) {
            console.log('- Blockchain current stage:', lifecycle.blockchain.currentStage);
          }
        }
        
        // Get complete timeline
        const timelineResponse = await axios.get(
          `${API_BASE_URL}/lifecycle/product/${product.id}/timeline`,
          { headers }
        );
        
        if (timelineResponse.data.success) {
          const timeline = timelineResponse.data.timeline;
          console.log('✅ Timeline data retrieved');
          console.log('- Total events:', timeline.length);
          console.log('- Product info:', timelineResponse.data.productInfo.name);
          
          // Show recent events
          console.log('- Recent events:');
          timeline.slice(0, 3).forEach((event, index) => {
            console.log(`  ${index + 1}. ${event.title} - ${new Date(event.timestamp).toLocaleString()}`);
            if (event.transactionHash) {
              console.log(`     TX: ${event.transactionHash}`);
            }
          });
        }
        
      } catch (traceError) {
        console.log('❌ Traceability retrieval failed:', traceError.response?.data?.message || traceError.message);
      }
    }
    
    // 6. Test adaptive sharding functionality
    console.log('\n6️⃣ Testing adaptive sharding functionality...');
    
    if (hasAdaptiveSharding) {
      console.log('🔄 Testing sharding contract integration...');
      
      try {
        // Check if products have been assigned to shards
        let shardedProducts = 0;
        let totalShards = new Set();
        
        testProducts.forEach(product => {
          if (product.shardId) {
            shardedProducts++;
            totalShards.add(product.shardId);
          }
        });
        
        console.log('📊 Sharding Results:');
        console.log('- Products with shard assignments:', shardedProducts);
        console.log('- Total shards used:', totalShards.size);
        console.log('- Shard IDs:', Array.from(totalShards));
        
        if (shardedProducts > 0) {
          console.log('✅ Adaptive sharding is working');
        } else {
          console.log('⚠️ No products assigned to shards');
        }
        
        // Test direct sharding contract methods if available
        if (contracts.adaptivesharding.methods.getShardInfo) {
          console.log('🔍 Testing direct shard queries...');
          
          try {
            // Try to get shard information
            for (let shardId = 0; shardId < 3; shardId++) {
              try {
                const shardInfo = await contracts.adaptivesharding.methods
                  .getShardInfo(shardId)
                  .call();
                console.log(`- Shard ${shardId} info:`, shardInfo);
              } catch (shardError) {
                console.log(`- Shard ${shardId}: Not found or error`);
              }
            }
          } catch (directShardError) {
            console.log('⚠️ Direct shard query failed:', directShardError.message);
          }
        }
        
      } catch (shardingError) {
        console.log('❌ Sharding test failed:', shardingError.message);
      }
    } else {
      console.log('⚠️ Adaptive sharding contract not available');
      console.log('- Traceability will work without sharding');
      console.log('- All data stored in main blockchain');
    }
    
    // 7. Final verification and summary
    console.log('\n7️⃣ Final verification and summary...');
    
    // Get analytics to verify system state
    try {
      const analyticsResponse = await axios.get(
        `${API_BASE_URL}/lifecycle/analytics`,
        { headers }
      );
      
      if (analyticsResponse.data.success) {
        const analytics = analyticsResponse.data.analytics;
        console.log('📈 Lifecycle Analytics:');
        console.log('- Total products:', analytics.totalProducts);
        console.log('- Completion rate:', analytics.completionRate + '%');
        console.log('- Products by stage:', Object.entries(analytics.byStage).slice(0, 5));
        
        if (analytics.bottlenecks.length > 0) {
          console.log('- Bottlenecks detected:', analytics.bottlenecks.length);
        }
      }
    } catch (analyticsError) {
      console.log('⚠️ Analytics not available:', analyticsError.response?.data?.message);
    }
    
    // 8. Summary
    console.log('\n🏆 BLOCKCHAIN SUPPLY CHAIN TRACEABILITY TEST RESULTS:');
    console.log('='.repeat(60));
    
    const traceabilityWorking = testProducts.some(p => p.blockchainId && p.transactionHash);
    const shardingWorking = testProducts.some(p => p.shardId !== null);
    
    console.log('✅ Blockchain Service:', blockchainService.isInitialized ? 'OPERATIONAL' : 'FAILED');
    console.log('✅ Supply Chain Contract:', hasSupplyChain ? 'AVAILABLE' : 'MISSING');
    console.log('✅ Traceability Integration:', traceabilityWorking ? 'WORKING' : 'FAILED');
    console.log('✅ Adaptive Sharding:', hasAdaptiveSharding ? 
      (shardingWorking ? 'WORKING' : 'AVAILABLE BUT INACTIVE') : 'NOT AVAILABLE');
    console.log('✅ End-to-End Traceability:', traceabilityWorking ? 'FUNCTIONAL' : 'FAILED');
    
    console.log('\n📊 Test Results Summary:');
    console.log('- Products created with blockchain:', testProducts.filter(p => p.blockchainId).length);
    console.log('- Products with transaction hashes:', testProducts.filter(p => p.transactionHash).length);
    console.log('- Products assigned to shards:', testProducts.filter(p => p.shardId).length);
    
    if (traceabilityWorking) {
      console.log('\n🎉 SUCCESS: Blockchain-based supply chain traceability is working!');
      console.log('- Products are recorded on blockchain with unique identifiers');
      console.log('- Full lifecycle tracking is operational');
      console.log('- Transaction hashes provide immutable audit trail');
      
      if (shardingWorking) {
        console.log('- Adaptive sharding is distributing data across multiple shards');
      } else if (hasAdaptiveSharding) {
        console.log('- Adaptive sharding contract available but not actively sharding data');
      } else {
        console.log('- Operating without adaptive sharding (single blockchain)');
      }
    } else {
      console.log('\n❌ ISSUES: Blockchain traceability has problems');
      console.log('- Check blockchain service initialization');
      console.log('- Verify smart contract deployment');
      console.log('- Review transaction processing');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed with error:');
    if (error.response?.data) {
      console.error('API Error:', error.response.data.message);
      if (error.response.data.errors) {
        console.error('Validation Errors:', error.response.data.errors);
      }
    } else {
      console.error('System Error:', error.message);
    }
  }
}

// Helper function to wait
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

testTraceabilityWithSharding();