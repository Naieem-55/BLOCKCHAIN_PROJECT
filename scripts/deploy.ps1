# High-Efficiency Blockchain-Based Supply Chain Traceability
# Windows PowerShell Deployment Script

param(
    [switch]$DevMode,
    [switch]$ProdMode,
    [switch]$Help
)

# Global variables for process management
$Global:GanachePID = $null
$Global:MongoPID = $null
$Global:RedisPID = $null
$Global:BackendPID = $null
$Global:FrontendPID = $null

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Function to check if command exists
function Test-Command {
    param([string]$Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

# Function to check if port is in use
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    }
    catch {
        return $false
    }
}

# Function to kill process by port
function Stop-ProcessByPort {
    param([int]$Port)
    Write-Status "Attempting to free port $Port..."
    try {
        $processes = netstat -ano | Select-String ":$Port " | ForEach-Object {
            $fields = $_ -split '\s+'
            $fields[4]
        }
        foreach ($pid in $processes) {
            if ($pid -and $pid -ne "0") {
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            }
        }
        Start-Sleep -Seconds 2
    }
    catch {
        Write-Warning "Could not kill processes on port $Port"
    }
}

# Function to start process in background
function Start-BackgroundProcess {
    param(
        [string]$Command,
        [string]$Arguments,
        [string]$WorkingDirectory,
        [string]$LogFile,
        [string]$ProcessName
    )
    
    Write-Status "Starting $ProcessName..."
    try {
        $processInfo = New-Object System.Diagnostics.ProcessStartInfo
        $processInfo.FileName = $Command
        $processInfo.Arguments = $Arguments
        $processInfo.WorkingDirectory = $WorkingDirectory
        $processInfo.RedirectStandardOutput = $true
        $processInfo.RedirectStandardError = $true
        $processInfo.UseShellExecute = $false
        $processInfo.CreateNoWindow = $true
        
        $process = New-Object System.Diagnostics.Process
        $process.StartInfo = $processInfo
        $process.Start() | Out-Null
        
        return $process
    }
    catch {
        Write-Error "Failed to start $ProcessName`: $_"
        return $null
    }
}

# Check prerequisites
function Test-Prerequisites {
    Write-Status "Checking prerequisites..."
    
    # Check Node.js
    if (-not (Test-Command "node")) {
        Write-Error "Node.js is not installed. Please install Node.js v16 or higher."
        Write-Status "Download from: https://nodejs.org/"
        exit 1
    }
    
    $nodeVersion = (node --version) -replace 'v', '' -split '\.' | Select-Object -First 1
    if ([int]$nodeVersion -lt 16) {
        Write-Error "Node.js version must be 16 or higher. Current version: $(node --version)"
        exit 1
    }
    Write-Success "Node.js $(node --version) found"
    
    # Check npm
    if (-not (Test-Command "npm")) {
        Write-Error "npm is not installed. Please install npm."
        exit 1
    }
    Write-Success "npm $(npm --version) found"
    
    # Check Git
    if (-not (Test-Command "git")) {
        Write-Warning "Git is not installed. Some features may not work properly."
    }
    else {
        Write-Success "Git found"
    }
    
    # Check if we're in the right directory
    if (-not (Test-Path "package.json")) {
        Write-Error "package.json not found. Please run this script from the project root directory."
        exit 1
    }
    
    Write-Success "All prerequisites met"
}

# Install dependencies
function Install-Dependencies {
    Write-Status "Installing dependencies..."
    
    # Install global dependencies
    Write-Status "Installing global dependencies..."
    try {
        npm install -g ganache-cli truffle nodemon concurrently 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Failed to install some global packages. Trying with --force..."
            npm install -g ganache-cli truffle nodemon concurrently --force
        }
        Write-Success "Global dependencies installed"
    }
    catch {
        Write-Error "Failed to install global dependencies. Please run as administrator."
        exit 1
    }
    
    # Root dependencies
    Write-Status "Installing root dependencies..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install root dependencies"
        exit 1
    }
    Write-Success "Root dependencies installed"
    
    # Backend dependencies
    if (Test-Path "backend") {
        Write-Status "Installing backend dependencies..."
        Push-Location backend
        npm install
        if ($LASTEXITCODE -ne 0) {
            Pop-Location
            Write-Error "Failed to install backend dependencies"
            exit 1
        }
        Pop-Location
        Write-Success "Backend dependencies installed"
    }
    
    # Frontend dependencies
    if (Test-Path "frontend") {
        Write-Status "Installing frontend dependencies..."
        Push-Location frontend
        npm install
        if ($LASTEXITCODE -ne 0) {
            Pop-Location
            Write-Error "Failed to install frontend dependencies"
            exit 1
        }
        Pop-Location
        Write-Success "Frontend dependencies installed"
    }
    
    Write-Success "All dependencies installed successfully"
}

# Setup environment files
function Initialize-Environment {
    Write-Status "Setting up environment files..."
    
    # Create necessary directories
    New-Item -ItemType Directory -Force -Path "backend\logs" | Out-Null
    New-Item -ItemType Directory -Force -Path "data\db" | Out-Null
    New-Item -ItemType Directory -Force -Path "uploads" | Out-Null
    
    # Backend environment
    if (-not (Test-Path "backend\.env")) {
        Write-Status "Creating backend environment file..."
        if (Test-Path "backend\.env.example") {
            Copy-Item "backend\.env.example" "backend\.env"
        }
        else {
            # Create basic .env file
            $envContent = @"
# Server Configuration
NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000

# Frontend Configuration
FRONTEND_URL=http://localhost:3000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/supply_chain_traceability

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Blockchain Configuration
WEB3_PROVIDER_URL=http://localhost:8545
NETWORK_ID=1337
CONTRACT_OWNER_PRIVATE_KEY=0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_$((Get-Date).Ticks)
JWT_EXPIRES_IN=7d
JWT_COOKIE_EXPIRES_IN=7

# Logging Configuration
LOG_LEVEL=info

# Development Configuration
DEBUG=true
ENABLE_SWAGGER=true
"@
            $envContent | Out-File -FilePath "backend\.env" -Encoding UTF8
        }
        Write-Success "Backend .env file created"
    }
    else {
        Write-Success "Backend .env file already exists"
    }
    
    # Frontend environment
    if (-not (Test-Path "frontend\.env.local")) {
        Write-Status "Creating frontend environment file..."
        $frontendEnv = @"
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_WEB3_PROVIDER_URL=http://localhost:8545
REACT_APP_NETWORK_ID=1337
"@
        $frontendEnv | Out-File -FilePath "frontend\.env.local" -Encoding UTF8
        Write-Success "Frontend .env.local file created"
    }
    else {
        Write-Success "Frontend .env.local file already exists"
    }
}

# Start MongoDB (if available)
function Start-MongoDB {
    Write-Status "Checking MongoDB..."
    
    if (Test-Command "mongod") {
        if (-not (Test-Port 27017)) {
            Write-Status "Starting MongoDB..."
            New-Item -ItemType Directory -Force -Path "data\db" | Out-Null
            $Global:MongoPID = Start-BackgroundProcess "mongod" "--dbpath .\data\db --port 27017" $PWD "backend\logs\mongodb.log" "MongoDB"
            Start-Sleep -Seconds 3
            if (Test-Port 27017) {
                Write-Success "MongoDB started successfully"
            }
            else {
                Write-Warning "MongoDB may not have started properly"
            }
        }
        else {
            Write-Success "MongoDB is already running"
        }
    }
    else {
        Write-Warning "MongoDB not found. Using in-memory database fallback."
    }
}

# Start Redis (if available)
function Start-Redis {
    Write-Status "Checking Redis..."
    
    if (Test-Command "redis-server") {
        if (-not (Test-Port 6379)) {
            Write-Status "Starting Redis..."
            $Global:RedisPID = Start-BackgroundProcess "redis-server" "--port 6379" $PWD "backend\logs\redis.log" "Redis"
            Start-Sleep -Seconds 2
            if (Test-Port 6379) {
                Write-Success "Redis started successfully"
            }
            else {
                Write-Warning "Redis may not have started properly"
            }
        }
        else {
            Write-Success "Redis is already running"
        }
    }
    else {
        Write-Warning "Redis not found. Caching will be disabled."
    }
}

# Start blockchain
function Start-Blockchain {
    Write-Status "Starting local blockchain..."
    
    # Kill any existing process on port 8545
    if (Test-Port 8545) {
        Write-Warning "Port 8545 is in use. Attempting to free it..."
        Stop-ProcessByPort 8545
    }
    
    Write-Status "Starting Ganache CLI..."
    $ganacheArgs = "--deterministic --accounts 10 --host 0.0.0.0 --port 8545 --networkId 1337 --gasLimit 8000000 --gasPrice 20000000000"
    $Global:GanachePID = Start-BackgroundProcess "ganache-cli" $ganacheArgs $PWD "backend\logs\ganache.log" "Ganache"
    
    # Wait for Ganache to start
    Write-Status "Waiting for blockchain to initialize..."
    $timeout = 30
    for ($i = 1; $i -le $timeout; $i++) {
        if (Test-Port 8545) {
            Write-Success "Ganache CLI started successfully"
            return
        }
        Start-Sleep -Seconds 1
    }
    
    Write-Error "Ganache failed to start within $timeout seconds"
    exit 1
}

# Deploy smart contracts
function Deploy-Contracts {
    Write-Status "Deploying smart contracts..."
    
    # Check if truffle-config.js exists, create if not
    if (-not (Test-Path "truffle-config.js")) {
        Write-Status "Creating truffle-config.js..."
        $truffleConfig = @"
module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "1337",
      gas: 6721975,
      gasPrice: 20000000000,
    },
  },
  compilers: {
    solc: {
      version: "0.8.19",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  }
};
"@
        $truffleConfig | Out-File -FilePath "truffle-config.js" -Encoding UTF8
    }
    
    # Compile contracts
    Write-Status "Compiling contracts..."
    npx truffle compile
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Contract compilation failed"
        exit 1
    }
    Write-Success "Contracts compiled successfully"
    
    # Deploy contracts
    Write-Status "Deploying contracts to local network..."
    npx truffle migrate --network development --reset
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Contract deployment failed"
        exit 1
    }
    Write-Success "Contracts deployed successfully"
    
    # Verify deployment
    Write-Status "Verifying contract deployment..."
    if ((Test-Path "build\contracts") -and (Get-ChildItem "build\contracts" | Measure-Object).Count -gt 0) {
        Write-Success "Contract artifacts generated successfully"
    }
    else {
        Write-Error "Contract deployment verification failed"
        exit 1
    }
}

# Start backend server
function Start-Backend {
    Write-Status "Starting backend server..."
    
    if (-not (Test-Path "backend")) {
        Write-Error "Backend directory not found"
        exit 1
    }
    
    # Kill any existing process on port 5000
    if (Test-Port 5000) {
        Write-Warning "Port 5000 is in use. Attempting to free it..."
        Stop-ProcessByPort 5000
    }
    
    Push-Location backend
    $Global:BackendPID = Start-BackgroundProcess "npm" "run dev" $PWD "..\backend\logs\backend.log" "Backend Server"
    Pop-Location
    
    # Wait for backend to start
    Write-Status "Waiting for backend server to initialize..."
    $timeout = 60
    for ($i = 1; $i -le $timeout; $i++) {
        if (Test-Port 5000) {
            Write-Success "Backend server started successfully"
            return
        }
        Start-Sleep -Seconds 1
    }
    
    Write-Error "Backend server failed to start within $timeout seconds"
    Write-Error "Check backend\logs\backend.log for details"
    exit 1
}

# Start frontend application
function Start-Frontend {
    Write-Status "Starting frontend application..."
    
    if (-not (Test-Path "frontend")) {
        Write-Error "Frontend directory not found"
        exit 1
    }
    
    # Kill any existing process on port 3000
    if (Test-Port 3000) {
        Write-Warning "Port 3000 is in use. Attempting to free it..."
        Stop-ProcessByPort 3000
    }
    
    Push-Location frontend
    $Global:FrontendPID = Start-BackgroundProcess "npm" "start" $PWD "..\backend\logs\frontend.log" "Frontend Application"
    Pop-Location
    
    # Wait for frontend to start
    Write-Status "Waiting for frontend application to initialize..."
    $timeout = 90
    for ($i = 1; $i -le $timeout; $i++) {
        if (Test-Port 3000) {
            Write-Success "Frontend application started successfully"
            return
        }
        Start-Sleep -Seconds 1
    }
    
    Write-Error "Frontend application failed to start within $timeout seconds"
    Write-Error "Check backend\logs\frontend.log for details"
    exit 1
}

# Health check
function Test-Health {
    Write-Status "Performing health checks..."
    
    $allHealthy = $true
    
    # Check blockchain
    if (Test-Port 8545) {
        Write-Success "✓ Blockchain (Ganache) is running on port 8545"
    }
    else {
        Write-Error "✗ Blockchain is not accessible"
        $allHealthy = $false
    }
    
    # Check backend
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Success "✓ Backend API is healthy on port 5000"
        }
        else {
            Write-Warning "⚠ Backend health check failed (may still be starting)"
        }
    }
    catch {
        if (Test-Port 5000) {
            Write-Success "✓ Backend is running on port 5000"
        }
        else {
            Write-Error "✗ Backend is not accessible"
            $allHealthy = $false
        }
    }
    
    # Check frontend
    if (Test-Port 3000) {
        Write-Success "✓ Frontend is running on port 3000"
    }
    else {
        Write-Error "✗ Frontend is not accessible"
        $allHealthy = $false
    }
    
    # Check databases
    if (Test-Port 27017) {
        Write-Success "✓ MongoDB is running on port 27017"
    }
    else {
        Write-Warning "⚠ MongoDB is not running (using fallback)"
    }
    
    if (Test-Port 6379) {
        Write-Success "✓ Redis is running on port 6379"
    }
    else {
        Write-Warning "⚠ Redis is not running (caching disabled)"
    }
    
    return $allHealthy
}

# Cleanup function
function Stop-AllProcesses {
    Write-Status "Cleaning up processes..."
    
    # Kill Node.js processes
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    
    # Kill specific processes if we have their IDs
    if ($Global:FrontendPID) { $Global:FrontendPID.Kill() }
    if ($Global:BackendPID) { $Global:BackendPID.Kill() }
    if ($Global:GanachePID) { $Global:GanachePID.Kill() }
    if ($Global:MongoPID) { $Global:MongoPID.Kill() }
    if ($Global:RedisPID) { $Global:RedisPID.Kill() }
    
    # Cleanup ports
    Stop-ProcessByPort 3000
    Stop-ProcessByPort 5000
    Stop-ProcessByPort 8545
    
    Write-Status "Cleanup completed"
}

# Show usage information
function Show-Usage {
    Write-Host "High-Efficiency Blockchain-Based Supply Chain Traceability"
    Write-Host "Windows PowerShell Deployment Script"
    Write-Host ""
    Write-Host "Usage: .\deploy.ps1 [options]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -DevMode      Start in development mode"
    Write-Host "  -ProdMode     Start in production mode"
    Write-Host "  -Help         Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\deploy.ps1              # Full deployment"
    Write-Host "  .\deploy.ps1 -DevMode     # Development mode"
    Write-Host "  .\deploy.ps1 -ProdMode    # Production mode"
    Write-Host ""
}

# Main deployment function
function Start-Deployment {
    Write-Status "Starting High-Efficiency Blockchain-Based Supply Chain Traceability deployment..."
    Write-Host ""
    
    # Platform detection
    Write-Status "Detected platform: Windows PowerShell"
    
    Test-Prerequisites
    Install-Dependencies
    Initialize-Environment
    Start-MongoDB
    Start-Redis
    Start-Blockchain
    Deploy-Contracts
    Start-Backend
    Start-Frontend
    
    # Wait for all services to stabilize
    Write-Status "Waiting for all services to stabilize..."
    Start-Sleep -Seconds 10
    
    if (Test-Health) {
        Write-Host ""
        Write-Success "🎉 Deployment completed successfully!"
        Write-Host ""
        Write-Host "📊 Application URLs:"
        Write-Host "   Frontend:        http://localhost:3000"
        Write-Host "   Backend API:     http://localhost:5000/api"
        Write-Host "   API Docs:        http://localhost:5000/api-docs"
        Write-Host "   Health Check:    http://localhost:5000/health"
        Write-Host ""
        Write-Host "🔗 Blockchain:"
        Write-Host "   RPC URL:         http://localhost:8545"
        Write-Host "   Network ID:      1337"
        Write-Host "   Chain ID:        1337"
        Write-Host ""
        Write-Host "📝 Next Steps:"
        Write-Host "   1. Open http://localhost:3000 in your browser"
        Write-Host "   2. Configure MetaMask:"
        Write-Host "      - Network Name: Local Ganache"
        Write-Host "      - RPC URL: http://localhost:8545"
        Write-Host "      - Chain ID: 1337"
        Write-Host "      - Currency Symbol: ETH"
        Write-Host "   3. Import a Ganache account to MetaMask using one of the private keys"
        Write-Host "   4. Start using the application!"
        Write-Host ""
        Write-Host "📋 Test Accounts (Private Keys):"
        Write-Host "   Account 0: 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3"
        Write-Host "   Account 1: 0xae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f"
        Write-Host ""
        Write-Host "🛑 To stop all services, press Ctrl+C"
        Write-Host ""
        
        # Keep script running with monitoring
        Write-Status "All services are running. Press Ctrl+C to stop..."
        try {
            while ($true) {
                Start-Sleep -Seconds 10
                # Basic health monitoring
                if (-not (Test-Port 3000) -or -not (Test-Port 5000) -or -not (Test-Port 8545)) {
                    Write-Warning "One or more services may have stopped. Check the logs."
                    Write-Status "Frontend:  $(if (Test-Port 3000) { '✓ Running' } else { '✗ Stopped' })"
                    Write-Status "Backend:   $(if (Test-Port 5000) { '✓ Running' } else { '✗ Stopped' })"
                    Write-Status "Blockchain: $(if (Test-Port 8545) { '✓ Running' } else { '✗ Stopped' })"
                }
            }
        }
        finally {
            Stop-AllProcesses
        }
    }
    else {
        Write-Error "❌ Deployment failed during health checks"
        Write-Host ""
        Write-Host "🔍 Troubleshooting:"
        Write-Host "   - Check log files in backend\logs\"
        Write-Host "   - Ensure all required ports are available"
        Write-Host "   - Verify Node.js version is 16 or higher"
        Write-Host "   - Try running the script as administrator"
        Write-Host ""
        exit 1
    }
}

# Development mode (lighter setup)
function Start-DevMode {
    Write-Status "Starting in development mode (faster startup)..."
    
    Test-Prerequisites
    Initialize-Environment
    Start-Blockchain
    Deploy-Contracts
    
    Write-Success "Development environment ready!"
    Write-Host ""
    Write-Host "🚀 Quick start commands:"
    Write-Host "   Backend:  cd backend && npm run dev"
    Write-Host "   Frontend: cd frontend && npm start"
    Write-Host ""
}

# Handle Ctrl+C gracefully
$null = Register-EngineEvent PowerShell.Exiting -Action {
    Stop-AllProcesses
}

# Main script logic
if ($Help) {
    Show-Usage
    exit 0
}
elseif ($DevMode) {
    Start-DevMode
}
elseif ($ProdMode) {
    $env:NODE_ENV = "production"
    Start-Deployment
}
else {
    Start-Deployment
}