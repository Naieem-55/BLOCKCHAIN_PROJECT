const blockchainService = require('./backend/services/blockchainService.js');

console.log('🔍 Investigating Blockchain Contract Issue');
console.log('='.repeat(45));

blockchainService.initialize().then(() => {
  console.log('✅ Blockchain service initialized');
  console.log('');
  console.log('📋 Available contracts:');
  const contracts = blockchainService.contracts;
  Object.keys(contracts).forEach(contractName => {
    console.log('- ' + contractName + ':', contracts[contractName] ? 'YES' : 'NO');
    if (contracts[contractName] && contracts[contractName].methods) {
      const methodCount = Object.keys(contracts[contractName].methods).length;
      console.log('  Methods available:', methodCount);
    }
  });
  
  console.log('');
  console.log('🔍 Contract Check:');
  console.log('- Looking for: traceability');
  console.log('- Available: ' + Object.keys(contracts).join(', '));
  console.log('- contracts.traceability exists:', contracts.traceability ? 'YES' : 'NO');
  console.log('- contracts.supplychain exists:', contracts.supplychain ? 'YES' : 'NO');
  
  if (contracts.supplychain) {
    console.log('');
    console.log('📝 SupplyChain contract methods:');
    const methods = Object.keys(contracts.supplychain.methods);
    console.log('- Total methods:', methods.length);
    console.log('- Sample methods:', methods.slice(0, 10));
    
    // Check for product creation methods
    const productMethods = methods.filter(m => 
      m.toLowerCase().includes('product') || 
      m.toLowerCase().includes('medicine') ||
      m.toLowerCase().includes('add')
    );
    console.log('- Product-related methods:', productMethods);
    
    // Check specific methods we need
    console.log('');
    console.log('🎯 Required Method Check:');
    console.log('- createProduct:', methods.includes('createProduct') ? 'YES' : 'NO');
    console.log('- createProductWithKey:', methods.includes('createProductWithKey') ? 'YES' : 'NO');
    console.log('- addMedicine:', methods.includes('addMedicine') ? 'YES' : 'NO');
  }
  
  console.log('');
  console.log('💡 SOLUTION:');
  console.log('The blockchain service is looking for "contracts.traceability"');
  console.log('but the actual contract is loaded as "contracts.supplychain"');
  console.log('This is why blockchain integration is failing!');
  
}).catch(err => {
  console.error('❌ Initialization failed:', err.message);
});