# 🚀 Deployment Guide - High-Efficiency Blockchain-Based Supply Chain Traceability

This guide provides step-by-step instructions for deploying the complete supply chain traceability system on different platforms.

## 📋 Prerequisites

### Required Software
- **Node.js** v16+ - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** - [Download](https://git-scm.com/)

### Optional Software (Recommended)
- **MongoDB** - [Download](https://www.mongodb.com/try/download/community)
- **Redis** - [Download](https://redis.io/download)
- **MetaMask** browser extension - [Install](https://metamask.io/)

### System Requirements
- **RAM:** 4GB minimum, 8GB recommended
- **Storage:** 2GB free space
- **Ports:** 3000, 5000, 8545, 27017, 6379 (must be available)

## 🖥️ Platform-Specific Deployment

### Windows Deployment

#### Option 1: PowerShell Script (Recommended)
```powershell
# Run in PowerShell as Administrator
.\scripts\deploy.ps1

# Or with specific options:
.\scripts\deploy.ps1 -DevMode     # Development mode
.\scripts\deploy.ps1 -ProdMode    # Production mode
.\scripts\deploy.ps1 -Help        # Show help
```

#### Option 2: Bash Script (Git Bash/WSL)
```bash
# Run in Git Bash or WSL
chmod +x scripts/deploy.sh
./scripts/deploy.sh

# Or with options:
./scripts/deploy.sh --dev-mode
./scripts/deploy.sh --prod-mode
./scripts/deploy.sh --help
```

### Unix/Linux/macOS Deployment

```bash
# Make script executable
chmod +x scripts/deploy.sh

# Run deployment
./scripts/deploy.sh

# Or with options:
./scripts/deploy.sh --dev-mode    # Development mode
./scripts/deploy.sh --prod-mode   # Production mode
./scripts/deploy.sh --help        # Show help
```

## 🔧 Manual Setup (Alternative)

If the automated scripts don't work, follow these manual steps:

### 1. Install Global Dependencies
```bash
npm install -g ganache-cli truffle nodemon concurrently
```

### 2. Install Project Dependencies
```bash
# Root dependencies
npm install

# Backend dependencies
cd backend && npm install && cd ..

# Frontend dependencies
cd frontend && npm install && cd ..
```

### 3. Setup Environment Files
```bash
# Backend environment
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration

# Frontend environment
cat > frontend/.env.local << EOF
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_WEB3_PROVIDER_URL=http://localhost:8545
REACT_APP_NETWORK_ID=1337
EOF
```

### 4. Start Services Manually

#### Terminal 1: Blockchain
```bash
ganache-cli --deterministic --accounts 10 --host 0.0.0.0 --port 8545 --networkId 1337
```

#### Terminal 2: Deploy Contracts
```bash
npx truffle compile
npx truffle migrate --network development --reset
```

#### Terminal 3: Backend
```bash
cd backend
npm run dev
```

#### Terminal 4: Frontend
```bash
cd frontend
npm start
```

## ✅ Verification Steps

### 1. Check Running Services
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api
- **API Docs:** http://localhost:5000/api-docs
- **Health Check:** http://localhost:5000/health
- **Blockchain:** http://localhost:8545

### 2. Test Blockchain Connection
```bash
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  http://localhost:8545
```

### 3. Test Backend Health
```bash
curl http://localhost:5000/health
```

## 🦊 MetaMask Configuration

### 1. Add Local Network
1. Open MetaMask
2. Click network dropdown → "Add Network"
3. Fill in details:
   - **Network Name:** Local Ganache
   - **RPC URL:** http://localhost:8545
   - **Chain ID:** 1337
   - **Currency Symbol:** ETH
   - **Block Explorer:** (leave empty)

### 2. Import Test Account
1. Click account icon → "Import Account"
2. Select "Private Key"
3. Use one of these test private keys:
   ```
   Account 0: 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3
   Account 1: 0xae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f
   ```

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /F /PID <PID>

# Unix/Linux/macOS
lsof -ti:3000 | xargs kill -9
```

#### Node.js Version Issues
```bash
# Check version
node --version

# Should be v16 or higher
# Update from https://nodejs.org/
```

#### Permission Issues
```bash
# Windows: Run PowerShell as Administrator
# Unix/Linux/macOS: Use sudo for global installs
sudo npm install -g ganache-cli truffle
```

#### MongoDB/Redis Not Found
The system will work without these services:
- **MongoDB:** Falls back to in-memory database
- **Redis:** Disables caching (still functional)

#### Contract Deployment Fails
```bash
# Ensure Ganache is running
# Check if port 8545 is accessible
# Verify truffle-config.js exists
# Try redeploying:
npx truffle migrate --network development --reset
```

### Log Files Location
- **Windows:** `backend\logs\`
- **Unix/Linux/macOS:** `backend/logs/`

Check these files for detailed error information:
- `ganache.log` - Blockchain logs
- `backend.log` - Backend server logs
- `frontend.log` - Frontend build logs
- `mongodb.log` - Database logs
- `redis.log` - Cache logs

### Performance Issues

#### Slow Startup
- Use `--dev-mode` for faster development setup
- Ensure adequate RAM (8GB+ recommended)
- Close unnecessary applications

#### Frontend Build Slow
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
# Then restart frontend
```

## 🔄 Development Workflow

### Daily Development
```bash
# Quick start (after initial setup)
./scripts/deploy.sh --dev-mode

# Then manually start services:
cd backend && npm run dev    # Terminal 1
cd frontend && npm start     # Terminal 2
```

### Code Changes
- **Smart Contracts:** Recompile and migrate
  ```bash
  npx truffle compile
  npx truffle migrate --reset
  ```
- **Backend:** Nodemon auto-restarts
- **Frontend:** Hot reload enabled

### Database Reset
```bash
# Stop services
# Delete data/db directory
rm -rf data/db
# Restart services
```

## 🚀 Production Deployment

### Environment Variables
Update these in `backend/.env`:
```env
NODE_ENV=production
JWT_SECRET=your-super-secure-secret-key
MONGODB_URI=mongodb://your-production-db
REDIS_URL=redis://your-production-redis
```

### Build Frontend
```bash
cd frontend
npm run build
```

### Process Management
Consider using PM2 for production:
```bash
npm install -g pm2
pm2 start backend/server.js --name "supply-chain-backend"
pm2 serve frontend/build 3000 --name "supply-chain-frontend"
```

## 📊 System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Blockchain    │
│   React App     │◄──►│   Node.js       │◄──►│   Ganache       │
│   Port: 3000    │    │   Port: 5000    │    │   Port: 8545    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌────────┴────────┐
                       │                 │
                ┌─────────────┐   ┌─────────────┐
                │  MongoDB    │   │   Redis     │
                │  Port:27017 │   │  Port: 6379 │
                └─────────────┘   └─────────────┘
```

## 🔗 API Endpoints

### Health Check
- `GET /health` - System health status

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile

### Products
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `GET /api/products/:id` - Get product details
- `PUT /api/products/:id` - Update product

### Participants
- `GET /api/participants` - List participants
- `POST /api/participants` - Register participant

### IoT Sensors
- `GET /api/iot/sensors` - List sensors
- `POST /api/iot/sensors` - Register sensor
- `POST /api/iot/readings` - Record sensor data

### Analytics
- `GET /api/analytics/dashboard` - Dashboard statistics

## 📚 Additional Resources

- **Smart Contract Documentation:** `/contracts/README.md`
- **API Documentation:** http://localhost:5000/api-docs
- **Frontend Components:** `/frontend/src/components/README.md`
- **Database Schema:** `/backend/models/README.md`

## 🆘 Support

If you encounter issues:

1. **Check Prerequisites:** Ensure all required software is installed
2. **Review Logs:** Check log files for specific error messages  
3. **Port Conflicts:** Ensure required ports are available
4. **Permissions:** Run with appropriate permissions (Administrator/sudo)
5. **Clean Install:** Delete `node_modules` and reinstall dependencies

For persistent issues, check the troubleshooting section above or review the log files for detailed error information.