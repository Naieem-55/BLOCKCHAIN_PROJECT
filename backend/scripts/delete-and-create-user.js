const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

// Import the actual User model
const User = require('../models/User');

async function recreateTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/supply_chain_traceability');
    console.log('Connected to MongoDB');

    // Delete existing test user
    await User.deleteOne({ email: 'test@example.com' });
    console.log('Deleted existing test user if any');

    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create test user with proper schema
    const testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
      role: 'admin',
      company: 'Test Company',
      location: 'Test Location',
      phone: '+1234567890',
      isActive: true,
      isVerified: true,
      verificationDate: new Date()
    });

    await testUser.save();
    console.log('Test user created successfully:');
    console.log('Email: test@example.com');
    console.log('Password: password123');
    console.log('Role: admin');

    process.exit(0);
  } catch (error) {
    console.error('Error creating test user:', error);
    process.exit(1);
  }
}

recreateTestUser();