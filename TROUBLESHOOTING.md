# Troubleshooting Guide

## Common Issues and Solutions

### 1. Port Already in Use Error (EADDRINUSE)

#### For Backend (Port 5001):
```bash
# Windows - Find and kill process
netstat -ano | findstr :5001
taskkill //F //PID [PID_NUMBER]

# Or use the provided script
start-backend.bat
```

#### For Frontend (Port 3000):
```bash
# Windows - Find and kill process
netstat -ano | findstr :3000
taskkill //F //PID [PID_NUMBER]
```

### 2. Backend Not Starting

**Check .env file:**
- Make sure there's no BOM character at the beginning
- Verify PORT=5001 is set correctly

**Manual start:**
```bash
cd backend
npm run dev
```

### 3. Frontend Cannot Connect to Backend

**Verify proxy configuration in frontend/package.json:**
```json
"proxy": "http://localhost:5001"
```

**Check if backend is running:**
```bash
curl http://localhost:5001/health
```

### 4. MongoDB Connection Issues

**Ensure MongoDB is running:**
```bash
# Check if MongoDB is running
mongosh --eval "db.adminCommand('ping')"

# Start MongoDB if needed
mongod
```

### 5. Redis Errors (Non-Critical)

Redis is optional. The app will work without it. To stop error messages:
- Install and start Redis, OR
- Ignore the warnings (app will work fine)

### 6. Blockchain Contract Errors (Non-Critical)

The blockchain features are optional. To enable:
1. Start Ganache: `npx ganache`
2. Deploy contracts: `cd blockchain && npx truffle migrate`

## Quick Fixes

### Complete Restart
Use the provided batch file:
```bash
start-all.bat
```

### Manual Service Start
1. **Backend**: `cd backend && npm run dev`
2. **Frontend**: `cd frontend && npm start`
3. **Blockchain** (optional): `cd blockchain && npx ganache`

## Service URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **API Documentation**: http://localhost:5001/api-docs
- **MongoDB**: mongodb://localhost:27017
- **Ganache** (if running): http://localhost:8545

## Test Account
- Email: test@example.com
- Password: Test123!

## Health Check Commands

```bash
# Check Backend
curl http://localhost:5001/health

# Check Frontend
curl http://localhost:3000

# Test API Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"Test123!\"}"
```

## If All Else Fails

1. Kill all Node processes:
   ```bash
   taskkill //F //IM node.exe
   ```

2. Clear npm cache:
   ```bash
   npm cache clean --force
   ```

3. Reinstall dependencies:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

4. Use the start-all.bat script to restart everything