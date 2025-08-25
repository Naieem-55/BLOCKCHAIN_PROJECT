const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
require('dotenv').config({ path: '../.env' });

// Define User Schema inline to avoid dependency issues
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
    select: false,
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
  userKey: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Generate unique user key
const generateUserKey = (role) => {
  const timestamp = Date.now().toString(36);
  const randomStr = crypto.randomBytes(8).toString('hex');
  return `USR_${role.toUpperCase().slice(0, 3)}_${timestamp}_${randomStr}`.toUpperCase();
};

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/supply_chain_traceability');
    console.log('Connected to MongoDB');

    // Admin credentials
    const adminEmail = 'admin@supplychain.com';
    const adminPassword = 'Admin@123456';
    const adminName = 'System Administrator';

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('\n================================');
      console.log('Admin user already exists!');
      console.log('================================');
      console.log('Email:', adminEmail);
      console.log('User Key:', existingAdmin.userKey);
      console.log('Role:', existingAdmin.role);
      console.log('Name:', existingAdmin.name);
      console.log('\nTo login, use:');
      console.log('Email:', adminEmail);
      console.log('Password: [Use the password you set when creating this account]');
      console.log('================================\n');
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Create admin user
    const adminUser = new User({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      company: 'Supply Chain Management System',
      location: 'Global',
      userKey: generateUserKey('admin'),
      isActive: true
    });

    await adminUser.save();
    
    console.log('\n================================');
    console.log('ADMIN USER CREATED SUCCESSFULLY!');
    console.log('================================');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('User Key:', adminUser.userKey);
    console.log('Role:', adminUser.role);
    console.log('Name:', adminName);
    console.log('\n⚠️  IMPORTANT: Save these credentials securely!');
    console.log('⚠️  The User Key is required for creating products.');
    console.log('================================\n');

    // Also create a test supplier user
    const supplierEmail = 'supplier@supplychain.com';
    const supplierPassword = 'Supplier@123456';
    
    const existingSupplier = await User.findOne({ email: supplierEmail });
    if (!existingSupplier) {
      const supplierUser = new User({
        name: 'Test Supplier',
        email: supplierEmail,
        password: await bcrypt.hash(supplierPassword, 12),
        role: 'supplier',
        company: 'Test Supplier Company',
        location: 'New York',
        userKey: generateUserKey('supplier'),
        isActive: true
      });
      
      await supplierUser.save();
      
      console.log('\n================================');
      console.log('TEST SUPPLIER USER ALSO CREATED!');
      console.log('================================');
      console.log('Email:', supplierEmail);
      console.log('Password:', supplierPassword);
      console.log('User Key:', supplierUser.userKey);
      console.log('Role:', supplierUser.role);
      console.log('================================\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();