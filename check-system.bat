@echo off
title System Check - Supply Chain Traceability

echo.
echo ========================================
echo  System Check & Troubleshooting
echo ========================================
echo.

REM Check Node.js
echo [INFO] Checking Node.js...
node --version 2>nul
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('node --version') do echo [SUCCESS] Node.js %%i found
) else (
    echo [ERROR] Node.js not found! Install from: https://nodejs.org/
)

REM Check npm
echo [INFO] Checking npm...
npm --version 2>nul
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('npm --version') do echo [SUCCESS] npm %%i found
) else (
    echo [ERROR] npm not found!
)

REM Check global packages
echo.
echo [INFO] Checking global packages...

where ganache-cli >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] ganache-cli is installed
) else (
    echo [WARNING] ganache-cli not found - will be installed
)

where truffle >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] truffle is installed
) else (
    echo [WARNING] truffle not found - will be installed
)

REM Check project structure
echo.
echo [INFO] Checking project structure...

if exist "package.json" (
    echo [SUCCESS] package.json found
) else (
    echo [ERROR] package.json not found! Are you in the right directory?
)

if exist "contracts" (
    echo [SUCCESS] contracts directory found
) else (
    echo [WARNING] contracts directory not found
)

if exist "backend" (
    echo [SUCCESS] backend directory found
) else (
    echo [WARNING] backend directory not found
)

if exist "frontend" (
    echo [SUCCESS] frontend directory found
) else (
    echo [WARNING] frontend directory not found
)

REM Check ports
echo.
echo [INFO] Checking port availability...

netstat -an | findstr ":3000 " >nul
if %ERRORLEVEL% EQU 0 (
    echo [WARNING] Port 3000 is in use (Frontend)
) else (
    echo [SUCCESS] Port 3000 is available (Frontend)
)

netstat -an | findstr ":5000 " >nul
if %ERRORLEVEL% EQU 0 (
    echo [WARNING] Port 5000 is in use (Backend)
) else (
    echo [SUCCESS] Port 5000 is available (Backend)
)

netstat -an | findstr ":8545 " >nul
if %ERRORLEVEL% EQU 0 (
    echo [WARNING] Port 8545 is in use (Blockchain)
) else (
    echo [SUCCESS] Port 8545 is available (Blockchain)
)

REM Check environment files
echo.
echo [INFO] Checking environment files...

if exist "backend\.env" (
    echo [SUCCESS] backend/.env exists
) else (
    echo [INFO] backend/.env will be created during deployment
)

if exist "frontend\.env.local" (
    echo [SUCCESS] frontend/.env.local exists
) else (
    echo [INFO] frontend/.env.local will be created during deployment
)

REM System summary
echo.
echo ========================================
echo  System Summary
echo ========================================
echo.

REM Count issues
set ISSUES=0

node --version >nul 2>&1 || set /a ISSUES+=1
npm --version >nul 2>&1 || set /a ISSUES+=1
if not exist "package.json" set /a ISSUES+=1

if %ISSUES% EQU 0 (
    echo [SUCCESS] Your system is ready for deployment!
    echo.
    echo 🚀 To deploy, run one of these commands:
    echo    deploy.bat              (Full setup)
    echo    scripts\deploy-simple.bat  (Alternative)
    echo    run.bat                 (Quick start if already set up)
) else (
    echo [ERROR] Found %ISSUES% issue(s) that need to be fixed first.
    echo Please address the errors above before deploying.
)

echo.
echo 📋 Recommended deployment command for Windows:
echo    deploy.bat
echo.

pause