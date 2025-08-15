const AccessControl = artifacts.require("AccessControl");
const SupplyChainTraceability = artifacts.require("SupplyChainTraceability");
const IoTIntegration = artifacts.require("IoTIntegration");

module.exports = async function(deployer, network, accounts) {
  // Deploy AccessControl first (base contract)
  await deployer.deploy(AccessControl);
  
  // Deploy SupplyChainTraceability
  await deployer.deploy(SupplyChainTraceability);
  const traceabilityInstance = await SupplyChainTraceability.deployed();
  
  // Deploy IoTIntegration
  await deployer.deploy(IoTIntegration);
  const iotInstance = await IoTIntegration.deployed();
  
  console.log("=== Contract Deployment Summary ===");
  console.log("AccessControl deployed at:", AccessControl.address);
  console.log("SupplyChainTraceability deployed at:", SupplyChainTraceability.address);
  console.log("IoTIntegration deployed at:", IoTIntegration.address);
  
  // Set up initial roles and configurations
  if (network !== 'mainnet') {
    console.log("Setting up initial configuration...");
    
    // Register some test participants
    const participantAddresses = accounts.slice(1, 6); // Use accounts 1-5 as participants
    const roles = ["Supplier", "Manufacturer", "Distributor", "Retailer", "Auditor"];
    const locations = ["New York", "Chicago", "Los Angeles", "Houston", "Phoenix"];
    
    for (let i = 0; i < participantAddresses.length; i++) {
      await traceabilityInstance.registerParticipant(
        participantAddresses[i],
        `${roles[i]} Company`,
        roles[i],
        locations[i],
        { from: accounts[0] }
      );
      console.log(`Registered ${roles[i]} at ${participantAddresses[i]}`);
    }
    
    console.log("Initial setup completed!");
  }
};