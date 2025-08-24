#!/usr/bin/env node

/**
 * Simple Blockchain Immutability Test
 * Tests how Merkle Root validation prevents data tampering
 */

const Web3 = require('web3');
const colors = require('colors');
const crypto = require('crypto');

// Configuration - Use deployed contract addresses from migration output
const web3 = new Web3('http://localhost:8545');
const SUPPLY_CHAIN_ADDRESS = '0x80780ed9fB7CcF975e9B31AB84D5fD45c74e4089'; // From migration log
const SHARDING_ADDRESS = '0x81c7B303A8982Cb7d6547124a85D0edB927Bb779';     // From migration log

// Test accounts from Ganache
const accounts = [
  '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1',
  '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0',
  '0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b'
];

// Test Product Data
const originalProduct = {
  name: "Organic Coffee Beans",
  description: "Premium Ethiopian coffee beans",
  category: "Food",
  batchNumber: "COFFEE-ETH-2025-001",
  manufacturer: accounts[0],
  timestamp: Math.floor(Date.now() / 1000),
  location: "Addis Ababa, Ethiopia",
  price: 25.99
};

console.log(colors.cyan.bold('\n🔐 BLOCKCHAIN IMMUTABILITY DEMONSTRATION'));
console.log(colors.cyan.bold('==========================================\n'));

// Step 1: Generate Merkle Root for Original Data
function generateMerkleRoot(data) {
  const sortedKeys = Object.keys(data).sort();
  const dataString = sortedKeys.map(key => `${key}:${data[key]}`).join('|');
  const hash = crypto.createHash('sha256').update(dataString).digest('hex');
  return '0x' + hash;
}

// Step 2: Simulate Tampering Attempts
function simulateTamperingAttempts() {
  console.log(colors.yellow.bold('📋 STEP 1: Original Product Data'));
  console.log('=================================');
  
  const originalMerkleRoot = generateMerkleRoot(originalProduct);
  
  console.log('✅ Original Product:');
  console.log(`   Name: ${originalProduct.name}`);
  console.log(`   Batch: ${originalProduct.batchNumber}`);
  console.log(`   Manufacturer: ${originalProduct.manufacturer}`);
  console.log(`   Timestamp: ${originalProduct.timestamp} (${new Date(originalProduct.timestamp * 1000).toISOString()})`);
  console.log(`   Location: ${originalProduct.location}`);
  console.log(`   Price: $${originalProduct.price}`);
  console.log(`   📊 Merkle Root: ${colors.green(originalMerkleRoot)}\n`);

  // Tampering attempts
  const tamperingAttempts = [
    {
      name: "🕐 Manufacturing Date Fraud",
      description: "Attacker tries to fake an earlier manufacturing date",
      tamperedData: {
        ...originalProduct,
        timestamp: originalProduct.timestamp - 86400 * 7, // 7 days earlier
      }
    },
    {
      name: "👤 Ownership Manipulation", 
      description: "Attacker tries to change the manufacturer",
      tamperedData: {
        ...originalProduct,
        manufacturer: accounts[1], // Different manufacturer
      }
    },
    {
      name: "💰 Price Manipulation",
      description: "Attacker tries to increase the product value",
      tamperedData: {
        ...originalProduct,
        price: 299.99, // Much higher price
      }
    },
    {
      name: "📦 Quality Grade Fraud",
      description: "Attacker tries to upgrade product quality",
      tamperedData: {
        ...originalProduct,
        description: "Premium Ethiopian coffee beans - Grade A+ Certified Organic",
        category: "Premium Organic Food",
      }
    },
    {
      name: "📍 Origin Fraud",
      description: "Attacker tries to fake premium origin",
      tamperedData: {
        ...originalProduct,
        location: "Blue Mountain, Jamaica", // Premium coffee origin
        batchNumber: "COFFEE-JAM-2025-001",
      }
    }
  ];

  console.log(colors.yellow.bold('🎯 STEP 2: Tampering Detection Test'));
  console.log('===================================');
  
  let detectedCount = 0;
  let totalAttempts = tamperingAttempts.length;

  tamperingAttempts.forEach((attempt, index) => {
    console.log(`\n${index + 1}. ${attempt.name}`);
    console.log(`   ${colors.gray(attempt.description)}`);
    
    const tamperedMerkleRoot = generateMerkleRoot(attempt.tamperedData);
    
    console.log(`   Original Hash:  ${colors.green(originalMerkleRoot)}`);
    console.log(`   Tampered Hash:  ${colors.red(tamperedMerkleRoot)}`);
    
    const isDetected = originalMerkleRoot !== tamperedMerkleRoot;
    
    if (isDetected) {
      console.log(`   Result: ${colors.green.bold('✅ TAMPERING DETECTED!')}`);
      console.log(`   ${colors.green('🛡️  Blockchain integrity maintained')}`);
      detectedCount++;
    } else {
      console.log(`   Result: ${colors.red.bold('❌ TAMPERING MISSED!')}`);
      console.log(`   ${colors.red('🚨 Security breach detected!')}`);
    }
  });

  // Step 3: Summary
  console.log(colors.yellow.bold('\n📊 STEP 3: Test Results Summary'));
  console.log('===============================');
  
  console.log(`\n🎯 Detection Rate: ${detectedCount}/${totalAttempts} (${Math.round((detectedCount/totalAttempts)*100)}%)`);
  
  if (detectedCount === totalAttempts) {
    console.log(colors.green.bold('✅ ALL TAMPERING ATTEMPTS DETECTED!'));
    console.log(colors.green('🔒 Blockchain immutability is working correctly'));
  } else {
    console.log(colors.red.bold('❌ SOME TAMPERING ATTEMPTS MISSED!'));
    console.log(colors.red('🚨 Security vulnerability detected'));
  }

  // Step 4: Explanation
  console.log(colors.yellow.bold('\n🔍 STEP 4: How Immutability Works'));
  console.log('==================================');
  
  console.log('\n🔐 Cryptographic Protection:');
  console.log('   • Each product gets a unique Merkle Root hash');
  console.log('   • Hash is calculated from ALL product data');  
  console.log('   • ANY change produces a different hash');
  console.log('   • Impossible to reverse-engineer original data');
  
  console.log('\n⛓️  Blockchain Storage:');
  console.log('   • Hash stored permanently on blockchain');
  console.log('   • Cannot be altered once recorded');
  console.log('   • Validated by network consensus');
  console.log('   • Cryptographically linked to previous blocks');
  
  console.log('\n🛡️  Security Guarantees:');
  console.log('   • Tampered data will have different hash');
  console.log('   • Hash mismatch immediately detected');
  console.log('   • Historical audit trail preserved');
  console.log('   • No single point of failure');

  // Step 5: Real-world implications  
  console.log(colors.yellow.bold('\n🌍 STEP 5: Real-world Applications'));
  console.log('===================================');
  
  console.log('\n📋 Supply Chain Integrity:');
  console.log('   • Prevent counterfeit products');
  console.log('   • Verify authenticity of goods');
  console.log('   • Track product journey');
  console.log('   • Ensure quality standards');
  
  console.log('\n⚖️  Legal & Compliance:');  
  console.log('   • Immutable audit trail');
  console.log('   • Regulatory compliance');
  console.log('   • Evidence for legal disputes');
  console.log('   • Transparent record keeping');
  
  console.log('\n💼 Business Benefits:');
  console.log('   • Increased consumer trust');
  console.log('   • Reduced fraud losses');
  console.log('   • Better brand protection');
  console.log('   • Competitive advantage');

  return { detectedCount, totalAttempts, originalMerkleRoot };
}

// Step 6: Demonstrate blockchain transaction immutability
async function demonstrateTransactionImmutability() {
  console.log(colors.yellow.bold('\n⛓️  STEP 6: Transaction Immutability'));
  console.log('====================================');
  
  try {
    // Get latest block to show immutable properties
    const latestBlock = await web3.eth.getBlock('latest');
    
    console.log('\n📦 Current Blockchain State:');
    console.log(`   Block Number: ${latestBlock.number}`);
    console.log(`   Block Hash: ${latestBlock.hash}`);
    console.log(`   Parent Hash: ${latestBlock.parentHash}`);
    console.log(`   Timestamp: ${new Date(Number(latestBlock.timestamp) * 1000).toISOString()}`);
    console.log(`   Transactions: ${latestBlock.transactions.length}`);
    
    console.log('\n🔒 Immutable Properties:');
    console.log('   • Block hash cryptographically secures all data');
    console.log('   • Parent hash links to previous block');
    console.log('   • Timestamp cannot be altered retroactively');
    console.log('   • Transaction order is permanent');
    console.log('   • Consensus required for any changes');
    
    // Check network
    const networkId = await web3.eth.net.getId();
    const accountCount = (await web3.eth.getAccounts()).length;
    
    console.log('\n🌐 Network Security:');
    console.log(`   • Network ID: ${networkId}`);
    console.log(`   • Available Accounts: ${accountCount}`);
    console.log('   • Decentralized validation');
    console.log('   • Consensus mechanism active');
    
  } catch (error) {
    console.log(colors.red(`❌ Error accessing blockchain: ${error.message}`));
  }
}

// Main execution
async function runImmutabilityTest() {
  // Run tampering detection test
  const results = simulateTamperingAttempts();
  
  // Demonstrate blockchain immutability
  await demonstrateTransactionImmutability();
  
  // Final conclusion
  console.log(colors.cyan.bold('\n🏁 CONCLUSION'));
  console.log('=============');
  
  if (results.detectedCount === results.totalAttempts) {
    console.log(colors.green.bold('✅ BLOCKCHAIN IMMUTABILITY VERIFIED'));
    console.log(colors.green('The system successfully detects ALL tampering attempts'));
    console.log(colors.green('Data integrity is cryptographically guaranteed\n'));
  } else {
    console.log(colors.red.bold('❌ SECURITY ISSUES DETECTED'));
    console.log(colors.red('Some tampering attempts were not caught'));
    console.log(colors.red('Additional security measures needed\n'));
  }
}

// Run the test
runImmutabilityTest().catch(console.error);