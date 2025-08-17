@echo off
setlocal enabledelayedexpansion

REM High-Efficiency Blockchain-Based Supply Chain Traceability
REM Simple Windows Deployment Script

echo ========================================
echo  Supply Chain Traceability Deployment
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js v16 or higher.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo [INFO] Node.js version: 
node --version

REM Check if npm is installed
npm --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed.
    pause
    exit /b 1
)

echo [INFO] npm version: 
npm --version

REM Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] package.json not found. Please run this script from the project root directory.
    pause
    exit /b 1
)

echo.
echo [INFO] Installing global dependencies...
call npm install -g ganache-cli truffle nodemon concurrently
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Some global packages failed to install. Continuing anyway...
)

echo.
echo [INFO] Installing project dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install root dependencies
    pause
    exit /b 1
)

REM Install backend dependencies
if exist "backend" (
    echo [INFO] Installing backend dependencies...
    cd backend
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install backend dependencies
        cd ..
        pause
        exit /b 1
    )
    cd ..
)

REM Install frontend dependencies
if exist "frontend" (
    echo [INFO] Installing frontend dependencies...
    cd frontend
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install frontend dependencies
        cd ..
        pause
        exit /b 1
    )
    cd ..
)

echo.
echo [INFO] Setting up environment files...

REM Create necessary directories
if not exist "backend\logs" mkdir "backend\logs"
if not exist "data\db" mkdir "data\db"
if not exist "uploads" mkdir "uploads"

REM Create backend .env file if it doesn't exist
if not exist "backend\.env" (
    echo [INFO] Creating backend environment file...
    (
        echo # Server Configuration
        echo NODE_ENV=development
        echo PORT=5000
        echo API_URL=http://localhost:5000
        echo.
        echo # Frontend Configuration
        echo FRONTEND_URL=http://localhost:3000
        echo.
        echo # Database Configuration
        echo MONGODB_URI=mongodb://localhost:27017/supply_chain_traceability
        echo.
        echo # Redis Configuration
        echo REDIS_URL=redis://localhost:6379
        echo.
        echo # Blockchain Configuration
        echo WEB3_PROVIDER_URL=http://localhost:8545
        echo NETWORK_ID=1337
        echo CONTRACT_OWNER_PRIVATE_KEY=0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3
        echo.
        echo # JWT Configuration
        echo JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
        echo JWT_EXPIRES_IN=7d
        echo JWT_COOKIE_EXPIRES_IN=7
        echo.
        echo # Logging Configuration
        echo LOG_LEVEL=info
        echo.
        echo # Development Configuration
        echo DEBUG=true
        echo ENABLE_SWAGGER=true
    ) > backend\.env
    echo [SUCCESS] Backend .env file created
) else (
    echo [SUCCESS] Backend .env file already exists
)

REM Create frontend .env.local file if it doesn't exist
if not exist "frontend\.env.local" (
    echo [INFO] Creating frontend environment file...
    (
        echo REACT_APP_API_URL=http://localhost:5000/api
        echo REACT_APP_WEB3_PROVIDER_URL=http://localhost:8545
        echo REACT_APP_NETWORK_ID=1337
    ) > frontend\.env.local
    echo [SUCCESS] Frontend .env.local file created
) else (
    echo [SUCCESS] Frontend .env.local file already exists
)

REM Create truffle-config.js if it doesn't exist
if not exist "truffle-config.js" (
    echo [INFO] Creating truffle-config.js...
    (
        echo module.exports = {
        echo   networks: {
        echo     development: {
        echo       host: "127.0.0.1",
        echo       port: 8545,
        echo       network_id: "1337",
        echo       gas: 6721975,
        echo       gasPrice: 20000000000,
        echo     },
        echo   },
        echo   compilers: {
        echo     solc: {
        echo       version: "0.8.19",
        echo       settings: {
        echo         optimizer: {
        echo           enabled: true,
        echo           runs: 200
        echo         }
        echo       }
        echo     }
        echo   }
        echo };
    ) > truffle-config.js
    echo [SUCCESS] truffle-config.js created
)

echo.
echo ========================================
echo  Starting Services
echo ========================================
echo.

echo [INFO] This will start all services in separate windows.
echo [INFO] You can close individual service windows to stop them.
echo.

REM Start Ganache in a new window
echo [INFO] Starting Ganache CLI (Blockchain)...
start "Ganache CLI" cmd /k "ganache-cli --deterministic --accounts 10 --host 0.0.0.0 --port 8545 --networkId 1337 --gasLimit 8000000 --gasPrice 20000000000"

REM Wait a bit for Ganache to start
echo [INFO] Waiting for blockchain to initialize...
timeout /t 10 /nobreak >nul

REM Compile and deploy contracts
echo [INFO] Compiling smart contracts...
call npx truffle compile
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Contract compilation failed
    pause
    exit /b 1
)

echo [INFO] Deploying smart contracts...
call npx truffle migrate --network development --reset
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Contract deployment failed
    pause
    exit /b 1
)

echo [SUCCESS] Smart contracts deployed successfully

REM Start backend in a new window
if exist "backend" (
    echo [INFO] Starting Backend Server...
    start "Backend Server" cmd /k "cd backend && npm run dev"
)

REM Start frontend in a new window
if exist "frontend" (
    echo [INFO] Starting Frontend Application...
    start "Frontend App" cmd /k "cd frontend && npm start"
)

echo.
echo ========================================
echo  Deployment Complete!
echo ========================================
echo.
echo [SUCCESS] All services are starting up!
echo.
echo Application URLs:
echo   Frontend:        http://localhost:3000
echo   Backend API:     http://localhost:5000/api
echo   API Docs:        http://localhost:5000/api-docs
echo   Health Check:    http://localhost:5000/health
echo.
echo Blockchain:
echo   RPC URL:         http://localhost:8545
echo   Network ID:      1337
echo   Chain ID:        1337
echo.
echo Next Steps:
echo   1. Wait for all services to start (2-3 minutes)
echo   2. Open http://localhost:3000 in your browser
echo   3. Configure MetaMask with local network
echo   4. Import test account using private key:
echo      0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3
echo.
echo To stop services: Close the individual service windows
echo.

pause