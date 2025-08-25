const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Product = require('../models/Product');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const blockchainService = require('../services/blockchainService');
const MerkleRootGenerator = require('../utils/merkleRoot');

const router = express.Router();

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 */
/**
 * @swagger
 * /products/search:
 *   post:
 *     summary: Search product by ID or Batch Number
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Product ID or Batch Number
 *     responses:
 *       200:
 *         description: Product found successfully
 *       404:
 *         description: Product not found
 */
router.post('/search', auth, [
  body('identifier').trim().isLength({ min: 1 }).withMessage('Identifier is required'),
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { identifier } = req.body;
  
  let product = null;
  
  // Try to find by ID first (if it's a valid MongoDB ObjectId)
  if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
    product = await Product.findById(identifier)
      .populate('currentOwner', 'name company email')
      .populate('manufacturer', 'name company email')
      .populate('createdBy', 'name company');
  }
  
  // If not found by ID, try to find by batch number
  if (!product) {
    product = await Product.findOne({ batchNumber: identifier })
      .populate('currentOwner', 'name company email')
      .populate('manufacturer', 'name company email')
      .populate('createdBy', 'name company');
  }

  if (!product) {
    throw new AppError('Product not found with the provided identifier', 404);
  }

  res.json({
    success: true,
    data: product,
    searchedBy: product._id.toString() === identifier ? 'id' : 'batchNumber'
  });
}));

router.get('/', auth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const search = req.query.search;

  let query = {};
  
  // Add search functionality
  if (search) {
    query = {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { batchNumber: { $regex: search, $options: 'i' } },
      ],
    };
  }

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('currentOwner', 'name company email')
      .populate('manufacturer', 'name company email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Product.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}));

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *       404:
 *         description: Product not found
 */
router.get('/:id', auth, catchAsync(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('currentOwner', 'name company email')
    .populate('createdBy', 'name company');

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  res.json({
    success: true,
    data: product,
  });
}));

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - category
 *               - batchNumber
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               batchNumber:
 *                 type: string
 *               expiryDate:
 *                 type: string
 *                 format: date
 *               initialLocation:
 *                 type: string
 *     responses:
 *       201:
 *         description: Product created successfully
 */
router.post('/', auth, [
  body('name').trim().isLength({ min: 2 }).withMessage('Product name must be at least 2 characters'),
  body('description').trim().isLength({ min: 3 }).withMessage('Description must be at least 3 characters'),
  body('category').trim().isLength({ min: 2 }).withMessage('Category must be at least 2 characters'),
  body('batchNumber').trim().isLength({ min: 1 }).withMessage('Batch number is required'),
  body('userKey').trim().isLength({ min: 1 }).withMessage('User key is required for product creation'),
  body('expiryDate').optional().isISO8601().withMessage('Invalid expiry date format'),
  body('initialLocation').optional().trim(),
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg).join(', ');
    return res.status(400).json({
      success: false,
      message: errorMessages,
      errors: errors.array(),
    });
  }

  const {
    name,
    description,
    category,
    batchNumber,
    userKey,
    expiryDate,
    initialLocation,
    metadata,
  } = req.body;

  // Validate user key
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.userKey !== userKey) {
    logger.warn(`Invalid user key attempt for product creation by user: ${user.email}`);
    throw new AppError('Invalid user key. Product creation failed.', 403);
  }

  // Check if batch number already exists
  const existingProduct = await Product.findOne({ batchNumber });
  if (existingProduct) {
    throw new AppError('Product with this batch number already exists', 400);
  }

  const product = new Product({
    name,
    description,
    category,
    batchNumber,
    expiryDate,
    currentLocation: initialLocation || 'Unknown',
    currentOwner: req.user.id,
    createdBy: req.user.id,
    createdByUserKey: user.userKey, // Store the user key that created the product
    manufacturer: req.user.id, // Set manufacturer to the creating user
    currentStage: 0, // Created
    quantity: metadata?.quantity || 0,
    unit: metadata?.unit || 'pcs',
    price: metadata?.price || 0,
    status: 'active', // Set default status
    stage: 0, // Set default stage
  });

  await product.save();

  // Generate Merkle root for immutability protection
  try {
    const merkleRoot = MerkleRootGenerator.generateMerkleRoot(product.toObject());
    product.merkleRoot = merkleRoot;
    product.immutabilityEnabled = true;
    await product.save();
    logger.info(`Merkle root generated for product ${product._id}: ${merkleRoot}`);
  } catch (error) {
    logger.error('Failed to generate Merkle root for product', error);
    // Continue without failing the product creation
  }

  // Try to create product on blockchain with adaptive sharding
  let blockchainData = null;
  try {
    if (blockchainService.isInitialized) {
      const accounts = blockchainService.accounts;
      if (accounts && accounts.length > 0) {
        blockchainData = await blockchainService.createProduct({
          name,
          description,
          category,
          batchNumber,
          userKey: user.userKey, // Pass user key for blockchain validation
          expiryDate: expiryDate ? Math.floor(new Date(expiryDate).getTime() / 1000) : 0,
          initialLocation: initialLocation || 'Unknown'
        }, accounts[0]);

        // Update product with blockchain data
        if (blockchainData.productId) {
          product.blockchainId = blockchainData.productId;
          product.transactionHash = blockchainData.transactionHash;
          product.shardId = blockchainData.shardId;
          product.blockchainEnabled = blockchainData.blockchainEnabled;
          await product.save();
        }
      }
    }
  } catch (blockchainError) {
    logger.warn(`Blockchain integration failed: ${blockchainError.message}`);
    // Continue without blockchain - product still created in database
  }

  // Populate the response
  await product.populate('currentOwner', 'name company email');
  await product.populate('createdBy', 'name company');
  await product.populate('manufacturer', 'name company email');

  logger.info(`New product created: ${name} (${batchNumber}) by ${req.user.email}`);

  const responseData = {
    success: true,
    data: product,
    message: 'Product created successfully',
  };

  // Add blockchain info if available
  if (blockchainData) {
    responseData.blockchain = {
      enabled: blockchainData.blockchainEnabled,
      productId: blockchainData.productId,
      transactionHash: blockchainData.transactionHash,
      shardId: blockchainData.shardId,
      error: blockchainData.error
    };
  }

  res.status(201).json(responseData);
}));

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               expiryDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       404:
 *         description: Product not found
 */
router.put('/:id', auth, [
  body('name').optional().trim().isLength({ min: 2 }),
  body('description').optional().trim().isLength({ min: 5 }),
  body('category').optional().trim().isLength({ min: 2 }),
  body('expiryDate').optional().isISO8601(),
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const product = await Product.findById(req.params.id);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Check if user has permission to update this product
  if (product.currentOwner.toString() !== req.user.id && req.user.role !== 'admin') {
    throw new AppError('You do not have permission to update this product', 403);
  }

  const { name, description, category, expiryDate } = req.body;

  if (name) product.name = name;
  if (description) product.description = description;
  if (category) product.category = category;
  if (expiryDate) product.expiryDate = expiryDate;

  product.updatedAt = new Date();
  await product.save();

  await product.populate('currentOwner', 'name company email');

  logger.info(`Product updated: ${product.name} (${product.batchNumber}) by ${req.user.email}`);

  res.json({
    success: true,
    data: product,
    message: 'Product updated successfully',
  });
}));

/**
 * @swagger
 * /products/{id}/transfer:
 *   post:
 *     summary: Transfer product ownership
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newOwner
 *               - newLocation
 *             properties:
 *               newOwner:
 *                 type: string
 *               newLocation:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product transferred successfully
 */
router.post('/:id/transfer', auth, [
  body('newOwner').isMongoId(),
  body('newLocation').trim().isLength({ min: 1 }),
  body('notes').optional().trim(),
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const product = await Product.findById(req.params.id);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Check if user has permission to transfer this product
  if (product.currentOwner.toString() !== req.user.id && req.user.role !== 'admin') {
    throw new AppError('You do not have permission to transfer this product', 403);
  }

  const { newOwner, newLocation, notes } = req.body;

  // Verify new owner exists
  const newOwnerUser = await User.findById(newOwner);
  if (!newOwnerUser) {
    throw new AppError('New owner not found', 400);
  }

  const previousOwner = product.currentOwner;
  const previousLocation = product.currentLocation;

  // Update product
  product.currentOwner = newOwner;
  product.currentLocation = newLocation;
  product.updatedAt = new Date();

  // Add to history
  if (!product.history) {
    product.history = [];
  }
  
  product.history.push({
    action: 'transferred',
    fromOwner: previousOwner,
    toOwner: newOwner,
    fromLocation: previousLocation,
    toLocation: newLocation,
    timestamp: new Date(),
    performedBy: req.user.id,
    notes,
  });

  await product.save();

  await product.populate('currentOwner', 'name company email');

  logger.info(`Product transferred: ${product.name} from ${req.user.email} to ${newOwnerUser.email}`);

  res.json({
    success: true,
    data: product,
    message: 'Product transferred successfully',
  });
}));

/**
 * @swagger
 * /products/stats:
 *   get:
 *     summary: Get product statistics
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Product statistics retrieved successfully
 */
router.get('/stats', auth, catchAsync(async (req, res) => {
  const [
    totalProducts,
    activeProducts,
    productsByStage,
    productsByCategory,
    recentProducts,
    blockchainEnabledProducts,
  ] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ isActive: true }),
    Product.aggregate([
      { $group: { _id: '$currentStage', count: { $sum: 1 } } },
    ]),
    Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]),
    Product.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    }),
    Product.countDocuments({ blockchainEnabled: true }),
  ]);

  // Get blockchain system stats
  let blockchainStats = null;
  let systemEfficiency = 0;
  try {
    if (blockchainService.isInitialized) {
      blockchainStats = await blockchainService.getSystemStats();
      systemEfficiency = await blockchainService.getSystemEfficiencyScore();
    }
  } catch (error) {
    logger.warn(`Could not get blockchain stats: ${error.message}`);
  }

  const stats = {
    totalProducts,
    activeProducts,
    blockchainEnabledProducts,
    productsByStage: productsByStage.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    productsByCategory: productsByCategory.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    productsCreatedToday: recentProducts,
    blockchain: {
      enabled: blockchainService.isInitialized,
      systemStats: blockchainStats,
      systemEfficiency,
      integrationPercentage: totalProducts > 0 ? Math.round((blockchainEnabledProducts / totalProducts) * 100) : 0
    }
  };

  res.json({
    success: true,
    data: stats,
  });
}));

/**
 * @swagger
 * /products/{id}/trace:
 *   get:
 *     summary: Get complete product traceability data
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product traceability data retrieved successfully
 */
router.get('/:id/trace', auth, catchAsync(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('currentOwner', 'name company email')
    .populate('createdBy', 'name company');

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  let blockchainHistory = null;
  let blockchainVerification = null;
  
  // Get blockchain data if available
  try {
    if (blockchainService.isInitialized && product.blockchainId) {
      [blockchainHistory, blockchainVerification] = await Promise.all([
        blockchainService.getProductHistory(product.blockchainId),
        blockchainService.isProductAuthentic(product.blockchainId)
      ]);
    }
  } catch (error) {
    logger.warn(`Could not get blockchain trace data: ${error.message}`);
  }

  const traceData = {
    product,
    databaseHistory: product.history || [],
    blockchain: {
      enabled: !!product.blockchainId,
      productId: product.blockchainId,
      transactionHash: product.transactionHash,
      shardId: product.shardId,
      history: blockchainHistory,
      isAuthentic: blockchainVerification
    }
  };

  res.json({
    success: true,
    data: traceData,
  });
}));

/**
 * @swagger
 * /products/blockchain/efficiency:
 *   get:
 *     summary: Get blockchain system efficiency metrics
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Blockchain efficiency metrics retrieved successfully
 */
router.get('/blockchain/efficiency', auth, catchAsync(async (req, res) => {
  if (!blockchainService.isInitialized) {
    return res.json({
      success: true,
      data: {
        enabled: false,
        message: 'Blockchain service not initialized'
      }
    });
  }

  const [systemStats, systemEfficiency] = await Promise.all([
    blockchainService.getSystemStats(),
    blockchainService.getSystemEfficiencyScore()
  ]);

  const recommendedShard = await blockchainService.getRecommendedShard('product', 300000, 5);

  res.json({
    success: true,
    data: {
      enabled: true,
      systemStats,
      systemEfficiency,
      recommendedShard,
      timestamp: new Date().toISOString()
    }
  });
}));

/**
 * @swagger
 * /products/qr/{qrCode}:
 *   get:
 *     summary: Get product by QR code
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: qrCode
 *         required: true
 *         schema:
 *           type: string
 *         description: The QR code of the product
 *     responses:
 *       200:
 *         description: Product found successfully
 *       404:
 *         description: Product not found
 */
router.get('/qr/:qrCode', catchAsync(async (req, res) => {
  const { qrCode } = req.params;
  
  if (!qrCode) {
    throw new AppError('QR code is required', 400);
  }

  // Find product by QR code
  let product = await Product.findOne({ 
    qrCode: decodeURIComponent(qrCode),
    isActive: true 
  })
    .populate('currentOwner', 'name email company location')
    .populate('createdBy', 'name email company')
    .populate('history.performedBy', 'name email role')
    .populate('qualityChecks.inspector', 'name email');

  if (!product) {
    // If not found by qrCode field, try to find by name or ID (for backward compatibility)
    product = await Product.findOne({
      $or: [
        { name: { $regex: qrCode, $options: 'i' } },
        { batchNumber: qrCode },
        { _id: qrCode.match(/^[0-9a-fA-F]{24}$/) ? qrCode : null }
      ],
      isActive: true
    })
      .populate('currentOwner', 'name email company location')
      .populate('createdBy', 'name email company')
      .populate('history.performedBy', 'name email role')
      .populate('qualityChecks.inspector', 'name email');
    
    if (!product) {
      throw new AppError('Product not found for the provided QR code', 404);
    }
  }

  // Calculate quality score based on recent quality checks
  let qualityScore = 100;
  if (product.qualityChecks && product.qualityChecks.length > 0) {
    const recentChecks = product.qualityChecks.slice(-3); // Last 3 checks
    const passedChecks = recentChecks.filter(check => check.passed).length;
    qualityScore = Math.round((passedChecks / recentChecks.length) * 100);
  }

  // Get stage name
  const stageNames = {
    0: 'Created',
    1: 'Raw Material',
    2: 'Manufacturing',
    3: 'Quality Control',
    4: 'Packaging',
    5: 'Distribution',
    6: 'Retail',
    7: 'Sold',
    8: 'Recalled'
  };

  // Build comprehensive response
  const productData = {
    id: product._id,
    name: product.name,
    description: product.description,
    category: product.category,
    batchNumber: product.batchNumber,
    qrCode: product.qrCode || qrCode,
    currentStage: product.currentStage,
    stageName: stageNames[product.currentStage] || 'Unknown',
    status: product.status,
    qualityScore: qualityScore,
    currentOwner: product.currentOwner?.name || 'Unknown',
    currentLocation: product.currentLocation,
    expiryDate: product.expiryDate,
    createdAt: product.createdAt,
    createdBy: product.createdBy,
    lastUpdated: product.updatedAt,
    
    // Traceability events from history
    traceabilityEvents: product.history.map((event, index) => ({
      id: index + 1,
      timestamp: event.timestamp,
      stage: stageNames[event.stage] || 'Unknown',
      location: event.toLocation || event.fromLocation || 'Unknown',
      participant: event.performedBy?.name || event.performedBy?.email || 'Unknown',
      action: event.action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      notes: event.notes,
      transactionHash: event.transactionHash
    })),
    
    // Quality checks
    qualityChecks: product.qualityChecks.map((check, index) => ({
      id: index + 1,
      checkType: check.checkType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      passed: check.passed,
      score: check.passed ? (qualityScore + Math.random() * 10) : (qualityScore - Math.random() * 20),
      notes: check.notes,
      timestamp: check.timestamp,
      inspector: check.inspector?.name || 'Unknown'
    })),
    
    // Certifications (mock for now, could be added to Product model)
    certifications: [
      { name: 'Quality Verified', verified: qualityScore > 85 },
      { name: 'Supply Chain Tracked', verified: true },
      { name: 'Blockchain Verified', verified: !!product.blockchain?.productId }
    ],
    
    // Blockchain info
    blockchain: {
      enabled: !!product.blockchain?.productId,
      productId: product.blockchain?.productId,
      contractAddress: product.blockchain?.contractAddress,
      transactionHash: product.blockchain?.transactionHash || product.transactionHash
    }
  };

  logger.info(`QR Code lookup successful for: ${qrCode} -> ${product.name}`);

  res.json({
    success: true,
    data: productData,
    message: 'Product found successfully'
  });
}));

module.exports = router;