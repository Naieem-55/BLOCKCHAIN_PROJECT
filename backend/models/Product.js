const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['food', 'pharmaceutical', 'electronics', 'textiles', 'automotive', 'chemicals', 'other'],
  },
  batchNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  expiryDate: {
    type: Date,
  },
  currentStage: {
    type: Number,
    enum: [0, 1, 2, 3, 4, 5, 6, 7, 8], // Created, RawMaterial, Manufacturing, QualityControl, Packaging, Distribution, Retail, Sold, Recalled
    default: 0,
  },
  currentOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  currentLocation: {
    type: String,
    required: true,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  parentProductId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  },
  qrCode: {
    type: String, // Base64 encoded QR code or URL
  },
  images: [{
    url: String,
    description: String,
    uploadedAt: { type: Date, default: Date.now },
  }],
  documents: [{
    name: String,
    type: {
      type: String,
      enum: ['certificate', 'test_report', 'compliance', 'invoice', 'shipping', 'other'],
    },
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    uploadedAt: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false },
  }],
  blockchain: {
    productId: Number,
    contractAddress: String,
    transactionHash: String,
  },
  history: [{
    action: {
      type: String,
      enum: ['created', 'transferred', 'stage_updated', 'quality_checked', 'recalled', 'expired'],
    },
    fromOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    toOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    fromLocation: String,
    toLocation: String,
    stage: Number,
    timestamp: { type: Date, default: Date.now },
    transactionHash: String,
    notes: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  }],
  qualityChecks: [{
    checkType: {
      type: String,
      enum: ['visual_inspection', 'weight_check', 'temperature_check', 'chemical_analysis', 'microbiological', 'compliance_check', 'packaging_integrity', 'labeling_check'],
    },
    passed: Boolean,
    notes: String,
    inspector: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    timestamp: { type: Date, default: Date.now },
    parameters: [{
      name: String,
      value: Number,
      unit: String,
      expectedRange: {
        min: Number,
        max: Number,
      },
      passed: Boolean,
    }],
    documents: [String], // URLs to supporting documents
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Indexes
productSchema.index({ batchNumber: 1 });
productSchema.index({ currentOwner: 1 });
productSchema.index({ currentStage: 1 });
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ createdAt: -1 });

// Virtual for stage name
productSchema.virtual('stageName').get(function() {
  const stageNames = [
    'Created',
    'Raw Material',
    'Manufacturing',
    'Quality Control',
    'Packaging',
    'Distribution',
    'Retail',
    'Sold',
    'Recalled'
  ];
  return stageNames[this.currentStage] || 'Unknown';
});

// Method to add history entry
productSchema.methods.addHistoryEntry = function(action, data) {
  this.history.push({
    action,
    ...data,
    timestamp: new Date(),
  });
};

// Method to add quality check
productSchema.methods.addQualityCheck = function(checkData) {
  this.qualityChecks.push({
    ...checkData,
    timestamp: new Date(),
  });
};

// Method to check if product is expired
productSchema.methods.isExpired = function() {
  return this.expiryDate && new Date() > this.expiryDate;
};

// Pre-save middleware
productSchema.pre('save', function(next) {
  // Update stage in history if stage changed
  if (this.isModified('currentStage')) {
    this.addHistoryEntry('stage_updated', {
      stage: this.currentStage,
      performedBy: this.currentOwner,
    });
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);