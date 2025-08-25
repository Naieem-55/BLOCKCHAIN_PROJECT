const blockchainService = require('./backend/services/blockchainService.js');
const fs = require('fs');
const path = require('path');

async function checkNetworkId() {
  console.log('🔍 CHECKING BLOCKCHAIN NETWORK AND CONTRACT DEPLOYMENT');
  console.log('='.repeat(60));
  
  try {
    await blockchainService.initialize();
    
    const networkId = await blockchainService.web3.eth.net.getId();
    console.log('📡 Current Network ID:', networkId);
    
    // Check contract artifacts for deployment info
    const clientArtifactsPath = path.join(__dirname, 'client/src/artifacts');
    const contractFiles = ['AdaptiveSharding.json', 'SupplyChainTraceability.json', 'SupplyChain.json'];
    
    console.log('\n📋 Contract Deployment Status:');
    
    for (const contractFile of contractFiles) {
      const filePath = path.join(clientArtifactsPath, contractFile);
      if (fs.existsSync(filePath)) {
        try {
          const artifact = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          const contractName = contractFile.replace('.json', '');
          
          console.log(`\n🔗 ${contractName}:`);
          console.log('- Artifact exists: YES');
          
          if (artifact.networks) {
            const deployedNetworks = Object.keys(artifact.networks);
            console.log('- Deployed networks:', deployedNetworks.join(', '));
            
            if (artifact.networks[networkId]) {
              console.log('- Current network deployment: YES');
              console.log('- Contract address:', artifact.networks[networkId].address);
            } else {
              console.log('- Current network deployment: NO');
              console.log('- Available networks:', deployedNetworks);
              console.log('- Current network needed:', networkId);
            }
          } else {
            console.log('- No network deployment info');
          }
          
          // Check if contract is loaded in service
          const contractLoaded = blockchainService.contracts[contractName.toLowerCase()];
          console.log('- Loaded in service:', contractLoaded ? 'YES' : 'NO');
          
          if (contractLoaded && contractLoaded.methods) {
            const methods = Object.keys(contractLoaded.methods);
            console.log('- Available methods:', methods.length);
            console.log('- Sample methods:', methods.slice(0, 3).join(', '));
          }
        } catch (parseError) {
          console.log(`❌ Error parsing ${contractFile}:`, parseError.message);
        }
      } else {
        console.log(`❌ ${contractFile}: NOT FOUND`);
      }
    }
    
    console.log('\n🔍 Loaded Contracts in Blockchain Service:');
    const loadedContracts = Object.keys(blockchainService.contracts);
    console.log('- Total contracts loaded:', loadedContracts.length);
    console.log('- Contract names:', loadedContracts.join(', '));
    
    console.log('\n💡 RECOMMENDATIONS:');
    
    if (loadedContracts.length === 0) {
      console.log('❌ No contracts loaded - need to deploy contracts to current network');
    } else if (!blockchainService.contracts.adaptivesharding) {
      console.log('⚠️ AdaptiveSharding contract not loaded - may need redeployment');
    } else if (!blockchainService.contracts.supplychaintraceability) {
      console.log('⚠️ SupplyChainTraceability contract not loaded - may need redeployment');
    } else {
      console.log('✅ All key contracts appear to be loaded');
    }
    
  } catch (error) {
    console.error('❌ Network check failed:', error.message);
  }
}

checkNetworkId();