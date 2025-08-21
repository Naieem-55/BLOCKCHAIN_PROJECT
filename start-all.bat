@echo off
echo ====================================
echo Starting Blockchain Supply Chain App
echo ====================================
echo.

REM Start Ganache (Blockchain)
echo Starting Ganache blockchain...
start /B cmd /c "cd blockchain && npx ganache --port 8545 --accounts 10 --deterministic --mnemonic \"candy maple cake sugar pudding cream honey rich smooth crumble sweet treat\" >nul 2>&1"
timeout /t 3 >nul

REM Kill any existing backend process on port 5001
echo Checking for existing backend processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5001 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)

REM Start Backend
echo Starting Backend server on port 5001...
start cmd /k "cd backend && npm run dev:clean"
timeout /t 5 >nul

REM Start Frontend
echo Starting Frontend on port 3000...
start cmd /k "cd frontend && npm start"

echo.
echo ====================================
echo All services starting...
echo ====================================
echo.
echo Backend: http://localhost:5001
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:5001/api-docs
echo.
echo Test Account:
echo Email: test@example.com
echo Password: Test123!
echo.
echo Press any key to exit...
pause >nul