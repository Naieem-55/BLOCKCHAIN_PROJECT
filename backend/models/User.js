const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    select: false, // Don't include password in queries by default
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'supplier', 'manufacturer', 'distributor', 'retailer', 'auditor', 'consumer'],
    default: 'consumer',
  },
  company: {
    type: String,
    trim: true,
  },
  location: {
    type: String,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  walletAddress: {
    type: String,
    trim: true,
    lowercase: true,
  },
  avatar: {
    type: String, // URL to avatar image
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationDate: {
    type: Date,
  },
  lastLogin: {
    type: Date,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  permissions: [{
    resource: String,
    actions: [String],
  }],
  profileComplete: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ walletAddress: 1 });
userSchema.index({ isActive: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return this.name;
});

// Method to check if profile is complete
userSchema.methods.isProfileComplete = function() {
  return this.name && this.company && this.location && this.phone;
};

// Method to get user permissions
userSchema.methods.getPermissions = function() {
  const rolePermissions = {
    admin: [
      { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'products', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'sensors', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'analytics', actions: ['read'] },
    ],
    supplier: [
      { resource: 'products', actions: ['create', 'read', 'update'] },
      { resource: 'sensors', actions: ['create', 'read', 'update'] },
    ],
    manufacturer: [
      { resource: 'products', actions: ['create', 'read', 'update'] },
      { resource: 'sensors', actions: ['create', 'read', 'update'] },
    ],
    distributor: [
      { resource: 'products', actions: ['read', 'update'] },
      { resource: 'sensors', actions: ['read'] },
    ],
    retailer: [
      { resource: 'products', actions: ['read', 'update'] },
      { resource: 'sensors', actions: ['read'] },
    ],
    auditor: [
      { resource: 'products', actions: ['read'] },
      { resource: 'sensors', actions: ['read'] },
      { resource: 'analytics', actions: ['read'] },
    ],
    consumer: [
      { resource: 'products', actions: ['read'] },
    ],
  };

  return rolePermissions[this.role] || [];
};

// Pre-save middleware to update profileComplete
userSchema.pre('save', function(next) {
  this.profileComplete = this.isProfileComplete();
  next();
});

module.exports = mongoose.model('User', userSchema);