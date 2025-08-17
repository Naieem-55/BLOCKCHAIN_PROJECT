# 🚀 Quick Start Guide - Supply Chain Traceability

**Get your High-Efficiency Blockchain-Based Supply Chain Traceability system running in 5 minutes!**

## ⚡ Super Quick Start

### Windows Users (Choose One):

#### Option 1: Simple Batch File (Easiest)
```cmd
# Double-click or run in Command Prompt:
scripts\deploy-simple.bat
```

#### Option 2: PowerShell Script
```powershell
# Run in PowerShell as Administrator:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\deploy.ps1
```

#### Option 3: Git Bash
```bash
# Run in Git Bash:
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### Mac/Linux Users:
```bash
# Run in Terminal:
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### Universal Quick Start:
```bash
# Run from project root:
chmod +x start.sh
./start.sh
```

## 📋 What You Need

### ✅ Required (Must Have):
- **Node.js v16+** - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)

### ⚠️ Optional (Nice to Have):
- **MongoDB** - [Download here](https://www.mongodb.com/try/download/community)
- **Redis** - [Download here](https://redis.io/download)
- **Git** - [Download here](https://git-scm.com/)

> **Note:** The system works without MongoDB/Redis - they're automatically handled with fallbacks!

## 🎯 What Happens When You Run the Script

1. ✅ **Checks** your system for Node.js and npm
2. ✅ **Installs** all required dependencies automatically
3. ✅ **Creates** environment configuration files
4. ✅ **Starts** local blockchain (Ganache)
5. ✅ **Compiles** and deploys smart contracts
6. ✅ **Launches** backend API server
7. ✅ **Starts** frontend React application
8. ✅ **Verifies** everything is working

## 🌐 Access Your Application

After the script completes (2-3 minutes), open your browser:

- **🖥️ Main Application:** http://localhost:3000
- **📡 API Documentation:** http://localhost:5000/api-docs  
- **🔍 Health Check:** http://localhost:5000/health

## 🦊 MetaMask Setup (1 minute)

1. **Install MetaMask** browser extension if you haven't already
2. **Add Local Network:**
   - Network Name: `Local Ganache`
   - RPC URL: `http://localhost:8545`
   - Chain ID: `1337`
   - Currency Symbol: `ETH`

3. **Import Test Account:**
   - Click "Import Account" → "Private Key"
   - Use: `0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3`

## 🆘 Troubleshooting

### "Port already in use" Error:
```bash
# Kill processes on required ports:
# Windows:
netstat -ano | findstr :3000
taskkill /F /PID <PID_NUMBER>

# Mac/Linux:
lsof -ti:3000 | xargs kill -9
```

### "Permission denied" Error:
- **Windows:** Run Command Prompt or PowerShell as Administrator
- **Mac/Linux:** Use `sudo` for global npm installs

### "Node.js not found" Error:
- Download and install Node.js v16+ from https://nodejs.org/
- Restart your terminal after installation

### Services Won't Start:
1. Check if you have enough RAM (4GB minimum)
2. Close unnecessary applications
3. Try the `--dev-mode` option for lighter setup
4. Check log files in `backend/logs/` for detailed errors

## 🔄 Daily Development Workflow

After initial setup, for daily development:

### Option 1: Use the Scripts
```bash
# Quick restart:
./scripts/deploy.sh --dev-mode
```

### Option 2: Manual Start (Faster)
```bash
# Terminal 1: Blockchain
ganache-cli --deterministic --accounts 10 --port 8545

# Terminal 2: Backend  
cd backend && npm run dev

# Terminal 3: Frontend
cd frontend && npm start
```

## 🎮 Test the System

1. **Open** http://localhost:3000
2. **Register** a new user account
3. **Connect** MetaMask wallet
4. **Create** a test product
5. **Transfer** ownership to another participant
6. **Scan** QR codes for traceability
7. **View** analytics dashboard

## 📁 Project Structure

```
📦 Your Project
├── 🌐 frontend/          # React app (Port 3000)
├── ⚙️ backend/           # Node.js API (Port 5000)  
├── 📜 contracts/         # Smart contracts
├── 🚀 scripts/           # Deployment scripts
├── 📊 migrations/        # Contract deployment
└── 📚 docs/             # Documentation
```

## 🎉 Success Indicators

You'll know everything is working when you see:

- ✅ **4 terminal windows** open (Ganache, Backend, Frontend, Main)
- ✅ **Green success messages** in the deployment script
- ✅ **Frontend loads** at http://localhost:3000
- ✅ **API responds** at http://localhost:5000/health
- ✅ **MetaMask connects** to local network

## 🆘 Need Help?

1. **Check Prerequisites:** Ensure Node.js v16+ is installed
2. **Review Logs:** Look in `backend/logs/` for error details
3. **Free Ports:** Make sure ports 3000, 5000, 8545 are available
4. **Run as Admin:** Try running with administrator privileges
5. **Use Simple Script:** Try `scripts\deploy-simple.bat` on Windows

---

**🎯 Goal:** Get your blockchain supply chain system running with minimal effort!

**⏱️ Time:** 5 minutes setup + 2-3 minutes for services to start

**🎉 Result:** Full blockchain-based supply chain traceability system ready for your thesis!

---

*If you encounter any issues, check the detailed `DEPLOYMENT_GUIDE.md` for comprehensive troubleshooting.*