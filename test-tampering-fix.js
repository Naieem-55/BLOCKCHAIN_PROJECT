const MerkleRootGenerator = require('./backend/utils/merkleRoot');

console.log('🔐 Testing Tampering Detection Fix\n');
console.log('=' .repeat(50));

// Test product with zero values
const testProduct1 = {
  name: 'Test Product',
  description: 'Test Description',
  category: 'Electronics',
  batchNumber: 'BATCH-001',
  quantity: 0,  // Zero quantity
  unit: 'pcs',
  price: 0      // Zero price
};

// Test product with non-zero values
const testProduct2 = {
  name: 'Premium Product',
  description: 'Premium Description',
  category: 'Food',
  batchNumber: 'BATCH-002',
  quantity: 100,
  unit: 'kg',
  price: 50.99
};

function testScenarios(product, productName) {
  console.log(`\n📦 Testing: ${productName}`);
  console.log('-'.repeat(40));
  console.log(`Original: price=${product.price}, quantity=${product.quantity}`);
  
  const scenarios = MerkleRootGenerator.generateTamperingScenarios(product);
  
  let detectedCount = 0;
  scenarios.forEach(scenario => {
    const status = scenario.tamperingDetected ? '✅ DETECTED' : '❌ MISSED';
    console.log(`\n${scenario.name}: ${status}`);
    
    if (scenario.name === 'Price Manipulation') {
      console.log(`  Original price: ${product.price}`);
      console.log(`  Tampered price: ${scenario.tamperedData.price}`);
    }
    
    if (scenario.name === 'Quantity Inflation') {
      console.log(`  Original quantity: ${product.quantity}`);
      console.log(`  Tampered quantity: ${scenario.tamperedData.quantity}`);
    }
    
    if (scenario.tamperingDetected) {
      detectedCount++;
    }
  });
  
  const detectionRate = (detectedCount / scenarios.length * 100).toFixed(0);
  console.log(`\n📊 Detection Rate: ${detectedCount}/${scenarios.length} (${detectionRate}%)`);
  
  if (detectionRate === '100') {
    console.log('🎉 SUCCESS: All tampering scenarios detected!');
  } else {
    console.log('⚠️  WARNING: Some tampering scenarios were missed!');
  }
  
  return detectionRate;
}

// Run tests
const rate1 = testScenarios(testProduct1, 'Product with Zero Values');
const rate2 = testScenarios(testProduct2, 'Product with Non-Zero Values');

console.log('\n' + '='.repeat(50));
console.log('📈 FINAL RESULTS:');
console.log(`  Product 1 (zero values): ${rate1}% detection`);
console.log(`  Product 2 (non-zero values): ${rate2}% detection`);

if (rate1 === '100' && rate2 === '100') {
  console.log('\n✅ ALL TESTS PASSED! Tampering detection is now working at 100%');
} else {
  console.log('\n❌ TESTS FAILED! Some tampering scenarios are still undetected');
  process.exit(1);
}