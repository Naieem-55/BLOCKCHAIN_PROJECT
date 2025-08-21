# Nodemon Crash Fix - Port Already in Use

## Problem
Nodemon was crashing with error:
```
Error: listen EADDRINUSE: address already in use :::5001
```

## Root Cause
- Multiple Node.js processes were running simultaneously
- Port 5001 was already occupied by a previous server instance
- Nodemon couldn't bind to the port, causing the crash

## Solution Implemented

### 1. Created Auto-Cleanup Script
**File:** `backend/start-clean.js`
- Automatically detects and kills processes on ports 5001 and 5000
- Provides clean startup environment
- Handles graceful shutdown

### 2. Updated Package.json Scripts
**Added new script:**
```json
"dev:clean": "node start-clean.js"
```

### 3. Updated Batch Files
- `start-backend.bat` now uses `npm run dev:clean`
- `start-all.bat` also uses the clean startup method

## How to Use

### Option 1: Clean Development Start
```bash
cd backend
npm run dev:clean
```

### Option 2: Use Batch File
```bash
# Windows
start-backend.bat
```

### Option 3: Manual Port Cleanup + Regular Start
```bash
# Kill existing processes
netstat -ano | findstr :5001
taskkill //F //PID [PID_NUMBER]

# Then start normally
npm run dev
```

## Benefits of the Solution

1. **Automatic Port Cleanup**: No more manual process killing
2. **Graceful Shutdown**: Proper cleanup on exit
3. **Backwards Compatible**: Original `npm run dev` still works
4. **User Friendly**: Clear console messages about what's happening
5. **Robust**: Handles multiple port conflicts (5000 and 5001)

## Current Status

✅ **Backend running successfully on port 5001**
✅ **No more nodemon crashes**
✅ **Automatic port conflict resolution**
✅ **Clean startup process**

## Future Prevention

The `dev:clean` script will prevent this issue from happening again by:
- Always checking for port conflicts before starting
- Killing any conflicting processes automatically
- Providing clear feedback about what's happening

## Quick Commands for Troubleshooting

```bash
# Check what's running on port 5001
netstat -ano | findstr :5001

# Kill specific process
taskkill //F //PID [PID_NUMBER]

# Kill all node processes (nuclear option)
taskkill //F //IM node.exe

# Start with cleanup
npm run dev:clean
```