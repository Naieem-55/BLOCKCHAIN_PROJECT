const Product = require('../models/Product');
const blockchainService = require('./blockchainService');
const logger = require('../utils/logger');

class ProductService {
  
  /**
   * Create a new product with blockchain integration
   */
  async createProduct(productData, userId) {
    try {
      // Create product in database first
      const product = new Product({
        ...productData,
        createdBy: userId,
        status: 'created',
        blockchainId: null,
        transactionHash: null,
      });

      await product.save();

      // If blockchain is available, create on blockchain
      if (blockchainService.isInitialized) {
        try {
          // Assign to optimal shard first
          const shardAssignment = await blockchainService.assignProductToShard(
            product._id.toString(),
            productData.region || 'DEFAULT',
            blockchainService.accounts[0]
          );

          // Create on blockchain
          const blockchainResult = await blockchainService.createProduct({
            name: product.name,
            description: product.description,
            category: product.category,
            batchNumber: product.batchNumber,
            expiryDate: Math.floor(product.expiryDate.getTime() / 1000), // Convert to timestamp
            initialLocation: product.currentLocation,
          }, blockchainService.accounts[0]);

          // Update product with blockchain data
          product.blockchainId = blockchainResult.productId;
          product.transactionHash = blockchainResult.transactionHash;
          product.shardId = shardAssignment.shardId;
          product.status = 'blockchain_created';
          
          await product.save();

          logger.info(`Product created on blockchain: ${product._id} -> ${blockchainResult.productId}`);
        } catch (blockchainError) {
          logger.warn(`Blockchain creation failed for product ${product._id}: ${blockchainError.message}`);
          product.status = 'blockchain_failed';
          await product.save();
        }
      }

      return product;
    } catch (error) {
      logger.error(`Product creation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Transfer product ownership
   */
  async transferProduct(productId, transferData, userId) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      const { newOwner, newLocation, newStage } = transferData;

      // Update database
      const oldOwner = product.currentOwner;
      product.currentOwner = newOwner;
      product.currentLocation = newLocation;
      product.currentStage = newStage;
      product.updatedBy = userId;
      
      // Add to transfer history
      product.transferHistory.push({
        fromOwner: oldOwner,
        toOwner: newOwner,
        location: newLocation,
        stage: newStage,
        transferredBy: userId,
        timestamp: new Date(),
      });

      await product.save();

      // Update on blockchain if available
      if (blockchainService.isInitialized && product.blockchainId) {
        try {
          const blockchainResult = await blockchainService.transferProduct(
            product.blockchainId,
            newOwner,
            newLocation,
            blockchainService.accounts[0]
          );

          product.lastTransactionHash = blockchainResult.transactionHash;
          await product.save();

          logger.info(`Product transferred on blockchain: ${product._id}`);
        } catch (blockchainError) {
          logger.warn(`Blockchain transfer failed for product ${product._id}: ${blockchainError.message}`);
        }
      }

      return product;
    } catch (error) {
      logger.error(`Product transfer failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Add quality check to product
   */
  async addQualityCheck(productId, qualityData, userId) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      // Add quality check to database
      const qualityCheck = {
        checkType: qualityData.checkType,
        passed: qualityData.passed,
        notes: qualityData.notes,
        inspector: userId,
        timestamp: new Date(),
      };

      product.qualityChecks.push(qualityCheck);
      await product.save();

      // Add to blockchain if available
      if (blockchainService.isInitialized && product.blockchainId) {
        try {
          const blockchainResult = await blockchainService.addQualityCheck(
            product.blockchainId,
            qualityData,
            blockchainService.accounts[0]
          );

          qualityCheck.transactionHash = blockchainResult.transactionHash;
          await product.save();

          logger.info(`Quality check added on blockchain: ${product._id}`);
        } catch (blockchainError) {
          logger.warn(`Blockchain quality check failed for product ${product._id}: ${blockchainError.message}`);
        }
      }

      return product;
    } catch (error) {
      logger.error(`Quality check addition failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get comprehensive product traceability
   */
  async getProductTraceability(productId) {
    try {
      const product = await Product.findById(productId)
        .populate('createdBy', 'name email')
        .populate('currentOwner', 'name email')
        .populate('transferHistory.fromOwner', 'name email')
        .populate('transferHistory.toOwner', 'name email')
        .populate('qualityChecks.inspector', 'name email');

      if (!product) {
        throw new Error('Product not found');
      }

      let blockchainData = null;
      let sensorData = null;
      let alerts = null;

      // Get blockchain data if available
      if (blockchainService.isInitialized && product.blockchainId) {
        try {
          const [history, temperatureHistory, productAlerts] = await Promise.all([
            blockchainService.getProductHistory(product.blockchainId),
            blockchainService.getProductSensorData(product.blockchainId),
            blockchainService.getProductAlerts(product.blockchainId),
          ]);

          blockchainData = {
            history,
            isAuthentic: await blockchainService.isProductAuthentic(product.blockchainId),
          };
          sensorData = temperatureHistory;
          alerts = productAlerts;

          logger.info(`Blockchain traceability retrieved for product: ${product._id}`);
        } catch (blockchainError) {
          logger.warn(`Blockchain traceability failed for product ${product._id}: ${blockchainError.message}`);
        }
      }

      return {
        product,
        blockchain: blockchainData,
        sensors: sensorData,
        alerts,
        traceabilityScore: this.calculateTraceabilityScore(product, blockchainData, sensorData),
      };
    } catch (error) {
      logger.error(`Product traceability retrieval failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Batch process products for efficiency
   */
  async batchTransferProducts(productIds, batchData, userId) {
    try {
      const { newOwner, newLocation, newStage } = batchData;
      
      // Update all products in database
      const products = await Product.find({ _id: { $in: productIds } });
      if (products.length !== productIds.length) {
        throw new Error('Some products not found');
      }

      const updates = products.map(async (product) => {
        const oldOwner = product.currentOwner;
        product.currentOwner = newOwner;
        product.currentLocation = newLocation;
        product.currentStage = newStage;
        product.updatedBy = userId;
        
        product.transferHistory.push({
          fromOwner: oldOwner,
          toOwner: newOwner,
          location: newLocation,
          stage: newStage,
          transferredBy: userId,
          timestamp: new Date(),
        });

        return product.save();
      });

      await Promise.all(updates);

      // Batch update on blockchain if available
      if (blockchainService.isInitialized) {
        try {
          const blockchainIds = products
            .filter(p => p.blockchainId)
            .map(p => p.blockchainId);

          if (blockchainIds.length > 0) {
            const batchOperation = {
              productIds: blockchainIds,
              newOwner,
              newLocation,
              newStage: this.getStageNumber(newStage),
            };

            const blockchainResult = await blockchainService.batchTransferProducts(
              batchOperation,
              blockchainService.accounts[0]
            );

            logger.info(`Batch transfer completed on blockchain: ${blockchainIds.length} products`);
          }
        } catch (blockchainError) {
          logger.warn(`Blockchain batch transfer failed: ${blockchainError.message}`);
        }
      }

      return products;
    } catch (error) {
      logger.error(`Batch transfer failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get products by batch number
   */
  async getProductsByBatch(batchNumber) {
    try {
      const products = await Product.find({ batchNumber });
      
      // Also get from blockchain if available
      let blockchainProducts = null;
      if (blockchainService.isInitialized) {
        try {
          blockchainProducts = await blockchainService.getBatchProducts(batchNumber);
          logger.info(`Batch products retrieved from blockchain: ${batchNumber}`);
        } catch (blockchainError) {
          logger.warn(`Blockchain batch retrieval failed: ${blockchainError.message}`);
        }
      }

      return {
        database: products,
        blockchain: blockchainProducts,
      };
    } catch (error) {
      logger.error(`Batch products retrieval failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verify product authenticity using blockchain
   */
  async verifyProductAuthenticity(productId) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      let blockchainVerification = null;
      if (blockchainService.isInitialized && product.blockchainId) {
        try {
          const isAuthentic = await blockchainService.isProductAuthentic(product.blockchainId);
          const productData = await blockchainService.getProduct(product.blockchainId);
          
          blockchainVerification = {
            isAuthentic,
            blockchainData: productData,
            verified: true,
          };
        } catch (blockchainError) {
          blockchainVerification = {
            isAuthentic: false,
            error: blockchainError.message,
            verified: false,
          };
        }
      }

      // Calculate overall authenticity score
      const authenticityScore = this.calculateAuthenticityScore(product, blockchainVerification);

      return {
        product,
        blockchain: blockchainVerification,
        authenticityScore,
        recommendation: authenticityScore > 80 ? 'AUTHENTIC' : 
                       authenticityScore > 50 ? 'SUSPICIOUS' : 'NOT_AUTHENTIC',
      };
    } catch (error) {
      logger.error(`Product authenticity verification failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate traceability score based on available data
   */
  calculateTraceabilityScore(product, blockchainData, sensorData) {
    let score = 0;
    const maxScore = 100;

    // Database completeness (30 points)
    if (product.name) score += 5;
    if (product.description) score += 5;
    if (product.category) score += 5;
    if (product.batchNumber) score += 5;
    if (product.currentLocation) score += 5;
    if (product.qualityChecks.length > 0) score += 5;

    // Blockchain integration (40 points)
    if (blockchainData) {
      score += 20;
      if (blockchainData.isAuthentic) score += 10;
      if (blockchainData.history && blockchainData.history.owners.length > 0) score += 10;
    }

    // Sensor data integration (20 points)
    if (sensorData && sensorData.length > 0) {
      score += 10;
      if (sensorData.length > 5) score += 10; // Rich sensor data
    }

    // Transfer history (10 points)
    if (product.transferHistory.length > 0) {
      score += 5;
      if (product.transferHistory.length > 2) score += 5; // Multiple transfers
    }

    return Math.min(score, maxScore);
  }

  /**
   * Calculate authenticity score
   */
  calculateAuthenticityScore(product, blockchainVerification) {
    let score = 0;

    // Database integrity (30 points)
    if (product.createdAt && product.updatedAt) score += 10;
    if (product.transactionHash) score += 10;
    if (product.qualityChecks.length > 0) score += 10;

    // Blockchain verification (70 points)
    if (blockchainVerification && blockchainVerification.verified) {
      if (blockchainVerification.isAuthentic) score += 50;
      if (blockchainVerification.blockchainData) score += 20;
    }

    return Math.min(score, 100);
  }

  /**
   * Convert stage name to number for blockchain
   */
  getStageNumber(stageName) {
    const stages = {
      'created': 0,
      'raw_material': 1,
      'manufacturing': 2,
      'quality_control': 3,
      'packaging': 4,
      'distribution': 5,
      'retail': 6,
      'sold': 7,
      'recalled': 8,
    };
    return stages[stageName] || 0;
  }

  /**
   * Get products with analytics
   */
  async getProductsWithAnalytics(filters = {}) {
    try {
      const query = {};
      
      if (filters.category) query.category = filters.category;
      if (filters.status) query.status = filters.status;
      if (filters.currentStage) query.currentStage = filters.currentStage;
      if (filters.batchNumber) query.batchNumber = filters.batchNumber;
      
      const products = await Product.find(query)
        .populate('createdBy', 'name email')
        .populate('currentOwner', 'name email')
        .sort({ createdAt: -1 })
        .limit(filters.limit || 100);

      // Calculate analytics
      const analytics = {
        total: products.length,
        byStage: {},
        byCategory: {},
        withBlockchain: 0,
        averageTraceabilityScore: 0,
      };

      let totalTraceabilityScore = 0;

      products.forEach(product => {
        // Count by stage
        analytics.byStage[product.currentStage] = (analytics.byStage[product.currentStage] || 0) + 1;
        
        // Count by category
        analytics.byCategory[product.category] = (analytics.byCategory[product.category] || 0) + 1;
        
        // Count blockchain integrated products
        if (product.blockchainId) analytics.withBlockchain++;
        
        // Calculate traceability score (simplified)
        const score = this.calculateTraceabilityScore(product, null, null);
        totalTraceabilityScore += score;
      });

      analytics.averageTraceabilityScore = products.length > 0 ? 
        Math.round(totalTraceabilityScore / products.length) : 0;

      return {
        products,
        analytics,
      };
    } catch (error) {
      logger.error(`Products analytics retrieval failed: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new ProductService();