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
  },
  batchNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  quantity: {
    type: Number,
    default: 0,
  },
  unit: {
    type: String,
    default: 'pcs',
  },
  price: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'recalled'],
    default: 'active',
  },
  stage: {
    type: Number,
    default: 0,
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
  createdByUserKey: {
    type: String,
    required: false, // Made optional for backward compatibility
    index: true,
  },
  currentLocation: {
    type: String,
    required: true,
    trim: true,
  },
  locationHistory: [{
    location: {
      type: String,
      required: true,
    },
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String,
    },
    timestamp: { type: Date, default: Date.now },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    locationType: {
      type: String,
      enum: ['warehouse', 'transport', 'facility', 'retail', 'customer'],
    },
    transportDetails: {
      vehicleId: String,
      driverId: String,
      route: String,
      estimatedArrival: Date,
    },
  }],
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
  blockchainId: {
    type: String,
  },
  transactionHash: {
    type: String,
  },
  shardId: {
    type: String,
  },
  blockchainEnabled: {
    type: Boolean,
    default: false,
  },
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
  manufacturer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // Immutability and Security Fields
  merkleRoot: {
    type: String,
    index: true,
    description: 'SHA-256 hash for tamper detection'
  },
  immutabilityEnabled: {
    type: Boolean,
    default: true,
    description: 'Whether immutability checking is active'
  },
  lastIntegrityCheck: {
    timestamp: { type: Date },
    result: { type: String, enum: ['VERIFIED', 'COMPROMISED', 'ERROR'] },
    checkedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  tamperingAttempts: [{
    detectedAt: { type: Date, default: Date.now },
    changedFields: [String],
    severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
    sourceIP: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }]
}, {
  timestamps: true,
});

// Indexes
// Removed duplicate index on batchNumber since it's already unique
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