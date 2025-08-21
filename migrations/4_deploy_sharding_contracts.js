const AdaptiveSharding = artifacts.require("AdaptiveSharding");
const HighEfficiencyProcessor = artifacts.require("HighEfficiencyProcessor");
const SupplyChainTraceability = artifacts.require("SupplyChainTraceability");

module.exports = async function(deployer, network, accounts) {
  console.log("=== Deploying Adaptive Sharding & High Efficiency Contracts ===");
  
  try {
    // Deploy AdaptiveSharding contract first
    console.log("Deploying AdaptiveSharding contract...");
    await deployer.deploy(AdaptiveSharding);
    const shardingInstance = await AdaptiveSharding.deployed();
    console.log(`✅ AdaptiveSharding deployed at: ${shardingInstance.address}`);
    
    // Deploy HighEfficiencyProcessor contract
    console.log("Deploying HighEfficiencyProcessor contract...");
    await deployer.deploy(HighEfficiencyProcessor, shardingInstance.address);
    const processorInstance = await HighEfficiencyProcessor.deployed();
    console.log(`✅ HighEfficiencyProcessor deployed at: ${processorInstance.address}`);
    
    // Deploy enhanced SupplyChainTraceability contract
    console.log("Deploying enhanced SupplyChainTraceability contract...");
    await deployer.deploy(SupplyChainTraceability, shardingInstance.address, processorInstance.address);
    const traceabilityInstance = await SupplyChainTraceability.deployed();
    console.log(`✅ SupplyChainTraceability deployed at: ${traceabilityInstance.address}`);
    
    if (network !== 'mainnet') {
      console.log("Setting up adaptive sharding configuration...");
      
      // Create initial shards for different types
      
      // Create product shards
      await shardingInstance.createShard("product", traceabilityInstance.address, 5000, { from: accounts[0] });
      console.log("✅ Product shard created");
      
      // Grant roles and register participants
      const PARTICIPANT_ROLE = await processorInstance.PARTICIPANT_ROLE();
      const roles = ["Supplier", "Manufacturer", "Distributor", "Retailer", "Auditor"];
      const locations = ["New York", "Chicago", "Los Angeles", "Houston", "Phoenix"];
      
      for (let i = 1; i < 6; i++) {
        await processorInstance.grantRole(PARTICIPANT_ROLE, accounts[i], { from: accounts[0] });
        await traceabilityInstance.registerParticipant(
          accounts[i],
          `${roles[i-1]} Company`,
          roles[i-1],
          locations[i-1],
          { from: accounts[0] }
        );
      }
      console.log("✅ Participant roles granted and registered");
      
      console.log(`
📊 Deployment Summary:
   AdaptiveSharding:        ${shardingInstance.address}
   HighEfficiencyProcessor: ${processorInstance.address}
   SupplyChainTraceability: ${traceabilityInstance.address}

🚀 Features Available:
   ✅ Adaptive shard selection
   ✅ Load balancing
   ✅ Batch processing optimization
   ✅ Gas efficiency tracking
   ✅ Performance monitoring
      `);
    }
    
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    throw error;
  }
};