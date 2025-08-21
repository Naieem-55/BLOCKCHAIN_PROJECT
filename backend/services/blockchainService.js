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

  // issue here
  async loadContracts() {
    try {
      const contractsPath = path.join(__dirname, '../../contracts');
      
      // Load SupplyChainTraceability contract
      const traceabilityArtifact = JSON.parse(
        fs.readFileSync(path.join(contractsPath, 'SupplyChainTraceability.json'), 'utf8')
      );
      
      // Load IoTIntegration contract
      const iotArtifact = JSON.parse(
        fs.readFileSync(path.join(contractsPath, 'IoTIntegration.json'), 'utf8')
      );
      
      // Get network ID
      const networkId = await this.web3.eth.net.getId();
      
      // Initialize contracts
      this.contracts.traceability = new this.web3.eth.Contract(
        traceabilityArtifact.abi,
        traceabilityArtifact.networks[networkId]?.address
      );
      
      this.contracts.iot = new this.web3.eth.Contract(
        iotArtifact.abi,
        iotArtifact.networks[networkId]?.address
      );
      
      logger.info('Smart contracts loaded successfully');
      
    } catch (error) {
      logger.error(`Contract loading failed: ${error.message}`);
      throw error;
    }
  }

  // Product Management Functions
  async createProduct(productData, fromAccount) {
    try {
      const { name, description, category, batchNumber, expiryDate, initialLocation } = productData;
      
      const result = await this.contracts.traceability.methods
        .createProduct(name, description, category, batchNumber, expiryDate, initialLocation)
        .send({ from: fromAccount, gas: 500000 });
      
      const productId = result.events.ProductCreated.returnValues.productId;
      
      logger.info(`Product created on blockchain with ID: ${productId}`);
      return { productId, transactionHash: result.transactionHash };
      
    } catch (error) {
      logger.error(`Create product failed: ${error.message}`);
      throw error;
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