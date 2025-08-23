/**
 * Seed script to create test users and initial data
 * Run: node seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Product = require('./models/Product');
const logger = require('./utils/logger');

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/supply_chain_traceability', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    logger.info('Connected to MongoDB for seeding');

    // Check if admin user exists
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    
    if (!existingAdmin) {
      // Create admin user
      const hashedPassword = await bcrypt.hash('Admin123!', 10);
      
      const adminUser = new User({
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        company: 'Supply Chain Corp',
        location: 'New York, USA',
        phone: '+1-234-567-8900',
        isActive: true,
        isVerified: true,
        walletAddress: '0x' + '0'.repeat(40), // Placeholder wallet address
      });

      await adminUser.save();
      logger.info('Admin user created successfully');
      console.log('\n=================================');
      console.log('Admin User Created:');
      console.log('Email: admin@example.com');
      console.log('Password: Admin123!');
      console.log('=================================\n');
    } else {
      logger.info('Admin user already exists');
    }

    // Check if test users exist
    const testUsers = [
      {
        name: 'John Manufacturer',
        email: 'manufacturer@example.com',
        password: 'Test123!',
        role: 'manufacturer',
        company: 'Manufacturing Inc',
        location: 'Detroit, USA',
      },
      {
        name: 'Jane Supplier',
        email: 'supplier@example.com',
        password: 'Test123!',
        role: 'supplier',
        company: 'Supply Co',
        location: 'Chicago, USA',
      },
      {
        name: 'Bob Distributor',
        email: 'distributor@example.com',
        password: 'Test123!',
        role: 'distributor',
        company: 'Distribution Ltd',
        location: 'Los Angeles, USA',
      },
      {
        name: 'Alice Retailer',
        email: 'retailer@example.com',
        password: 'Test123!',
        role: 'retailer',
        company: 'Retail Store',
        location: 'Miami, USA',
      },
    ];

    for (const userData of testUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        const user = new User({
          ...userData,
          password: hashedPassword,
          phone: '+1-' + Math.floor(Math.random() * 9000000000 + 1000000000),
          isActive: true,
          isVerified: true,
          walletAddress: '0x' + Math.random().toString(16).substr(2, 40),
        });

        await user.save();
        logger.info(`${userData.role} user created: ${userData.email}`);
      }
    }

    // Create sample products if none exist
    const productCount = await Product.countDocuments();
    
    if (productCount === 0) {
      const admin = await User.findOne({ email: 'admin@example.com' });
      
      const sampleProducts = [
        {
          name: 'Electronic Component A',
          description: 'High-quality electronic component for circuit boards',
          category: 'Electronics',
          batchNumber: 'BATCH-ELEC-001',
          currentLocation: 'Warehouse A',
          status: 'active',
          stage: 2, // Manufacturing
          createdBy: admin._id,
          currentOwner: admin._id,
        },
        {
          name: 'Pharmaceutical Product B',
          description: 'Medical-grade pharmaceutical compound',
          category: 'Pharmaceuticals',
          batchNumber: 'BATCH-PHAR-001',
          currentLocation: 'Lab Storage',
          status: 'active',
          stage: 3, // Quality Control
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          createdBy: admin._id,
          currentOwner: admin._id,
        },
        {
          name: 'Textile Material C',
          description: 'Premium cotton textile for clothing manufacturing',
          category: 'Textiles',
          batchNumber: 'BATCH-TEXT-001',
          currentLocation: 'Factory Floor',
          status: 'active',
          stage: 1, // Raw Material
          createdBy: admin._id,
          currentOwner: admin._id,
        },
      ];

      for (const productData of sampleProducts) {
        const product = new Product(productData);
        await product.save();
        logger.info(`Sample product created: ${productData.name}`);
      }
    }

    console.log('\n=================================');
    console.log('Database seeded successfully!');
    console.log('=================================');
    console.log('\nTest Users:');
    console.log('1. admin@example.com / Admin123!');
    console.log('2. manufacturer@example.com / Test123!');
    console.log('3. supplier@example.com / Test123!');
    console.log('4. distributor@example.com / Test123!');
    console.log('5. retailer@example.com / Test123!');
    console.log('=================================\n');

    process.exit(0);
  } catch (error) {
    logger.error('Error seeding database:', error);
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();