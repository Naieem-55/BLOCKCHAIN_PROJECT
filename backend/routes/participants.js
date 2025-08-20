const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

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
  body('name').trim().isLength({ min: 2 }),
  body('role').isIn(['supplier', 'manufacturer', 'distributor', 'retailer', 'auditor']),
  body('company').trim().isLength({ min: 2 }),
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

  const participant = new User({
    email,
    password: hashedPassword,
    name,
    role,
    company,
    location,
    phone,
    isActive: true,
    createdBy: req.user.id,
  });

  await participant.save();

  logger.info(`New participant created: ${email} with role: ${role} by ${req.user.email}`);

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
      tempPassword, // Send temp password for initial login
    },
    message: 'Participant created successfully',
  });
}));

module.exports = router;