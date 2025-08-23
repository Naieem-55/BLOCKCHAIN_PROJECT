# PowerShell script to start the Supply Chain Traceability System

Write-Host "Starting Supply Chain Traceability System..." -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan

# Check if Node.js is installed
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "ERROR: Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}
Write-Host "Node.js version: $nodeVersion" -ForegroundColor Gray

# Function to start process in new window
function Start-ProcessInNewWindow {
    param(
        [string]$Name,
        [string]$WorkingDirectory,
        [string]$Command
    )
    
    Write-Host "`nStarting $Name..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$WorkingDirectory'; Write-Host 'Starting $Name...' -ForegroundColor Green; $Command" -WindowStyle Normal
}

# 1. Start Ganache (Blockchain)
Write-Host "`n1. Starting Ganache (Local Blockchain)..." -ForegroundColor Cyan
$ganacheInstalled = npm list -g ganache-cli 2>$null
if (-not $ganacheInstalled) {
    Write-Host "Installing Ganache CLI globally..." -ForegroundColor Yellow
    npm install -g ganache-cli
}
Start-ProcessInNewWindow -Name "Ganache" -WorkingDirectory $PSScriptRoot -Command "ganache-cli -p 7545 --deterministic --accounts 10 --host 0.0.0.0"

# Wait for Ganache to start
Start-Sleep -Seconds 5

# 2. Deploy Smart Contracts
Write-Host "`n2. Deploying Smart Contracts..." -ForegroundColor Cyan
Set-Location $PSScriptRoot
npx truffle compile
$migrationResult = npx truffle migrate --reset 2>&1
Write-Host $migrationResult -ForegroundColor Gray

# Extract contract address (simplified - you may need to adjust based on actual output)
$contractAddress = $migrationResult | Select-String -Pattern "0x[a-fA-F0-9]{40}" | Select-Object -First 1
if ($contractAddress) {
    Write-Host "Contract deployed at: $contractAddress" -ForegroundColor Green
}

# 3. Start Backend Server
Write-Host "`n3. Starting Backend Server..." -ForegroundColor Cyan
$backendPath = Join-Path $PSScriptRoot "backend"

# Check if .env exists, if not create it
$envPath = Join-Path $backendPath ".env"
if (-not (Test-Path $envPath)) {
    Write-Host "Creating backend .env file..." -ForegroundColor Yellow
    $envContent = @"
PORT=5000
MONGODB_URI=mongodb://localhost:27017/supply_chain
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
REDIS_URL=redis://localhost:6379
NODE_ENV=development
BLOCKCHAIN_RPC_URL=http://localhost:7545
CONTRACT_ADDRESS=$contractAddress
"@
    Set-Content -Path $envPath -Value $envContent
    Write-Host ".env file created" -ForegroundColor Green
}

# Install backend dependencies if needed
if (-not (Test-Path (Join-Path $backendPath "node_modules"))) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    Set-Location $backendPath
    npm install
}

Start-ProcessInNewWindow -Name "Backend Server" -WorkingDirectory $backendPath -Command "npm run dev"

# 4. Start Frontend
Write-Host "`n4. Starting Frontend Application..." -ForegroundColor Cyan
$frontendPath = Join-Path $PSScriptRoot "frontend"

# Install frontend dependencies if needed
if (-not (Test-Path (Join-Path $frontendPath "node_modules"))) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location $frontendPath
    npm install --legacy-peer-deps
}

Start-ProcessInNewWindow -Name "Frontend" -WorkingDirectory $frontendPath -Command "npm start"

# Wait a bit for services to start
Start-Sleep -Seconds 5

# 5. Display access information
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "Supply Chain System Started Successfully!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "`nAccess Points:" -ForegroundColor Yellow
Write-Host "  Frontend:    http://localhost:3001" -ForegroundColor White
Write-Host "  Backend API: http://localhost:5000" -ForegroundColor White
Write-Host "  API Docs:    http://localhost:5000/api-docs" -ForegroundColor White
Write-Host "  Blockchain:  http://localhost:7545" -ForegroundColor White
Write-Host "`nDefault Credentials:" -ForegroundColor Yellow
Write-Host "  Email:    admin@example.com" -ForegroundColor White
Write-Host "  Password: Admin123!" -ForegroundColor White
Write-Host "`nTo stop all services, close the PowerShell windows" -ForegroundColor Gray
Write-Host "`nPress Enter to open the application in your browser..." -ForegroundColor Cyan
Read-Host

# Open browser
Start-Process "http://localhost:3001"