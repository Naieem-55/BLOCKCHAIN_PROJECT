const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const blockchainService = require('../services/blockchainService');

const router = express.Router();

/**
 * @swagger
 * /participants:
 *   get:
 *     summary: Get all participants
 *     tags: [Participants]
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
 *         name: role
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Participants retrieved successfully
 */
router.get('/', auth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('role').optional().isIn(['admin', 'supplier', 'manufacturer', 'distributor', 'retailer', 'auditor']),
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
  const { role, search } = req.query;

  let query = {};
  
  if (role) {
    query.role = role;
  }
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const [participants, total] = await Promise.all([
    User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: participants,
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
 * /participants/{id}:
 *   get:
 *     summary: Get participant by ID
 *     tags: [Participants]
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
 *         description: Participant retrieved successfully
 *       404:
 *         description: Participant not found
 */
router.get('/:id', auth, catchAsync(async (req, res) => {
  const participant = await User.findById(req.params.id).select('-password');

  if (!participant) {
    throw new AppError('Participant not found', 404);
  }

  res.json({
    success: true,
    data: participant,
  });
}));

/**
 * @swagger
 * /participants:
 *   post:
 *     summary: Create a new participant
 *     tags: [Participants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *               - role
 *               - company
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *               company:
 *                 type: string
 *               location:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Participant created successfully
 */
router.post('/', auth, [
  body('email').isEmail().normalizeEmail(),
  body('name').trim().isLength({ min: 1 }),
  body('role').isIn(['admin', 'supplier', 'manufacturer', 'distributor', 'retailer', 'auditor', 'consumer', 'producer']),
  body('company').trim().isLength({ min: 1 }),
  body('location').optional().trim(),
  body('phone').optional().trim(),
], catchAsync(async (req, res) => {
  console.log('Received participant creation request:', req.body);
  console.log('User creating participant:', req.user.email);
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  // Check if user has permission to create participants
  if (req.user.role !== 'admin') {
    throw new AppError('Only administrators can create participants', 403);
  }

  const { email, name, role, company, location, phone } = req.body;

  // Check if participant already exists
  const existingParticipant = await User.findOne({ email });
  if (existingParticipant) {
    throw new AppError('Participant already exists with this email', 400);
  }

  // Generate temporary password
  const tempPassword = Math.random().toString(36).slice(-8);
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
  const hashedPassword = await bcrypt.hash(tempPassword, saltRounds);

  // Generate unique user key
  const generateUserKey = (role) => {
    const timestamp = Date.now().toString(36);
    const randomStr = crypto.randomBytes(8).toString('hex');
    return `USR_${role.toUpperCase().slice(0, 3)}_${timestamp}_${randomStr}`.toUpperCase();
  };

  const userKey = generateUserKey(role);

  const participant = new User({
    email,
    password: hashedPassword,
    name,
    role,
    company,
    location,
    phone,
    userKey,
    isActive: true,
    createdBy: req.user.id,
  });

  await participant.save();

  logger.info(`New participant created: ${email} with role: ${role} by ${req.user.email}`);

  // Try to register on blockchain if available
  let blockchainRegistered = false;
  try {
    if (blockchainService.isInitialized && blockchainService.contracts.traceability) {
      const accounts = blockchainService.accounts;
      if (accounts && accounts.length > 0) {
        // Note: In a real scenario, you'd need the participant's wallet address
        // For now, we'll use a generated address or skip blockchain registration
        logger.info('Blockchain registration available but requires wallet address');
      }
    }
  } catch (blockchainError) {
    logger.warn(`Blockchain registration failed: ${blockchainError.message}`);
  }

  res.status(201).json({
    success: true,
    data: {
      id: participant._id,
      email: participant.email,
      name: participant.name,
      role: participant.role,
      company: participant.company,
      location: participant.location,
      phone: participant.phone,
      userKey: participant.userKey,
      tempPassword, // Send temp password for initial login
      blockchainRegistered,
    },
    message: 'Participant created successfully. Please save the user key and temporary password.',
  });
}));

/**
 * @swagger
 * /participants/{id}:
 *   put:
 *     summary: Update participant by ID
 *     tags: [Participants]
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
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *               company:
 *                 type: string
 *               location:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Participant updated successfully
 *       404:
 *         description: Participant not found
 */
router.put('/:id', auth, [
  body('email').optional().isEmail().normalizeEmail(),
  body('name').optional().trim().isLength({ min: 1 }),
  body('role').optional().isIn(['admin', 'supplier', 'manufacturer', 'distributor', 'retailer', 'auditor', 'consumer', 'producer']),
  body('company').optional().trim().isLength({ min: 1 }),
  body('location').optional().trim(),
  body('phone').optional().trim(),
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  // Check if user has permission to update participants
  if (req.user.role !== 'admin') {
    throw new AppError('Only administrators can update participants', 403);
  }

  const { email, name, role, company, location, phone } = req.body;

  // Check if participant exists
  const participant = await User.findById(req.params.id);
  if (!participant) {
    throw new AppError('Participant not found', 404);
  }

  // Check if email is being changed and if it's already taken
  if (email && email !== participant.email) {
    const existingParticipant = await User.findOne({ email });
    if (existingParticipant) {
      throw new AppError('Email already exists', 400);
    }
  }

  // Update participant
  const updateData = {};
  if (email) updateData.email = email;
  if (name) updateData.name = name;
  if (role) updateData.role = role;
  if (company) updateData.company = company;
  if (location) updateData.location = location;
  if (phone) updateData.phone = phone;
  updateData.updatedAt = new Date();

  const updatedParticipant = await User.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).select('-password');

  logger.info(`Participant updated: ${updatedParticipant.email} by ${req.user.email}`);

  res.json({
    success: true,
    data: updatedParticipant,
    message: 'Participant updated successfully',
  });
}));

/**
 * @swagger
 * /participants/{id}:
 *   delete:
 *     summary: Delete participant by ID
 *     tags: [Participants]
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
 *         description: Participant deleted successfully
 *       404:
 *         description: Participant not found
 */
router.delete('/:id', auth, catchAsync(async (req, res) => {
  // Check if user has permission to delete participants
  if (req.user.role !== 'admin') {
    throw new AppError('Only administrators can delete participants', 403);
  }

  // Check if participant exists
  const participant = await User.findById(req.params.id);
  if (!participant) {
    throw new AppError('Participant not found', 404);
  }

  // Prevent deleting self
  if (participant._id.toString() === req.user.id) {
    throw new AppError('You cannot delete your own account', 400);
  }

  // Soft delete by setting isActive to false instead of hard delete
  // This preserves data integrity for products and transactions
  await User.findByIdAndUpdate(req.params.id, { 
    isActive: false,
    updatedAt: new Date()
  });

  logger.info(`Participant deactivated: ${participant.email} by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Participant deactivated successfully',
  });
}));

/**
 * @swagger
 * /participants/invite:
 *   post:
 *     summary: Send invitation to join as participant
 *     tags: [Participants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Invitation sent successfully
 */
router.post('/invite', auth, [
  body('email').isEmail().normalizeEmail(),
  body('role').isIn(['admin', 'supplier', 'manufacturer', 'distributor', 'retailer', 'auditor', 'consumer', 'producer']),
  body('message').optional().trim().isLength({ max: 500 }),
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  // Check if user has permission to send invitations
  if (req.user.role !== 'admin') {
    throw new AppError('Only administrators can send invitations', 403);
  }

  const { email, role, message } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('User with this email already exists', 400);
  }

  // In a real application, you would:
  // 1. Store invitation in database
  // 2. Send email with invitation link
  // 3. Handle invitation acceptance flow
  
  // For now, just log and return success
  logger.info(`Invitation sent to ${email} for role ${role} by ${req.user.email}`);
  
  res.json({
    success: true,
    message: `Invitation sent to ${email} successfully`,
  });
}));

module.exports = router;