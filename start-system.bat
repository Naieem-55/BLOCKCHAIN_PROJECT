@echo off
REM Batch script to start the Supply Chain Traceability System

echo Starting Supply Chain Traceability System...
echo ============================================

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo.
echo 1. Starting Ganache (Local Blockchain)...
start "Ganache" cmd /k "ganache-cli -p 7545 --deterministic --accounts 10 --host 0.0.0.0"

timeout /t 5 /nobreak >nul

echo.
echo 2. Deploying Smart Contracts...
cd /d "%~dp0"
call npx truffle compile
call npx truffle migrate --reset

echo.
echo 3. Starting Backend Server...
cd /d "%~dp0backend"
if not exist node_modules (
    echo Installing backend dependencies...
    call npm install
)
start "Backend Server" cmd /k "npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo 4. Starting Frontend Application...
cd /d "%~dp0frontend"
if not exist node_modules (
    echo Installing frontend dependencies...
    call npm install --legacy-peer-deps
)
start "Frontend" cmd /k "npm start"

timeout /t 5 /nobreak >nul

echo.
echo ============================================
echo Supply Chain System Started Successfully!
echo ============================================
echo.
echo Access Points:
echo   Frontend:    http://localhost:3001
echo   Backend API: http://localhost:5000
echo   API Docs:    http://localhost:5000/api-docs
echo   Blockchain:  http://localhost:7545
echo.
echo To stop all services, close the command windows
echo.
echo Press any key to open the application in your browser...
pause >nul

start http://localhost:3001