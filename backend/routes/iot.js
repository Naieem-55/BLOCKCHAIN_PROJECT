const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Sensor = require('../models/Sensor');
const SensorReading = require('../models/SensorReading');
const { auth } = require('../middleware/auth');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /iot/sensors:
 *   get:
 *     summary: Get all sensors
 *     tags: [IoT]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sensors retrieved successfully
 */
router.get('/sensors', auth, catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [sensors, total] = await Promise.all([
    Sensor.find()
      .populate('owner', 'name company')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Sensor.countDocuments(),
  ]);

  res.json({
    success: true,
    data: sensors,
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
 * /iot/sensors:
 *   post:
 *     summary: Register a new sensor
 *     tags: [IoT]
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
 *               - type
 *               - location
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               location:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Sensor registered successfully
 */
router.post('/sensors', auth, [
  body('name').trim().isLength({ min: 2 }),
  body('type').isIn(['temperature', 'humidity', 'pressure', 'location', 'shock', 'light', 'custom']),
  body('location').trim().isLength({ min: 2 }),
  body('description').optional().trim(),
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { name, type, location, description } = req.body;

  const sensor = new Sensor({
    name,
    type,
    location,
    description,
    owner: req.user.id,
    sensorId: `sensor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    isActive: true,
  });

  await sensor.save();
  await sensor.populate('owner', 'name company email');

  logger.info(`New sensor registered: ${name} (${type}) by ${req.user.email}`);

  res.status(201).json({
    success: true,
    data: sensor,
    message: 'Sensor registered successfully',
  });
}));

/**
 * @swagger
 * /iot/readings:
 *   post:
 *     summary: Record sensor data
 *     tags: [IoT]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sensorId
 *               - value
 *               - unit
 *             properties:
 *               sensorId:
 *                 type: string
 *               value:
 *                 type: number
 *               unit:
 *                 type: string
 *               productId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Sensor data recorded successfully
 */
router.post('/readings', auth, [
  body('sensorId').trim().isLength({ min: 1 }),
  body('value').isNumeric(),
  body('unit').trim().isLength({ min: 1 }),
  body('productId').optional().isMongoId(),
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { sensorId, value, unit, productId } = req.body;

  // Verify sensor exists
  const sensor = await Sensor.findOne({ sensorId });
  if (!sensor) {
    throw new AppError('Sensor not found', 404);
  }

  const reading = new SensorReading({
    sensorId,
    value,
    unit,
    productId,
    timestamp: new Date(),
    recordedBy: req.user.id,
  });

  await reading.save();

  // Update sensor's last reading time
  sensor.lastReading = new Date();
  await sensor.save();

  logger.info(`Sensor data recorded: ${sensorId} = ${value} ${unit}`);

  res.status(201).json({
    success: true,
    data: reading,
    message: 'Sensor data recorded successfully',
  });
}));

/**
 * @swagger
 * /iot/readings:
 *   get:
 *     summary: Get sensor readings
 *     tags: [IoT]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sensorId
 *         schema:
 *           type: string
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sensor readings retrieved successfully
 */
router.get('/readings', auth, catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;
  const { sensorId, productId } = req.query;

  let query = {};
  if (sensorId) query.sensorId = sensorId;
  if (productId) query.productId = productId;

  const [readings, total] = await Promise.all([
    SensorReading.find(query)
      .populate('recordedBy', 'name company')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit),
    SensorReading.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: readings,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}));

module.exports = router;