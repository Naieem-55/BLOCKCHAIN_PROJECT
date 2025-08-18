@echo off
title Supply Chain Traceability - Quick Run

echo.
echo ========================================
echo  Quick Run - Supply Chain Traceability  
echo ========================================
echo.

REM Check if already set up
if not exist "backend\.env" (
    echo [ERROR] Project not set up yet!
    echo Please run deploy.bat first to set up the project.
    echo.
    pause
    exit /b 1
)

echo [INFO] Starting all services...
echo [INFO] This will open 3 new windows for the services.
echo.

REM Start Ganache
echo [INFO] Starting Ganache (Blockchain)...
start "Ganache - Blockchain" cmd /k "ganache-cli --deterministic --accounts 10 --host 0.0.0.0 --port 8545 --networkId 1337"

REM Wait for Ganache
echo [INFO] Waiting for blockchain to start...
timeout /t 10 /nobreak >nul

REM Start Backend
echo [INFO] Starting Backend Server...
start "Backend - API" cmd /k "cd backend && npm run dev"

REM Start Frontend  
echo [INFO] Starting Frontend App...
start "Frontend - React" cmd /k "cd frontend && npm start"

echo.
echo [SUCCESS] All services started!
echo.
echo 🌐 Access your application:
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:5000/api
echo.
echo 🛑 To stop: Close the service windows
echo.
pause