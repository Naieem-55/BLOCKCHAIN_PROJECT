const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

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
      .populate('currentOwner', 'name company')
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
  body('name').trim().isLength({ min: 2 }),
  body('description').trim().isLength({ min: 5 }),
  body('category').trim().isLength({ min: 2 }),
  body('batchNumber').trim().isLength({ min: 1 }),
  body('expiryDate').optional().isISO8601(),
  body('initialLocation').optional().trim(),
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const {
    name,
    description,
    category,
    batchNumber,
    expiryDate,
    initialLocation,
  } = req.body;

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
    currentStage: 0, // Created
  });

  await product.save();

  // Populate the response
  await product.populate('currentOwner', 'name company email');
  await product.populate('createdBy', 'name company');

  logger.info(`New product created: ${name} (${batchNumber}) by ${req.user.email}`);

  res.status(201).json({
    success: true,
    data: product,
    message: 'Product created successfully',
  });
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
  ]);

  const stats = {
    totalProducts,
    activeProducts,
    productsByStage: productsByStage.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    productsByCategory: productsByCategory.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    productsCreatedToday: recentProducts,
  };

  res.json({
    success: true,
    data: stats,
  });
}));

module.exports = router;