const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class BlockchainService {
  constructor() {
    this.web3 = null;
    this.contracts = {};
    this.accounts = [];
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Connect to blockchain network
      const providerUrl = process.env.WEB3_PROVIDER_URL || 'http://localhost:8545';
      this.web3 = new Web3(providerUrl);
      
      // Test connection
      const networkId = await this.web3.eth.net.getId();
      logger.info(`Connected to blockchain network ID: ${networkId}`);
      
      // Get accounts
      this.accounts = await this.web3.eth.getAccounts();
      logger.info(`Available accounts: ${this.accounts.length}`);
      
      // Load contract artifacts and initialize contracts
      await this.loadContracts();
      
      this.isInitialized = true;
      logger.info('Blockchain service initialized successfully');
      
    } catch (error) {
      logger.error(`Blockchain service initialization failed: ${error.message}`);
      logger.warn('Application will continue without blockchain functionality');
      this.isInitialized = false;
      // Don't throw error, allow app to continue
    }
  }

  async loadContracts() {
    try {
      const contractsPath = path.join(__dirname, '../../build/contracts');
      
      // Try client artifacts first, then build directory
      const clientArtifactsPath = path.join(__dirname, '../../client/src/artifacts');
      
      const loadContractFromPath = async (contractName, searchPaths) => {
        for (const basePath of searchPaths) {
          const filePath = path.join(basePath, `${contractName}.json`);
          if (fs.existsSync(filePath)) {
            try {
              const artifact = JSON.parse(fs.readFileSync(filePath, 'utf8'));
              const networkId = await this.web3.eth.net.getId();
              
              if (artifact.networks && artifact.networks[networkId]) {
                this.contracts[contractName.toLowerCase()] = new this.web3.eth.Contract(
                  artifact.abi,
                  artifact.networks[networkId].address
                );
                logger.info(`${contractName} contract loaded from ${basePath}`);
                return true;
              }
            } catch (err) {
              logger.warn(`Could not load ${contractName} from ${filePath}: ${err.message}`);
            }
          }
        }
        return false;
      };

      const searchPaths = [clientArtifactsPath, contractsPath];

      // Load core contracts
      await loadContractFromPath('SupplyChain', searchPaths);
      await loadContractFromPath('SupplyChainTraceability', searchPaths);
      await loadContractFromPath('AdaptiveSharding', searchPaths);
      await loadContractFromPath('IoTIntegration', searchPaths);
      await loadContractFromPath('AccessControl', searchPaths);
      await loadContractFromPath('HighEfficiencyProcessor', searchPaths);

      // Set aliases for backward compatibility
      if (this.contracts.supplychain) {
        this.contract = this.contracts.supplychain;
      }
      if (this.contracts.supplychaintraceability) {
        this.contracts.traceability = this.contracts.supplychaintraceability;
      }
      if (this.contracts.adaptivesharding) {
        this.contracts.sharding = this.contracts.adaptivesharding;
      }
      if (this.contracts.iotintegration) {
        this.contracts.iot = this.contracts.iotintegration;
        this.iotContract = this.contracts.iot;
      }
      if (this.contracts.highefficiencyprocessor) {
        this.contracts.processor = this.contracts.highefficiencyprocessor;
      }
      
      logger.info('Smart contracts loaded successfully');
      
    } catch (error) {
      logger.error(`Contract loading failed: ${error.message}`);
      // Don't throw - allow app to continue without blockchain
    }
  }

  // Product Management Functions with Adaptive Sharding
  async createProduct(productData, fromAccount) {
    try {
      if (!this.contracts.traceability) {
        logger.warn('Traceability contract not available, creating product without blockchain');
        return { productId: null, transactionHash: null, blockchainEnabled: false };
      }

      const { name, description, category, batchNumber, expiryDate, initialLocation } = productData;
      
      // Get optimal shard for this product
      let optimalShard = null;
      try {
        if (this.contracts.sharding) {
          optimalShard = await this.contracts.sharding.methods
            .getOptimalShard('product')
            .call();
          logger.info(`Optimal shard selected: ${optimalShard}`);
        }
      } catch (shardError) {
        logger.warn(`Sharding not available: ${shardError.message}`);
      }

      // Create product on blockchain
      const result = await this.contracts.traceability.methods
        .createProduct(name, description, category, batchNumber, expiryDate || 0, initialLocation)
        .send({ from: fromAccount, gas: 500000 });
      
      const productId = result.events.ProductCreated.returnValues.productId;

      // Update shard metrics if sharding is available
      if (this.contracts.sharding && optimalShard) {
        try {
          await this.updateShardLoad(optimalShard, 500000, Date.now(), true, fromAccount);
        } catch (shardError) {
          logger.warn(`Could not update shard metrics: ${shardError.message}`);
        }
      }
      
      logger.info(`Product created on blockchain with ID: ${productId}`);
      return { 
        productId, 
        transactionHash: result.transactionHash, 
        shardId: optimalShard,
        blockchainEnabled: true
      };
      
    } catch (error) {
      logger.error(`Create product failed: ${error.message}`);
      // Return partial success for non-blockchain errors
      return { 
        productId: null, 
        transactionHash: null, 
        error: error.message,
        blockchainEnabled: false
      };
    }
  }

  async transferProduct(productId, newOwner, newLocation, fromAccount) {
    try {
      const result = await this.contracts.traceability.methods
        .transferProduct(productId, newOwner, newLocation)
        .send({ from: fromAccount, gas: 300000 });
      
      logger.info(`Product ${productId} transferred to ${newOwner}`);
      return { transactionHash: result.transactionHash };
      
    } catch (error) {
      logger.error(`Transfer product failed: ${error.message}`);
      throw error;
    }
  }

  async updateProductStage(productId, newStage, fromAccount) {
    try {
      const result = await this.contracts.traceability.methods
        .updateStage(productId, newStage)
        .send({ from: fromAccount, gas: 200000 });
      
      logger.info(`Product ${productId} stage updated to ${newStage}`);
      return { transactionHash: result.transactionHash };
      
    } catch (error) {
      logger.error(`Update product stage failed: ${error.message}`);
      throw error;
    }
  }

  async batchTransferProducts(batchOperation, fromAccount) {
    try {
      const result = await this.contracts.traceability.methods
        .batchTransfer(batchOperation)
        .send({ from: fromAccount, gas: 1000000 });
      
      logger.info(`Batch transfer completed for ${batchOperation.productIds.length} products`);
      return { transactionHash: result.transactionHash };
      
    } catch (error) {
      logger.error(`Batch transfer failed: ${error.message}`);
      throw error;
    }
  }

  async addQualityCheck(productId, checkData, fromAccount) {
    try {
      const { checkType, passed, notes } = checkData;
      
      const result = await this.contracts.traceability.methods
        .addQualityCheck(productId, checkType, passed, notes)
        .send({ from: fromAccount, gas: 250000 });
      
      logger.info(`Quality check added for product ${productId}`);
      return { transactionHash: result.transactionHash };
      
    } catch (error) {
      logger.error(`Add quality check failed: ${error.message}`);
      throw error;
    }
  }

  // Participant Management Functions
  async registerParticipant(participantData, fromAccount) {
    try {
      const { address, name, role, location } = participantData;
      
      const result = await this.contracts.traceability.methods
        .registerParticipant(address, name, role, location)
        .send({ from: fromAccount, gas: 300000 });
      
      logger.info(`Participant registered: ${name} at ${address}`);
      return { transactionHash: result.transactionHash };
      
    } catch (error) {
      logger.error(`Register participant failed: ${error.message}`);
      throw error;
    }
  }

  // IoT Integration Functions
  async registerSensor(sensorData, fromAccount) {
    try {
      const { sensorId, sensorType, description, calibrationData } = sensorData;
      
      const result = await this.contracts.iot.methods
        .registerSensor(sensorId, sensorType, description, calibrationData)
        .send({ from: fromAccount, gas: 300000 });
      
      logger.info(`Sensor registered: ${sensorId}`);
      return { transactionHash: result.transactionHash };
      
    } catch (error) {
      logger.error(`Register sensor failed: ${error.message}`);
      throw error;
    }
  }

  async recordSensorData(sensorDataRecord, fromAccount) {
    try {
      const { sensorId, productId, value, unit, additionalData } = sensorDataRecord;
      
      const result = await this.contracts.iot.methods
        .recordSensorData(sensorId, productId, value, unit, additionalData)
        .send({ from: fromAccount, gas: 250000 });
      
      logger.info(`Sensor data recorded for product ${productId}`);
      return { transactionHash: result.transactionHash };
      
    } catch (error) {
      logger.error(`Record sensor data failed: ${error.message}`);
      throw error;
    }
  }

  async batchRecordSensorData(batchData, fromAccount) {
    try {
      const { sensorIds, productIds, values, units, additionalData } = batchData;
      
      const result = await this.contracts.iot.methods
        .batchRecordSensorData(sensorIds, productIds, values, units, additionalData)
        .send({ from: fromAccount, gas: 800000 });
      
      logger.info(`Batch sensor data recorded for ${productIds.length} products`);
      return { transactionHash: result.transactionHash };
      
    } catch (error) {
      logger.error(`Batch record sensor data failed: ${error.message}`);
      throw error;
    }
  }

  // Query Functions
  async getProduct(productId) {
    try {
      const product = await this.contracts.traceability.methods.products(productId).call();
      return product;
    } catch (error) {
      logger.error(`Get product failed: ${error.message}`);
      throw error;
    }
  }

  async getProductHistory(productId) {
    try {
      const history = await this.contracts.traceability.methods
        .getProductHistory(productId)
        .call();
      return history;
    } catch (error) {
      logger.error(`Get product history failed: ${error.message}`);
      throw error;
    }
  }

  async getProductSensorData(productId) {
    try {
      const sensorData = await this.contracts.iot.methods
        .getProductSensorData(productId)
        .call();
      return sensorData;
    } catch (error) {
      logger.error(`Get product sensor data failed: ${error.message}`);
      throw error;
    }
  }

  async getProductAlerts(productId) {
    try {
      const alerts = await this.contracts.iot.methods
        .getProductAlerts(productId)
        .call();
      return alerts;
    } catch (error) {
      logger.error(`Get product alerts failed: ${error.message}`);
      throw error;
    }
  }

  async getBatchProducts(batchNumber) {
    try {
      const products = await this.contracts.traceability.methods
        .getBatchProducts(batchNumber)
        .call();
      return products;
    } catch (error) {
      logger.error(`Get batch products failed: ${error.message}`);
      throw error;
    }
  }

  async isProductAuthentic(productId) {
    try {
      const isAuthentic = await this.contracts.traceability.methods
        .isProductAuthentic(productId)
        .call();
      return isAuthentic;
    } catch (error) {
      logger.error(`Check product authenticity failed: ${error.message}`);
      throw error;
    }
  }

  // High-Efficiency Blockchain Operations
  async getRecommendedShard(shardType, estimatedGas = 300000, priority = 1) {
    try {
      if (!this.contracts.sharding) {
        return { shardId: null, reason: 'Sharding not available' };
      }

      const result = await this.contracts.sharding.methods
        .getRecommendedShard(shardType, estimatedGas, priority)
        .call();
      
      return { shardId: result[0], reason: result[1] };
    } catch (error) {
      logger.error(`Get recommended shard failed: ${error.message}`);
      return { shardId: null, reason: 'Error getting shard' };
    }
  }

  async getSystemEfficiencyScore() {
    try {
      if (!this.contracts.sharding) {
        return 0;
      }

      const score = await this.contracts.sharding.methods
        .getSystemEfficiencyScore()
        .call();
      
      return parseInt(score);
    } catch (error) {
      logger.error(`Get system efficiency failed: ${error.message}`);
      return 0;
    }
  }

  async getSystemStats() {
    try {
      if (!this.contracts.sharding) {
        return null;
      }

      const stats = await this.contracts.sharding.methods
        .getSystemStats()
        .call();
      
      return {
        totalShards: parseInt(stats.totalShards),
        activeShards: parseInt(stats.activeShards),
        totalTransactions: parseInt(stats.totalTransactions),
        avgSystemLoad: parseInt(stats.avgSystemLoad),
        systemEfficiency: parseInt(stats.systemEfficiency)
      };
    } catch (error) {
      logger.error(`Get system stats failed: ${error.message}`);
      return null;
    }
  }

  // Adaptive Sharding Functions
  async createShard(shardData, fromAccount) {
    try {
      if (!this.contracts.sharding) {
        throw new Error('Sharding contract not available');
      }

      const { shardType, shardContract, capacity } = shardData;
      
      const result = await this.contracts.sharding.methods
        .createShard(shardType, shardContract, capacity)
        .send({ from: fromAccount, gas: 500000 });
      
      const shardId = result.events.ShardCreated.returnValues.shardId;
      logger.info(`Shard created with ID: ${shardId}`);
      return { shardId, transactionHash: result.transactionHash };
      
    } catch (error) {
      logger.error(`Create shard failed: ${error.message}`);
      throw error;
    }
  }

  async activateShard(shardId, fromAccount) {
    try {
      const result = await this.contracts.sharding.methods
        .activateShard(shardId)
        .send({ from: fromAccount, gas: 200000 });
      
      logger.info(`Shard ${shardId} activated`);
      return { transactionHash: result.transactionHash };
      
    } catch (error) {
      logger.error(`Activate shard failed: ${error.message}`);
      throw error;
    }
  }

  async assignProductToShard(productId, preferredRegion, fromAccount) {
    try {
      const result = await this.contracts.sharding.methods
        .assignProductToShard(productId, preferredRegion)
        .send({ from: fromAccount, gas: 300000 });
      
      const assignedShardId = result.events.ProductAssignedToShard.returnValues.shardId;
      logger.info(`Product ${productId} assigned to shard ${assignedShardId}`);
      return { shardId: assignedShardId, transactionHash: result.transactionHash };
      
    } catch (error) {
      logger.error(`Assign product to shard failed: ${error.message}`);
      throw error;
    }
  }

  async updateShardMetrics(shardId, metrics, fromAccount) {
    try {
      const { totalTransactions, avgResponseTime, throughput, errorRate } = metrics;
      
      const result = await this.contracts.sharding.methods
        .updateShardMetrics(shardId, totalTransactions, avgResponseTime, throughput, errorRate)
        .send({ from: fromAccount, gas: 250000 });
      
      logger.info(`Shard ${shardId} metrics updated`);
      return { transactionHash: result.transactionHash };
      
    } catch (error) {
      logger.error(`Update shard metrics failed: ${error.message}`);
      throw error;
    }
  }

  async triggerRebalancing(fromAccount) {
    try {
      const result = await this.contracts.sharding.methods
        .triggerRebalancing()
        .send({ from: fromAccount, gas: 1000000 });
      
      logger.info('Rebalancing triggered successfully');
      return { transactionHash: result.transactionHash };
      
    } catch (error) {
      logger.error(`Trigger rebalancing failed: ${error.message}`);
      throw error;
    }
  }

  async getShardInfo(shardId) {
    try {
      const shardInfo = await this.contracts.sharding.methods
        .getShardInfo(shardId)
        .call();
      return shardInfo;
    } catch (error) {
      logger.error(`Get shard info failed: ${error.message}`);
      throw error;
    }
  }

  async getOptimalShard(preferredRegion) {
    try {
      const optimalShardId = await this.contracts.sharding.methods
        .getOptimalShard(preferredRegion)
        .call();
      return optimalShardId;
    } catch (error) {
      logger.error(`Get optimal shard failed: ${error.message}`);
      throw error;
    }
  }

  async getShardLoadPercentage(shardId) {
    try {
      const loadPercentage = await this.contracts.sharding.methods
        .getShardLoadPercentage(shardId)
        .call();
      return loadPercentage;
    } catch (error) {
      logger.error(`Get shard load percentage failed: ${error.message}`);
      throw error;
    }
  }

  async getActiveShards() {
    try {
      const activeShards = await this.contracts.sharding.methods
        .getActiveShards()
        .call();
      return activeShards;
    } catch (error) {
      logger.error(`Get active shards failed: ${error.message}`);
      throw error;
    }
  }

  // Event Listening Functions
  subscribeToProductEvents(callback) {
    if (!this.contracts.traceability) {
      throw new Error('Traceability contract not initialized');
    }

    this.contracts.traceability.events.allEvents()
      .on('data', (event) => {
        logger.info(`Blockchain event received: ${event.event}`);
        callback(event);
      })
      .on('error', (error) => {
        logger.error(`Blockchain event error: ${error.message}`);
      });
  }

  subscribeToIoTEvents(callback) {
    if (!this.contracts.iot) {
      throw new Error('IoT contract not initialized');
    }

    this.contracts.iot.events.allEvents()
      .on('data', (event) => {
        logger.info(`IoT event received: ${event.event}`);
        callback(event);
      })
      .on('error', (error) => {
        logger.error(`IoT event error: ${error.message}`);
      });
  }

  subscribeToShardingEvents(callback) {
    if (!this.contracts.sharding) {
      throw new Error('Sharding contract not initialized');
    }

    this.contracts.sharding.events.allEvents()
      .on('data', (event) => {
        logger.info(`Sharding event received: ${event.event}`);
        callback(event);
      })
      .on('error', (error) => {
        logger.error(`Sharding event error: ${error.message}`);
      });
  }

  // Utility Functions
  async getGasPrice() {
    return await this.web3.eth.getGasPrice();
  }

  async getBlockNumber() {
    return await this.web3.eth.getBlockNumber();
  }

  async getTransactionReceipt(txHash) {
    return await this.web3.eth.getTransactionReceipt(txHash);
  }

  isValidAddress(address) {
    return this.web3.utils.isAddress(address);
  }

  toWei(amount, unit = 'ether') {
    return this.web3.utils.toWei(amount.toString(), unit);
  }

  fromWei(amount, unit = 'ether') {
    return this.web3.utils.fromWei(amount.toString(), unit);
  }
}

module.exports = new BlockchainService();