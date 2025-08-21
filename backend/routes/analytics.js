const express = require('express');
const Product = require('../models/Product');
const User = require('../models/User');
const Sensor = require('../models/Sensor');
const SensorReading = require('../models/SensorReading');
const { auth } = require('../middleware/auth');
const { catchAsync } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @swagger
 * /analytics/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 */
router.get('/dashboard', auth, catchAsync(async (req, res) => {
  const [
    totalProducts,
    activeProducts,
    totalParticipants,
    activeSensors,
    recentTransactions,
    alertsToday,
  ] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ isActive: true }),
    User.countDocuments(),
    Sensor.countDocuments({ isActive: true }),
    Product.countDocuments({
      updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    }),
    // Placeholder for alerts - would come from Alert model
    Promise.resolve(Math.floor(Math.random() * 10)),
  ]);

  const stats = {
    totalProducts,
    activeProducts,
    totalParticipants,
    activeSensors,
    recentTransactions,
    qualityScore: 85 + Math.random() * 10, // Placeholder calculation
    networkHealth: 80 + Math.random() * 15, // Placeholder calculation
    alertsToday,
  };

  res.json({
    success: true,
    data: stats,
  });
}));

/**
 * @swagger
 * /analytics/products:
 *   get:
 *     summary: Get product analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Product analytics retrieved successfully
 */
router.get('/products', auth, catchAsync(async (req, res) => {
  const [
    productsByStage,
    productsByCategory,
    productsByLocation,
  ] = await Promise.all([
    Product.aggregate([
      { $group: { _id: '$currentStage', count: { $sum: 1 } } },
    ]),
    Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]),
    Product.aggregate([
      { $group: { _id: '$currentLocation', count: { $sum: 1 } } },
    ]),
  ]);

  const analytics = {
    productsByStage: productsByStage.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    productsByCategory: productsByCategory.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    productsByLocation: productsByLocation.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
  };

  res.json({
    success: true,
    data: analytics,
  });
}));

module.exports = router;