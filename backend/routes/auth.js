const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

// Validation rules
const validateRegistration = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('role').isIn(['admin', 'supplier', 'manufacturer', 'distributor', 'retailer', 'auditor', 'consumer']).withMessage('Valid role is required'),
];

const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback-secret-key', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Register endpoint
router.post('/register', validateRegistration, catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { email, password, name, role, company, location, termsAccepted } = req.body;

  // Check terms acceptance
  if (termsAccepted !== true) {
    throw new AppError('You must accept the terms and conditions', 400);
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new AppError('User already exists with this email', 400);
  }

  // Hash password
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create user
  const user = new User({
    email: email.toLowerCase(),
    password: hashedPassword,
    name,
    role,
    company,
    location,
    isActive: true,
    profileComplete: !!(name && company && location),
  });

  await user.save();

  // Generate token
  const token = generateToken(user._id);

  logger.info(`New user registered: ${email} with role: ${role}`);

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        company: user.company,
        location: user.location,
        permissions: user.getPermissions(),
      },
      token,
      refreshToken: token,
      expiresIn: 7 * 24 * 60 * 60,
    },
    message: 'User registered successfully',
  });
}));

// Login endpoint
router.post('/login', validateLogin, catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { email, password, rememberMe } = req.body;

  // Find user
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AppError('Account is deactivated', 401);
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate token
  const token = generateToken(user._id);

  logger.info(`User logged in: ${email}`);

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        company: user.company,
        location: user.location,
        walletAddress: user.walletAddress,
        permissions: user.getPermissions(),
      },
      token,
      refreshToken: token,
      expiresIn: rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60,
    },
    message: 'Login successful',
  });
}));

// Get profile
router.get('/profile', auth, catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  res.json({
    success: true,
    data: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      company: user.company,
      location: user.location,
      walletAddress: user.walletAddress,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      permissions: user.getPermissions(),
    },
  });
}));

// Update profile
router.put('/profile', auth, catchAsync(async (req, res) => {
  const { name, company, location, walletAddress } = req.body;
  
  const user = await User.findById(req.user.id);
  
  if (name) user.name = name;
  if (company) user.company = company;
  if (location) user.location = location;
  if (walletAddress !== undefined) user.walletAddress = walletAddress;
  
  await user.save();

  res.json({
    success: true,
    data: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      company: user.company,
      location: user.location,
      walletAddress: user.walletAddress,
    },
    message: 'Profile updated successfully',
  });
}));

// Change password
router.post('/change-password', auth, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { currentPassword, newPassword } = req.body;
  
  const user = await User.findById(req.user.id).select('+password');
  
  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    throw new AppError('Current password is incorrect', 400);
  }
  
  // Hash new password
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
  user.password = await bcrypt.hash(newPassword, saltRounds);
  
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
}));

// Logout
router.post('/logout', auth, catchAsync(async (req, res) => {
  logger.info(`User logged out: ${req.user.email}`);
  
  res.json({
    success: true,
    message: 'Logout successful',
  });
}));

module.exports = router;