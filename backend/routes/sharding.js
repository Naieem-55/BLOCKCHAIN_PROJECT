const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const shardingService = require('../services/shardingService');

const router = express.Router();

// Get sharding system statistics
router.get('/stats', auth, catchAsync(async (req, res) => {
  const stats = await shardingService.getSystemStats();
  
  res.json({
    success: true,
    data: stats,
    message: 'Sharding statistics retrieved successfully'
  });
}));

// Get all shards
router.get('/shards', auth, catchAsync(async (req, res) => {
  const { type } = req.query;
  
  if (type) {
    const shards = await shardingService.getShardsByType(type);
    res.json({
      success: true,
      data: shards,
      shardType: type,
      count: shards.length
    });
  } else {
    // Get all shards
    const productShards = await shardingService.getShardsByType('product');
    const iotShards = await shardingService.getShardsByType('iot');
    const participantShards = await shardingService.getShardsByType('participant');
    
    res.json({
      success: true,
      data: {
        product: productShards,
        iot: iotShards,
        participant: participantShards
      },
      totalShards: productShards.length + iotShards.length + participantShards.length
    });
  }
}));

// Create new shard
router.post('/shards', auth, [
  body('shardType').isIn(['product', 'iot', 'participant']).withMessage('Invalid shard type'),
  body('contractAddress').isEthereumAddress().withMessage('Invalid contract address'),
  body('capacity').isInt({ min: 1000, max: 50000 }).withMessage('Capacity must be between 1000 and 50000')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  // Only admins can create shards
  if (req.user.role !== 'admin') {
    throw new AppError('Only administrators can create shards', 403);
  }

  const { shardType, contractAddress, capacity } = req.body;
  
  const fromAccount = req.user.walletAddress;
  if (!fromAccount) {
    throw new AppError('Wallet address not found. Please connect your wallet.', 400);
  }

  const result = await shardingService.createShard(shardType, contractAddress, capacity, fromAccount);
  
  res.status(201).json({
    success: true,
    data: result,
    message: 'Shard created successfully'
  });
}));

// Get optimal shard recommendation
router.post('/optimal-shard', auth, [
  body('shardType').isIn(['product', 'iot', 'participant']).withMessage('Invalid shard type'),
], catchAsync(async (req, res) => {
  const { shardType, estimatedGas = 200000, priority = 1 } = req.body;
  
  const recommendation = await shardingService.getOptimalShard(shardType, estimatedGas, priority);
  
  res.json({
    success: true,
    data: recommendation,
    message: 'Optimal shard recommendation retrieved'
  });
}));

// Trigger load rebalancing
router.post('/rebalance', auth, [
  body('shardType').isIn(['product', 'iot', 'participant']).withMessage('Invalid shard type')
], catchAsync(async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new AppError('Only administrators can trigger rebalancing', 403);
  }

  const { shardType } = req.body;
  const fromAccount = req.user.walletAddress;
  
  if (!fromAccount) {
    throw new AppError('Wallet address not found', 400);
  }

  const result = await shardingService.rebalanceShards(shardType, fromAccount);
  
  res.json({
    success: true,
    data: result,
    message: 'Rebalancing completed successfully'
  });
}));

// Get efficiency report
router.get('/efficiency-report', auth, catchAsync(async (req, res) => {
  const report = await shardingService.getEfficiencyReport();
  
  res.json({
    success: true,
    data: report,
    message: 'Efficiency report generated successfully'
  });
}));

// Get performance metrics
router.get('/performance', auth, catchAsync(async (req, res) => {
  const processorPerformance = await shardingService.getProcessorPerformance();
  const cachedMetrics = shardingService.getCachedMetrics();
  
  res.json({
    success: true,
    data: {
      processor: processorPerformance,
      cached: cachedMetrics,
      realTime: true
    },
    message: 'Performance metrics retrieved successfully'
  });
}));

// Calculate gas savings
router.post('/gas-savings', auth, [
  body('operationType').isIn(['transfer', 'quality_check', 'stage_update']).withMessage('Invalid operation type'),
  body('itemCount').isInt({ min: 1 }).withMessage('Item count must be at least 1')
], catchAsync(async (req, res) => {
  const { operationType, itemCount } = req.body;
  
  const individualGasCost = 50000 * itemCount;
  const batchGasCost = 100000 + (15000 * itemCount);
  const gasSavings = individualGasCost > batchGasCost ? individualGasCost - batchGasCost : 0;
  
  const savingsPercentage = individualGasCost > 0 ? ((gasSavings / individualGasCost) * 100).toFixed(2) : 0;
  
  res.json({
    success: true,
    data: {
      operationType,
      itemCount,
      individualGasCost,
      batchGasCost,
      gasSavings,
      savingsPercentage: `${savingsPercentage}%`,
      recommendation: gasSavings > 0 ? 'Use batch processing' : 'Individual operations recommended'
    },
    message: 'Gas savings calculated successfully'
  });
}));

module.exports = router;