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
 * components:
 *   schemas:
 *     Shard:
 *       type: object
 *       properties:
 *         shardId:
 *           type: integer
 *           description: Unique identifier for the shard
 *         shardManager:
 *           type: string
 *           description: Address of the shard manager
 *         status:
 *           type: integer
 *           description: Current status of the shard (0=Inactive, 1=Active, 2=Rebalancing, 3=Maintenance)
 *         currentLoad:
 *           type: integer
 *           description: Current number of products/transactions in the shard
 *         minCapacity:
 *           type: integer
 *           description: Minimum capacity of the shard
 *         maxCapacity:
 *           type: integer
 *           description: Maximum capacity of the shard
 *         region:
 *           type: string
 *           description: Geographic region of the shard
 *         assignedProducts:
 *           type: array
 *           items:
 *             type: integer
 *           description: Array of product IDs assigned to this shard
 */

/**
 * @swagger
 * /api/sharding/create:
 *   post:
 *     summary: Create a new shard
 *     tags: [Sharding]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shardManager
 *               - minCapacity
 *               - maxCapacity
 *               - region
 *             properties:
 *               shardManager:
 *                 type: string
 *                 description: Ethereum address of the shard manager
 *               minCapacity:
 *                 type: integer
 *                 minimum: 1
 *                 description: Minimum capacity of the shard
 *               maxCapacity:
 *                 type: integer
 *                 minimum: 10
 *                 description: Maximum capacity of the shard
 *               region:
 *                 type: string
 *                 description: Geographic region (e.g., "US-EAST", "EU-WEST", "ASIA-PACIFIC")
 *     responses:
 *       201:
 *         description: Shard created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
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
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { shardManager, minCapacity, maxCapacity, region } = req.body;
    
    // Verify user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can create shards',
      });
    }

    // Validate capacity range
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

      // Create shard on blockchain
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
 * /api/sharding/activate/{shardId}:
 *   post:
 *     summary: Activate a shard
 *     tags: [Sharding]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shardId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID of the shard to activate
 *     responses:
 *       200:
 *         description: Shard activated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Shard not found
 */
router.post('/activate/:shardId',
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
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can activate shards',
      });
    }

    try {
      if (!blockchainService.isInitialized) {
        return res.status(503).json({
          success: false,
          message: 'Blockchain service not available',
        });
      }

      const result = await blockchainService.activateShard(shardId, blockchainService.accounts[0]);

      logger.info(`Shard ${shardId} activated by admin ${req.user.email}`);

      res.json({
        success: true,
        data: {
          shardId,
          transactionHash: result.transactionHash,
        },
        message: 'Shard activated successfully',
      });

    } catch (error) {
      logger.error(`Activate shard error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Failed to activate shard',
        error: error.message,
      });
    }
  })
);

/**
 * @swagger
 * /api/sharding/assign-product:
 *   post:
 *     summary: Assign a product to optimal shard
 *     tags: [Sharding]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - preferredRegion
 *             properties:
 *               productId:
 *                 type: integer
 *                 minimum: 1
 *                 description: ID of the product to assign
 *               preferredRegion:
 *                 type: string
 *                 description: Preferred geographic region
 *     responses:
 *       200:
 *         description: Product assigned to shard successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/assign-product',
  auth,
  [
    body('productId').isInt({ min: 1 }).withMessage('Product ID must be a positive integer'),
    body('preferredRegion').isString().trim().isLength({ min: 2, max: 50 }).withMessage('Preferred region must be 2-50 characters'),
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

    const { productId, preferredRegion } = req.body;

    try {
      if (!blockchainService.isInitialized) {
        return res.status(503).json({
          success: false,
          message: 'Blockchain service not available',
        });
      }

      const result = await blockchainService.assignProductToShard(
        productId, 
        preferredRegion, 
        blockchainService.accounts[0]
      );

      logger.info(`Product ${productId} assigned to shard ${result.shardId} by ${req.user.email}`);

      res.json({
        success: true,
        data: {
          productId,
          assignedShardId: result.shardId,
          preferredRegion,
          transactionHash: result.transactionHash,
        },
        message: 'Product assigned to shard successfully',
      });

    } catch (error) {
      logger.error(`Assign product to shard error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Failed to assign product to shard',
        error: error.message,
      });
    }
  })
);

/**
 * @swagger
 * /api/sharding/rebalance:
 *   post:
 *     summary: Trigger manual rebalancing of shards
 *     tags: [Sharding]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rebalancing triggered successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post('/rebalance',
  auth,
  asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can trigger rebalancing',
      });
    }

    try {
      if (!blockchainService.isInitialized) {
        return res.status(503).json({
          success: false,
          message: 'Blockchain service not available',
        });
      }

      const result = await blockchainService.triggerRebalancing(blockchainService.accounts[0]);

      logger.info(`Rebalancing triggered by admin ${req.user.email}`);

      res.json({
        success: true,
        data: {
          transactionHash: result.transactionHash,
        },
        message: 'Rebalancing triggered successfully',
      });

    } catch (error) {
      logger.error(`Trigger rebalancing error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Failed to trigger rebalancing',
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
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active shards retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: integer
 *                   description: Array of active shard IDs
 *       401:
 *         description: Unauthorized
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
 * /api/sharding/{shardId}:
 *   get:
 *     summary: Get shard information
 *     tags: [Sharding]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shardId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID of the shard
 *     responses:
 *       200:
 *         description: Shard information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Shard'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Shard not found
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

/**
 * @swagger
 * /api/sharding/active:
 *   get:
 *     summary: Get all active shards
 *     tags: [Sharding]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active shards retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: integer
 *                   description: Array of active shard IDs
 *       401:
 *         description: Unauthorized
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
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: region
 *         required: true
 *         schema:
 *           type: string
 *         description: Preferred geographic region
 *     responses:
 *       200:
 *         description: Optimal shard found
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No optimal shard available
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

module.exports = router;