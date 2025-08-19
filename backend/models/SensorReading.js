const mongoose = require('mongoose');

const sensorReadingSchema = new mongoose.Schema({
  sensorId: {
    type: String,
    required: true,
    trim: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  },
  value: {
    type: Number,
    required: true,
  },
  unit: {
    type: String,
    required: true,
    trim: true,
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
  },
  location: {
    latitude: Number,
    longitude: Number,
    address: String,
  },
  additionalData: {
    type: mongoose.Schema.Types.Mixed, // Flexible data storage
  },
  quality: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor', 'invalid'],
    default: 'good',
  },
  blockchain: {
    transactionHash: String,
    blockNumber: Number,
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Indexes
sensorReadingSchema.index({ sensorId: 1, timestamp: -1 });
sensorReadingSchema.index({ productId: 1, timestamp: -1 });
sensorReadingSchema.index({ timestamp: -1 });
sensorReadingSchema.index({ recordedBy: 1 });

// Method to check if reading is within normal range
sensorReadingSchema.methods.isWithinRange = function(sensor) {
  if (!sensor.thresholds || sensor.thresholds.length === 0) return true;
  
  const relevantThreshold = sensor.thresholds.find(t => 
    t.isActive && t.parameter.toLowerCase().includes(sensor.type)
  );
  
  if (!relevantThreshold) return true;
  
  return this.value >= relevantThreshold.minValue && this.value <= relevantThreshold.maxValue;
};

// Static method to get readings for a time period
sensorReadingSchema.statics.getReadingsForPeriod = function(sensorId, startDate, endDate) {
  return this.find({
    sensorId,
    timestamp: {
      $gte: startDate,
      $lte: endDate,
    },
  }).sort({ timestamp: 1 });
};

// Static method to get latest reading for sensor
sensorReadingSchema.statics.getLatestReading = function(sensorId) {
  return this.findOne({ sensorId }).sort({ timestamp: -1 });
};

module.exports = mongoose.model('SensorReading', sensorReadingSchema);