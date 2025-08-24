#!/usr/bin/env node

/**
 * Supply Chain System Monitor
 * Real-time monitoring of all system components
 */

const axios = require('axios');
const Web3 = require('web3');
const mongoose = require('mongoose');
const redis = require('redis');
const colors = require('colors');

// Configuration
const CONFIG = {
  API_URL: 'http://localhost:5003/api',
  BLOCKCHAIN_URL: 'http://localhost:8545',
  MONGODB_URL: 'mongodb://localhost:27017/supply_chain_traceability',
  REDIS_URL: 'redis://localhost:6379',
  TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGFhOGY0YmNmNGMzMTU3MGJhMzhkMjgiLCJpYXQiOjE3NTYwMTIzMTAsImV4cCI6MTc1NjYxNzExMH0.asr-FAM5YoV_rRheazQtCzbyXnf25bY8xqjmnlMZp9M'
};

// Initialize connections
const web3 = new Web3(CONFIG.BLOCKCHAIN_URL);
let redisClient;
let mongoConnection;

class SystemMonitor {
  constructor() {
    this.stats = {
      api: { status: 'Unknown', lastCheck: null },
      blockchain: { status: 'Unknown', blockNumber: 0, accounts: 0 },
      database: { status: 'Unknown', products: 0, users: 0 },
      cache: { status: 'Unknown', keys: 0 },
      sharding: { totalShards: 0, activeShards: 0, efficiency: 0 }
    };
  }

  async initialize() {
    console.log(colors.cyan.bold('\n=== Supply Chain System Monitor ===\n'));
    
    // Connect to MongoDB
    try {
      mongoConnection = await mongoose.connect(CONFIG.MONGODB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      this.stats.database.status = 'Connected';
    } catch (error) {
      this.stats.database.status = 'Disconnected';
    }

    // Connect to Redis
    try {
      redisClient = redis.createClient({ url: CONFIG.REDIS_URL });
      await redisClient.connect();
      this.stats.cache.status = 'Connected';
    } catch (error) {
      this.stats.cache.status = 'Disconnected';
    }
  }

  async checkAPIHealth() {
    try {
      const response = await axios.get(`${CONFIG.API_URL}/health`, {
        timeout: 5000
      });
      this.stats.api.status = 'Online';
      this.stats.api.lastCheck = new Date().toISOString();
    } catch (error) {
      this.stats.api.status = 'Offline';
    }
  }

  async checkBlockchain() {
    try {
      const [blockNumber, accounts] = await Promise.all([
        web3.eth.getBlockNumber(),
        web3.eth.getAccounts()
      ]);
      
      this.stats.blockchain.status = 'Connected';
      this.stats.blockchain.blockNumber = blockNumber;
      this.stats.blockchain.accounts = accounts.length;
      
      // Get first account balance
      if (accounts.length > 0) {
        const balance = await web3.eth.getBalance(accounts[0]);
        this.stats.blockchain.balance = web3.utils.fromWei(balance, 'ether');
      }
    } catch (error) {
      this.stats.blockchain.status = 'Disconnected';
    }
  }

  async checkDatabase() {
    if (mongoConnection && mongoConnection.connection.readyState === 1) {
      try {
        const db = mongoConnection.connection.db;
        const [productsCount, usersCount] = await Promise.all([
          db.collection('products').countDocuments(),
          db.collection('users').countDocuments()
        ]);
        
        this.stats.database.products = productsCount;
        this.stats.database.users = usersCount;
        this.stats.database.status = 'Connected';
      } catch (error) {
        this.stats.database.status = 'Error';
      }
    }
  }

  async checkRedis() {
    if (redisClient && redisClient.isOpen) {
      try {
        const keys = await redisClient.keys('*');
        this.stats.cache.keys = keys.length;
        this.stats.cache.status = 'Connected';
      } catch (error) {
        this.stats.cache.status = 'Error';
      }
    }
  }

  async getProductStats() {
    try {
      const response = await axios.get(`${CONFIG.API_URL}/products/stats`, {
        headers: { Authorization: `Bearer ${CONFIG.TOKEN}` },
        timeout: 5000
      });
      
      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      return null;
    }
  }

  displayStatus() {
    console.clear();
    console.log(colors.cyan.bold('\n╔════════════════════════════════════════════════════════════╗'));
    console.log(colors.cyan.bold('║         SUPPLY CHAIN BLOCKCHAIN SYSTEM MONITOR            ║'));
    console.log(colors.cyan.bold('╚════════════════════════════════════════════════════════════╝\n'));
    
    const timestamp = new Date().toLocaleString();
    console.log(colors.gray(`Last Update: ${timestamp}\n`));
    
    // API Status
    console.log(colors.yellow.bold('📡 API Server'));
    console.log(`   Status: ${this.getStatusColor(this.stats.api.status)}`);
    console.log(`   URL: http://localhost:5003`);
    console.log(`   Last Check: ${this.stats.api.lastCheck || 'Never'}\n`);
    
    // Blockchain Status
    console.log(colors.yellow.bold('⛓️  Blockchain (Ganache)'));
    console.log(`   Status: ${this.getStatusColor(this.stats.blockchain.status)}`);
    console.log(`   Block Number: ${colors.white(this.stats.blockchain.blockNumber)}`);
    console.log(`   Accounts: ${colors.white(this.stats.blockchain.accounts)}`);
    if (this.stats.blockchain.balance) {
      console.log(`   Account[0] Balance: ${colors.white(this.stats.blockchain.balance)} ETH`);
    }
    console.log();
    
    // Database Status
    console.log(colors.yellow.bold('🗄️  MongoDB Database'));
    console.log(`   Status: ${this.getStatusColor(this.stats.database.status)}`);
    console.log(`   Products: ${colors.white(this.stats.database.products)}`);
    console.log(`   Users: ${colors.white(this.stats.database.users)}\n`);
    
    // Cache Status
    console.log(colors.yellow.bold('⚡ Redis Cache'));
    console.log(`   Status: ${this.getStatusColor(this.stats.cache.status)}`);
    console.log(`   Cached Keys: ${colors.white(this.stats.cache.keys)}\n`);
    
    // Sharding Status (if available)
    if (this.stats.sharding.totalShards > 0) {
      console.log(colors.yellow.bold('🔀 Adaptive Sharding'));
      console.log(`   Total Shards: ${colors.white(this.stats.sharding.totalShards)}`);
      console.log(`   Active Shards: ${colors.white(this.stats.sharding.activeShards)}`);
      console.log(`   System Efficiency: ${colors.white(this.stats.sharding.efficiency)}%\n`);
    }
    
    // Instructions
    console.log(colors.gray('─'.repeat(60)));
    console.log(colors.gray('Press Ctrl+C to exit monitoring'));
    console.log(colors.gray('Refreshing every 5 seconds...'));
  }

  getStatusColor(status) {
    switch (status) {
      case 'Online':
      case 'Connected':
        return colors.green('● ' + status);
      case 'Offline':
      case 'Disconnected':
        return colors.red('● ' + status);
      case 'Error':
        return colors.yellow('● ' + status);
      default:
        return colors.gray('● ' + status);
    }
  }

  async runMonitoring() {
    await this.initialize();
    
    // Main monitoring loop
    setInterval(async () => {
      await Promise.all([
        this.checkAPIHealth(),
        this.checkBlockchain(),
        this.checkDatabase(),
        this.checkRedis()
      ]);
      
      this.displayStatus();
    }, 5000);
    
    // Initial check
    await Promise.all([
      this.checkAPIHealth(),
      this.checkBlockchain(),
      this.checkDatabase(),
      this.checkRedis()
    ]);
    
    this.displayStatus();
  }
}

// Create test products function
async function createTestProducts() {
  console.log(colors.cyan('\nCreating test products...'));
  
  const categories = ['Electronics', 'Food', 'Pharmaceuticals', 'Textiles', 'Automotive'];
  const products = [];
  
  for (let i = 0; i < 5; i++) {
    const product = {
      name: `Test Product ${i + 1}`,
      description: `This is a test product for category ${categories[i % categories.length]}`,
      category: categories[i % categories.length],
      batchNumber: `BATCH-TEST-${Date.now()}-${i}`,
      metadata: {
        quantity: Math.floor(Math.random() * 100) + 10,
        unit: 'pcs',
        price: Math.floor(Math.random() * 1000) + 100
      }
    };
    products.push(product);
  }
  
  for (const product of products) {
    try {
      const response = await axios.post(
        `${CONFIG.API_URL}/products`,
        product,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${CONFIG.TOKEN}`
          }
        }
      );
      
      if (response.data.success) {
        console.log(colors.green(`✓ Created: ${product.name} (${product.category})`));
      }
    } catch (error) {
      console.log(colors.red(`✗ Failed to create: ${product.name}`));
    }
  }
  
  console.log(colors.cyan('\nTest products created!\n'));
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--create-test-data')) {
    await createTestProducts();
  }
  
  const monitor = new SystemMonitor();
  await monitor.runMonitoring();
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log(colors.yellow('\n\nShutting down monitor...'));
  
  if (redisClient) {
    await redisClient.quit();
  }
  
  if (mongoConnection) {
    await mongoConnection.disconnect();
  }
  
  process.exit(0);
});

// Start monitoring
main().catch(console.error);