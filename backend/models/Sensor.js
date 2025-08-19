const mongoose = require('mongoose');

const sensorSchema = new mongoose.Schema({
  sensorId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['temperature', 'humidity', 'pressure', 'location', 'shock', 'light', 'ph', 'oxygen', 'co2', 'motion', 'custom'],
  },
  description: {
    type: String,
    trim: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastReading: {
    type: Date,
  },
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100,
  },
  firmware: {
    type: String,
    default: '1.0.0',
  },
  calibrationData: {
    lastCalibrated: Date,
    calibratedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    calibrationCertificate: String,
    nextCalibrationDue: Date,
    calibrationMethod: String,
    accuracy: Number,
    precision: Number,
  },
  thresholds: [{
    parameter: String,
    minValue: Number,
    maxValue: Number,
    unit: String,
    alertLevel: {
      type: String,
      enum: ['info', 'warning', 'critical', 'emergency'],
      default: 'warning',
    },
    isActive: { type: Boolean, default: true },
    description: String,
  }],
  blockchain: {
    contractAddress: String,
    registrationHash: String,
  },
  specifications: {
    range: {
      min: Number,
      max: Number,
      unit: String,
    },
    accuracy: Number,
    resolution: Number,
    operatingTemperature: {
      min: Number,
      max: Number,
    },
    powerRequirement: String,
    communicationProtocol: [String],
    ipRating: String,
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      weight: Number,
    },
  },
}, {
  timestamps: true,
});

// Indexes
sensorSchema.index({ sensorId: 1 });
sensorSchema.index({ owner: 1 });
sensorSchema.index({ type: 1 });
sensorSchema.index({ isActive: 1 });
sensorSchema.index({ location: 1 });

// Virtual for status
sensorSchema.virtual('status').get(function() {
  if (!this.isActive) return 'offline';
  if (!this.lastReading) return 'new';
  
  const timeSinceLastReading = Date.now() - this.lastReading.getTime();
  const fiveMinutes = 5 * 60 * 1000;
  
  if (timeSinceLastReading > fiveMinutes) return 'warning';
  return 'online';
});

// Method to check if calibration is due
sensorSchema.methods.isCalibrationDue = function() {
  if (!this.calibrationData?.nextCalibrationDue) return false;
  return new Date() >= this.calibrationData.nextCalibrationDue;
};

// Method to check if battery is low
sensorSchema.methods.isBatteryLow = function() {
  return this.batteryLevel !== undefined && this.batteryLevel < 20;
};

module.exports = mongoose.model('Sensor', sensorSchema);