const AccessControl = artifacts.require("AccessControl");
const SupplyChainTraceability = artifacts.require("SupplyChainTraceability");
const IoTIntegration = artifacts.require("IoTIntegration");

module.exports = async function(deployer, network, accounts) {
  // Deploy AccessControl first (base contract)
  await deployer.deploy(AccessControl);
  
  // Note: SupplyChainTraceability will be deployed in migration 4 with sharding contracts
  // Skip deployment here to avoid constructor parameter issues
  
  // Deploy IoTIntegration
  await deployer.deploy(IoTIntegration);
  const iotInstance = await IoTIntegration.deployed();
  
  console.log("=== Contract Deployment Summary ===");
  console.log("AccessControl deployed at:", AccessControl.address);
  console.log("IoTIntegration deployed at:", IoTIntegration.address);
  console.log("Note: SupplyChainTraceability will be deployed in migration 4 with sharding contracts");
};