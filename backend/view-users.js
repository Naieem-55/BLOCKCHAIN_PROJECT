const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/supply_chain_traceability');

// Import User model
const User = require('./models/User');

async function viewUsers() {
  try {
    console.log('📊 Fetching all registered users...\n');
    
    // Get all users (excluding password)
    const users = await User.find({}, '-password');
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }
    
    console.log(`✅ Found ${users.length} user(s):\n`);
    
    users.forEach((user, index) => {
      console.log(`👤 User ${index + 1}:`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Company: ${user.company || 'Not specified'}`);
      console.log(`   Location: ${user.location || 'Not specified'}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Verified: ${user.isVerified}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log(`   Last Login: ${user.lastLogin || 'Never'}`);
      if (user.walletAddress) {
        console.log(`   Wallet: ${user.walletAddress}`);
      }
      console.log('   ─────────────────────────────────────');
    });
    
    // Show database statistics
    console.log(`\n📈 Database Statistics:`);
    console.log(`   Database: supply_chain_traceability`);
    console.log(`   Collection: users`);
    console.log(`   Total Documents: ${users.length}`);
    console.log(`   Storage Location: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/supply_chain_traceability'}`);
    
  } catch (error) {
    console.error('❌ Error fetching users:', error.message);
  } finally {
    mongoose.disconnect();
  }
}

// Run the function
viewUsers();