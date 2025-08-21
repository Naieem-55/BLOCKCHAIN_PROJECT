const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const blockchainService = require('./blockchainService');

class ShardingService {
  constructor() {
    this.web3 = null;
    this.shardingContract = null;
    this.processorContract = null;
    this.performanceMetrics = new Map();
    this.isInitialized = false;
    this.monitoringInterval = null;
  }

  async initialize() {
    try {
      this.web3 = blockchainService.web3;
      
      if (!this.web3) {
        throw new Error('Web3 not initialized');
      }

      await this.loadContracts();
      this.startPerformanceMonitoring();
      
      this.isInitialized = true;
      logger.info('Sharding service initialized successfully');
      
    } catch (error) {
      logger.error(`Sharding service initialization failed: ${error.message}`);
      throw error;
    }
  }

  async loadContracts() {
    try {
      const contractsPath = path.join(__dirname, '../../build/contracts');
      
      // Load AdaptiveSharding contract
      const shardingArtifact = JSON.parse(
        fs.readFileSync(path.join(contractsPath, 'AdaptiveSharding.json'), 'utf8')
      );
      
      // Load HighEfficiencyProcessor contract
      const processorArtifact = JSON.parse(
        fs.readFileSync(path.join(contractsPath, 'HighEfficiencyProcessor.json'), 'utf8')
      );
      
      const networkId = await this.web3.eth.net.getId();
      
      // Initialize contracts
      this.shardingContract = new this.web3.eth.Contract(
        shardingArtifact.abi,
        shardingArtifact.networks[networkId]?.address
      );
      
      this.processorContract = new this.web3.eth.Contract(
        processorArtifact.abi,
        processorArtifact.networks[networkId]?.address
      );
      
      logger.info('Sharding contracts loaded successfully');
      
    } catch (error) {
      logger.error(`Sharding contract loading failed: ${error.message}`);
      throw error;
    }
  }

  async getOptimalShard(shardType, estimatedGas = 200000, priority = 1) {
    try {
      if (!this.shardingContract) {
        throw new Error('Sharding contract not initialized');
      }

      const result = await this.shardingContract.methods
        .getRecommendedShard(shardType, estimatedGas, priority)
        .call();

      return {
        shardId: result[0],
        reason: result[1],
        estimatedGas,
        shardType
      };
    } catch (error) {
      logger.error(`Failed to get optimal shard: ${error.message}`);
      throw error;
    }
  }

  async getSystemStats() {
    try {
      if (!this.shardingContract) {
        throw new Error('Sharding contract not initialized');
      }

      const stats = await this.shardingContract.methods
        .getSystemStats()
        .call();

      const efficiencyScore = await this.shardingContract.methods
        .getSystemEfficiencyScore()
        .call();

      return {
        totalShards: parseInt(stats.totalShards),
        activeShards: parseInt(stats.activeShards),
        totalTransactions: parseInt(stats.totalTransactions),
        avgSystemLoad: parseInt(stats.avgSystemLoad),
        systemEfficiency: parseInt(stats.systemEfficiency),
        efficiencyScore: parseInt(efficiencyScore)
      };
    } catch (error) {
      logger.error(`Failed to get system stats: ${error.message}`);
      throw error;
    }
  }

  async getShardsByType(shardType) {
    try {
      if (!this.shardingContract) {
        throw new Error('Sharding contract not initialized');
      }

      const shardIds = await this.shardingContract.methods
        .getShardsByType(shardType)
        .call();

      const shardDetails = [];
      for (const shardId of shardIds) {
        const info = await this.getShardInfo(shardId);
        shardDetails.push(info);
      }

      return shardDetails;
    } catch (error) {
      logger.error(`Failed to get shards by type: ${error.message}`);
      throw error;
    }
  }

  async getShardInfo(shardId) {
    try {
      const shardInfo = await this.shardingContract.methods
        .getShardInfo(shardId)
        .call();

      const metrics = await this.shardingContract.methods
        .getShardMetrics(shardId)
        .call();

      return {
        shardId,
        contractAddress: shardInfo.shardContract,
        currentLoad: parseInt(shardInfo.currentLoad),
        maxCapacity: parseInt(shardInfo.maxCapacity),
        transactionCount: parseInt(shardInfo.transactionCount),
        isActive: shardInfo.isActive,
        shardType: shardInfo.shardType,
        performance: {
          avgTransactionTime: parseInt(metrics.avgTransactionTime),
          throughput: parseInt(metrics.throughput),
          errorRate: parseInt(metrics.errorRate),
        }
      };
    } catch (error) {
      logger.error(`Failed to get shard info: ${error.message}`);
      throw error;
    }
  }

  async getProcessorPerformance() {
    try {
      if (!this.processorContract) {
        throw new Error('Processor contract not initialized');
      }

      const stats = await this.processorContract.methods
        .getPerformanceStats()
        .call();

      return {
        totalBatches: parseInt(stats.totalBatches),
        totalOperations: parseInt(stats.totalOperations),
        avgGasSaved: parseInt(stats.avgGasSaved),
        avgProcessingTime: parseInt(stats.avgProcessingTime),
        successRate: parseInt(stats.successRate),
        compressionRatio: parseInt(stats.compressionRatio),
        efficiencyScore: parseInt(stats.efficiencyScore)
      };
    } catch (error) {
      logger.error(`Failed to get processor performance: ${error.message}`);
      throw error;
    }
  }

  async getEfficiencyRecommendations() {
    try {
      const systemStats = await this.getSystemStats();
      const recommendations = [];

      if (systemStats.avgSystemLoad > 80) {
        recommendations.push({
          type: 'scaling',
          priority: 'high',
          title: 'High System Load Detected',
          description: 'Consider creating additional shards to distribute load',
          action: 'create_shard',
          impact: 'Reduce transaction times by 20-30%'
        });
      }

      if (systemStats.efficiencyScore < 70) {
        recommendations.push({
          type: 'optimization',
          priority: 'medium',
          title: 'Low Efficiency Score',
          description: 'Enable advanced optimization features',
          action: 'increase_optimization_level',
          impact: 'Improve gas efficiency by 15-25%'
        });
      }

      return recommendations;
    } catch (error) {
      logger.error(`Failed to get efficiency recommendations: ${error.message}`);
      throw error;
    }
  }

  startPerformanceMonitoring() {
    this.monitoringInterval = setInterval(async () => {
      try {
        const systemStats = await this.getSystemStats();
        this.performanceMetrics.set('system', {
          ...systemStats,
          timestamp: new Date()
        });
      } catch (error) {
        logger.error(`Performance monitoring error: ${error.message}`);
      }
    }, 60000);

    logger.info('Performance monitoring started');
  }

  getCachedMetrics() {
    return {
      system: this.performanceMetrics.get('system'),
      lastUpdated: new Date()
    };
  }
}

module.exports = new ShardingService();