const express = require('express');
const { body, param, validationResult } = require('express-validator');
const asyncHandler = require('../middleware/asyncHandler');
const { auth } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const blockchainService = require('../services/blockchainService');
const logger = require('../utils/logger');

const router = express.Router();

// Rate limiting for sharding operations
const shardingRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: 'Too many sharding requests from this IP, please try again later.',
});

// Apply rate limiting to all routes
router.use(shardingRateLimit);

/**
 * @swagger
 * /api/sharding/create:
 *   post:
 *     summary: Create a new shard
 *     tags: [Sharding]
 */
router.post('/create',
  auth,
  [
    body('shardManager').isEthereumAddress().withMessage('Invalid Ethereum address'),
    body('minCapacity').isInt({ min: 1 }).withMessage('Minimum capacity must be at least 1'),
    body('maxCapacity').isInt({ min: 10 }).withMessage('Maximum capacity must be at least 10'),
    body('region').isString().trim().isLength({ min: 2, max: 50 }).withMessage('Region must be 2-50 characters'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { shardManager, minCapacity, maxCapacity, region } = req.body;
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can create shards',
      });
    }

    if (maxCapacity <= minCapacity) {
      return res.status(400).json({
        success: false,
        message: 'Maximum capacity must be greater than minimum capacity',
      });
    }

    try {
      if (!blockchainService.isInitialized) {
        return res.status(503).json({
          success: false,
          message: 'Blockchain service not available',
        });
      }

      const result = await blockchainService.createShard({
        shardManager,
        minCapacity,
        maxCapacity,
        region
      }, blockchainService.accounts[0]);

      logger.info(`Shard created by admin ${req.user.email}: ${result.shardId}`);

      res.status(201).json({
        success: true,
        data: {
          shardId: result.shardId,
          transactionHash: result.transactionHash,
          shardManager,
          minCapacity,
          maxCapacity,
          region
        },
        message: 'Shard created successfully',
      });

    } catch (error) {
      logger.error(`Create shard error for admin ${req.user.email}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Failed to create shard',
        error: error.message,
      });
    }
  })
);

/**
 * @swagger
 * /api/sharding/active:
 *   get:
 *     summary: Get all active shards
 *     tags: [Sharding]
 */
router.get('/active',
  auth,
  asyncHandler(async (req, res) => {
    try {
      if (!blockchainService.isInitialized) {
        return res.status(503).json({
          success: false,
          message: 'Blockchain service not available',
        });
      }

      const activeShards = await blockchainService.getActiveShards();

      res.json({
        success: true,
        data: {
          activeShards,
          count: activeShards.length,
        },
        message: 'Active shards retrieved successfully',
      });

    } catch (error) {
      logger.error(`Get active shards error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve active shards',
        error: error.message,
      });
    }
  })
);

/**
 * @swagger
 * /api/sharding/optimal:
 *   get:
 *     summary: Get optimal shard for a region
 *     tags: [Sharding]
 */
router.get('/optimal',
  auth,
  asyncHandler(async (req, res) => {
    const { region } = req.query;

    if (!region) {
      return res.status(400).json({
        success: false,
        message: 'Region parameter is required',
      });
    }

    try {
      if (!blockchainService.isInitialized) {
        return res.status(503).json({
          success: false,
          message: 'Blockchain service not available',
        });
      }

      const optimalShardId = await blockchainService.getOptimalShard(region);

      if (optimalShardId === '0') {
        return res.status(404).json({
          success: false,
          message: 'No optimal shard available for the specified region',
        });
      }

      const shardInfo = await blockchainService.getShardInfo(optimalShardId);
      const loadPercentage = await blockchainService.getShardLoadPercentage(optimalShardId);

      res.json({
        success: true,
        data: {
          optimalShardId,
          region: shardInfo.region,
          currentLoad: shardInfo.currentLoad,
          maxCapacity: shardInfo.maxCapacity,
          loadPercentage,
        },
        message: 'Optimal shard found successfully',
      });

    } catch (error) {
      logger.error(`Get optimal shard error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Failed to find optimal shard',
        error: error.message,
      });
    }
  })
);

/**
 * @swagger
 * /api/sharding/{shardId}:
 *   get:
 *     summary: Get shard information
 *     tags: [Sharding]
 */
router.get('/:shardId',
  auth,
  [
    param('shardId').isInt({ min: 1 }).withMessage('Shard ID must be a positive integer'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { shardId } = req.params;

    try {
      if (!blockchainService.isInitialized) {
        return res.status(503).json({
          success: false,
          message: 'Blockchain service not available',
        });
      }

      const shardInfo = await blockchainService.getShardInfo(shardId);
      const loadPercentage = await blockchainService.getShardLoadPercentage(shardId);

      res.json({
        success: true,
        data: {
          shardId,
          shardManager: shardInfo.shardManager,
          status: shardInfo.status,
          currentLoad: shardInfo.currentLoad,
          minCapacity: shardInfo.minCapacity,
          maxCapacity: shardInfo.maxCapacity,
          region: shardInfo.region,
          assignedProducts: shardInfo.assignedProducts,
          loadPercentage,
        },
        message: 'Shard information retrieved successfully',
      });

    } catch (error) {
      logger.error(`Get shard info error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve shard information',
        error: error.message,
      });
    }
  })
);

module.exports = router;