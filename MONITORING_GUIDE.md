# 📊 Supply Chain Blockchain System - Monitoring & Usage Guide

## 🚀 System Overview

Your blockchain-enabled supply chain system is now running with:
- **MongoDB** for primary data storage
- **Blockchain** for immutable transaction records
- **Adaptive Sharding** for performance optimization
- **Redis** for caching

## 🖥️ Running Services

### 1. Backend API Server
- **URL**: http://localhost:5000
- **Status**: ✅ Running
- **Features**: REST API, Product Management, User Authentication

### 2. Frontend Application
- **URL**: http://localhost:3001
- **Status**: ✅ Running
- **Access**: Open in browser

### 3. Blockchain (Ganache)
- **URL**: http://localhost:8545
- **Status**: ✅ Running
- **Network ID**: 5777
- **Accounts**: 10 test accounts with 100 ETH each

### 4. MongoDB Database
- **URL**: mongodb://localhost:27017/supply_chain_traceability
- **Status**: ✅ Running

### 5. Redis Cache
- **URL**: redis://localhost:6379
- **Status**: ✅ Running

## 📋 How to Use the System

### Step 1: Login to the Application

1. Open browser: http://localhost:3001/test-login
2. Click "Login as Test User"
3. You'll be redirected to the dashboard

### Step 2: Create Products

1. Navigate to Products page
2. Click "Add Product"
3. Fill in the form:
   - **Name**: Product name (min 2 chars)
   - **Description**: Product details (min 3 chars)
   - **Category**: Choose from dropdown
   - **Batch Number**: Unique identifier
   - **Quantity**: Number of items
   - **Price**: Product price
4. Click "Create Product"

### Step 3: View Products

- Products page shows all created products
- Each product displays:
  - Basic information
  - Current stage
  - Owner details
  - Blockchain status

## 🔍 Monitoring the System

### 1. Real-time Logs

#### Backend Logs
```bash
# In the terminal where backend is running, you'll see:
- Product creation logs
- Blockchain transaction logs
- API request logs
- Error messages
```

#### Blockchain Logs
```bash
# Ganache terminal shows:
- Transaction hashes
- Gas usage
- Block creation
- Account balances
```

### 2. API Endpoints for Monitoring

#### Check System Health
```bash
curl http://localhost:5000/api/health
```

#### Get Product Statistics
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/products/stats
```

#### View Analytics Dashboard
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/analytics/dashboard
```

### 3. Database Monitoring

#### MongoDB
```bash
# Connect to MongoDB
mongo

# Use the database
use supply_chain_traceability

# Check products
db.products.find().pretty()

# Count products
db.products.count()

# View users
db.users.find().pretty()
```

#### Redis Monitoring
```bash
# Connect to Redis
redis-cli

# Check all keys
KEYS *

# Monitor real-time commands
MONITOR
```

### 4. Blockchain Monitoring

#### Check Contract Deployment
```bash
# In truffle console
truffle console

# Get deployed contracts
let supply = await SupplyChain.deployed()
let sharding = await AdaptiveSharding.deployed()

# Check contract addresses
supply.address
sharding.address
```

#### Monitor Transactions
- Open Ganache GUI (if installed) or check terminal output
- Each product creation triggers blockchain transaction
- Monitor gas usage and block creation

## 📊 Performance Metrics

### System Efficiency Indicators

1. **Transaction Throughput**
   - Products created per minute
   - API response times
   - Blockchain confirmation times

2. **Sharding Performance**
   - Load distribution across shards
   - Automatic rebalancing events
   - Shard capacity utilization

3. **Resource Usage**
   - MongoDB storage size
   - Redis memory usage
   - Blockchain gas consumption

## 🎯 Testing Different Scenarios

### 1. Test Product Creation
```bash
# Electronics product
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Laptop",
    "description": "High-performance laptop",
    "category": "Electronics",
    "batchNumber": "LAP-001",
    "metadata": {"quantity": 50, "unit": "pcs", "price": 1500}
  }'

# Food product
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Organic Rice",
    "description": "Premium quality rice",
    "category": "Food",
    "batchNumber": "RICE-001",
    "metadata": {"quantity": 1000, "unit": "kg", "price": 5}
  }'
```

### 2. Test Product Transfer
```bash
curl -X POST http://localhost:5000/api/products/PRODUCT_ID/transfer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "newOwner": "USER_ID",
    "newLocation": "New York Warehouse",
    "notes": "Transfer for distribution"
  }'
```

### 3. Test Batch Operations
```bash
# Create multiple products quickly to test sharding
for i in {1..10}; do
  curl -X POST http://localhost:5000/api/products \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -d "{
      \"name\": \"Test Product $i\",
      \"description\": \"Testing sharding performance\",
      \"category\": \"Electronics\",
      \"batchNumber\": \"TEST-$i\",
      \"metadata\": {\"quantity\": 10, \"unit\": \"pcs\", \"price\": 100}
    }"
done
```

## 🔧 Troubleshooting

### Common Issues and Solutions

1. **"Network error" when creating products**
   - Clear browser cache: Ctrl+Shift+R
   - Check if logged in
   - Verify backend is running

2. **Blockchain not recording transactions**
   - Check Ganache is running
   - Verify contracts are deployed
   - Check backend logs for blockchain errors

3. **Products not showing**
   - Refresh the page
   - Check MongoDB is running
   - Verify authentication token

## 📈 Visual Monitoring

### Frontend Dashboard
1. Navigate to http://localhost:3001/dashboard
2. View real-time statistics:
   - Total products
   - Active products
   - Categories breakdown
   - Recent activities

### Analytics Page
1. Go to http://localhost:3001/analytics
2. Monitor:
   - Transaction trends
   - Category distribution
   - Performance metrics

## 🛠️ Advanced Monitoring

### Enable Debug Mode
```bash
# Set environment variable
export DEBUG=supply-chain:*

# Restart backend to see detailed logs
npm start
```

### Monitor Blockchain Events
```javascript
// In browser console (F12)
// Watch for product creation events
const ws = new WebSocket('ws://localhost:5000');
ws.onmessage = (event) => console.log('Event:', event.data);
```

### Performance Testing
```bash
# Install Apache Bench
apt-get install apache2-utils

# Test API performance
ab -n 100 -c 10 -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/products
```

## 🎮 Quick Commands

### Start All Services
```bash
# Terminal 1: Start Ganache
ganache-cli --deterministic --accounts 10 --host 0.0.0.0

# Terminal 2: Start Backend
cd backend && npm start

# Terminal 3: Start Frontend
cd frontend && npm start
```

### Stop All Services
```bash
# Kill all Node processes
taskkill /IM node.exe /F

# Or kill specific ports
npx kill-port 3001 5000 8545
```

### Reset System
```bash
# Reset blockchain
npx truffle migrate --reset

# Clear MongoDB
mongo supply_chain_traceability --eval "db.dropDatabase()"

# Clear Redis
redis-cli FLUSHALL
```

## 📞 Support & Help

- **API Documentation**: http://localhost:5000/api-docs
- **Backend Logs**: Check terminal running `npm start` in backend
- **Frontend Console**: Press F12 in browser
- **Database**: Use MongoDB Compass for visual interface

## ✅ System Health Checklist

- [ ] Backend API responding (http://localhost:5000)
- [ ] Frontend accessible (http://localhost:3001)
- [ ] Ganache running (port 8545)
- [ ] MongoDB connected
- [ ] Redis connected
- [ ] Products can be created
- [ ] Products appear in list
- [ ] No errors in console

---

**System is ready for production use with all monitoring capabilities enabled!**