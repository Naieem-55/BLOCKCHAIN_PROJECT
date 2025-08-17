@echo off
REM High-Efficiency Blockchain-Based Supply Chain Traceability
REM Windows Batch Deployment Script

echo [INFO] Starting deployment using PowerShell script...
echo.

REM Check if PowerShell is available
powershell -Command "Get-Host" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] PowerShell is not available. Please install PowerShell or use Git Bash with deploy.sh
    pause
    exit /b 1
)

REM Check for parameters
if "%1"=="--help" (
    echo High-Efficiency Blockchain-Based Supply Chain Traceability
    echo Windows Batch Deployment Script
    echo.
    echo Usage: deploy.bat [options]
    echo.
    echo Options:
    echo   --dev-mode    Start in development mode
    echo   --prod-mode   Start in production mode
    echo   --help        Show this help message
    echo.
    pause
    exit /b 0
)

REM Set PowerShell execution policy for current session
echo [INFO] Setting PowerShell execution policy...
powershell -Command "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force"

REM Run the PowerShell script with appropriate parameters
if "%1"=="--dev-mode" (
    echo [INFO] Running in development mode...
    powershell -File "%~dp0deploy.ps1" -DevMode
) else if "%1"=="--prod-mode" (
    echo [INFO] Running in production mode...
    powershell -File "%~dp0deploy.ps1" -ProdMode
) else (
    echo [INFO] Running in default mode...
    powershell -File "%~dp0deploy.ps1"
)

REM Check if PowerShell script executed successfully
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Deployment failed. Check the error messages above.
    echo [INFO] You can also try running the PowerShell script directly:
    echo [INFO] PowerShell -File scripts\deploy.ps1
    echo.
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Deployment script completed successfully!
pause