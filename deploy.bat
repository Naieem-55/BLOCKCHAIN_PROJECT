@echo off
setlocal

REM High-Efficiency Blockchain-Based Supply Chain Traceability
REM Windows Deployment Script

title Supply Chain Traceability Deployment

echo.
echo ========================================
echo  Supply Chain Traceability Deployment
echo ========================================
echo.

REM Check Node.js
echo [INFO] Checking Node.js installation...
node --version 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js v16+ from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [SUCCESS] Found Node.js %NODE_VERSION%

REM Check npm
echo [INFO] Checking npm installation...
npm --version 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed!
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [SUCCESS] Found npm %NPM_VERSION%

REM Check project directory
echo [INFO] Checking project structure...
if not exist "package.json" (
    echo [ERROR] package.json not found!
    echo Please run this script from the project root directory.
    echo.
    pause
    exit /b 1
)
echo [SUCCESS] Project structure verified

REM Install global dependencies
echo.
echo [INFO] Installing global dependencies (this may take a few minutes)...
call npm install -g ganache-cli truffle
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Some global packages may have failed. Continuing...
) else (
    echo [SUCCESS] Global dependencies installed
)

REM Install project dependencies
echo.
echo [INFO] Installing project dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install project dependencies!
    pause
    exit /b 1
)
echo [SUCCESS] Project dependencies installed

REM Install backend dependencies
echo.
if exist "backend" (
    echo [INFO] Installing backend dependencies...
    pushd backend
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install backend dependencies!
        popd
        pause
        exit /b 1
    )
    popd
    echo [SUCCESS] Backend dependencies installed
) else (
    echo [WARNING] Backend directory not found - skipping
)

REM Install frontend dependencies  
echo.
if exist "frontend" (
    echo [INFO] Installing frontend dependencies...
    pushd frontend
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install frontend dependencies!
        popd
        pause
        exit /b 1
    )
    popd
    echo [SUCCESS] Frontend dependencies installed
) else (
    echo [WARNING] Frontend directory not found - skipping
)

REM Create directories
echo.
echo [INFO] Creating necessary directories...
if not exist "backend\logs" mkdir "backend\logs"
if not exist "data\db" mkdir "data\db" 
if not exist "uploads" mkdir "uploads"
echo [SUCCESS] Directories created

REM Setup environment files
echo.
echo [INFO] Setting up environment files...

if not exist "backend\.env" (
    echo [INFO] Creating backend/.env file...
    (
        echo NODE_ENV=development
        echo PORT=5000
        echo API_URL=http://localhost:5000
        echo FRONTEND_URL=http://localhost:3000
        echo MONGODB_URI=mongodb://localhost:27017/supply_chain_traceability
        echo REDIS_URL=redis://localhost:6379
        echo WEB3_PROVIDER_URL=http://localhost:8545
        echo NETWORK_ID=1337
        echo CONTRACT_OWNER_PRIVATE_KEY=0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3
        echo JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
        echo JWT_EXPIRES_IN=7d
        echo LOG_LEVEL=info
        echo DEBUG=true
        echo ENABLE_SWAGGER=true
    ) > "backend\.env"
    echo [SUCCESS] Backend .env file created
) else (
    echo [SUCCESS] Backend .env file already exists
)

if not exist "frontend\.env.local" (
    echo [INFO] Creating frontend/.env.local file...
    (
        echo REACT_APP_API_URL=http://localhost:5000/api
        echo REACT_APP_WEB3_PROVIDER_URL=http://localhost:8545
        echo REACT_APP_NETWORK_ID=1337
    ) > "frontend\.env.local"
    echo [SUCCESS] Frontend .env.local file created
) else (
    echo [SUCCESS] Frontend .env.local file already exists
)

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
    ) > "truffle-config.js"
    echo [SUCCESS] truffle-config.js created
)

echo.
echo ========================================
echo  Starting Services
echo ========================================
echo.

REM Start Ganache blockchain
echo [INFO] Starting Ganache CLI (Local Blockchain)...
echo [INFO] Opening new window for blockchain service...
start "Ganache - Local Blockchain" cmd /c "echo Starting Ganache CLI... && ganache-cli --deterministic --accounts 10 --host 0.0.0.0 --port 8545 --networkId 1337 && pause"

echo [INFO] Waiting for Ganache to start (15 seconds)...
timeout /t 15 /nobreak >nul

REM Test if Ganache is running
echo [INFO] Testing blockchain connection...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8545' -Method POST -Body '{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}' -ContentType 'application/json' -TimeoutSec 5; if ($response.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }"
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Blockchain may not be ready yet. Continuing anyway...
) else (
    echo [SUCCESS] Blockchain is running
)

REM Compile contracts
echo.
echo [INFO] Compiling smart contracts...
call npx truffle compile
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Contract compilation failed!
    echo Check that you have the contracts directory with .sol files
    pause
    exit /b 1
)
echo [SUCCESS] Smart contracts compiled

REM Deploy contracts
echo [INFO] Deploying smart contracts to blockchain...
call npx truffle migrate --network development --reset
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Contract deployment failed!
    echo Make sure Ganache is running on port 8545
    pause
    exit /b 1
)
echo [SUCCESS] Smart contracts deployed

REM Start backend server
echo.
if exist "backend" (
    echo [INFO] Starting Backend Server (API)...
    echo [INFO] Opening new window for backend service...
    start "Backend - API Server" cmd /c "echo Starting Backend Server... && cd backend && npm run dev && pause"
    echo [SUCCESS] Backend server started in new window
) else (
    echo [WARNING] Backend directory not found - skipping backend
)

REM Wait a bit for backend to start
timeout /t 5 /nobreak >nul

REM Start frontend application
echo.
if exist "frontend" (
    echo [INFO] Starting Frontend Application (React)...
    echo [INFO] Opening new window for frontend service...
    start "Frontend - React App" cmd /c "echo Starting Frontend Application... && cd frontend && npm start && pause"
    echo [SUCCESS] Frontend application started in new window
) else (
    echo [WARNING] Frontend directory not found - skipping frontend
)

echo.
echo ========================================
echo  Deployment Completed Successfully!
echo ========================================
echo.
echo [SUCCESS] All services are starting up!
echo.
echo You should now see 3 new windows:
echo   1. Ganache CLI (Blockchain)
echo   2. Backend Server (API)  
echo   3. Frontend App (React)
echo.
echo 🌐 Application URLs:
echo   Frontend:        http://localhost:3000
echo   Backend API:     http://localhost:5000/api
echo   API Docs:        http://localhost:5000/api-docs
echo   Health Check:    http://localhost:5000/health
echo.
echo 🔗 Blockchain Info:
echo   RPC URL:         http://localhost:8545
echo   Network ID:      1337
echo   Chain ID:        1337
echo.
echo 📝 Next Steps:
echo   1. Wait 2-3 minutes for all services to fully start
echo   2. Open http://localhost:3000 in your browser
echo   3. Configure MetaMask:
echo      - Add network with RPC: http://localhost:8545
echo      - Chain ID: 1337
echo   4. Import test account with private key:
echo      0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3
echo   5. Start using the application!
echo.
echo 🛑 To stop all services: Close the individual service windows
echo.
echo Press any key to close this window...
pause >nul