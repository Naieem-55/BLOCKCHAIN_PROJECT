# High-Efficiency Blockchain-Based Supply Chain Traceability
# Windows PowerShell Deployment Script

param(
    [switch]$DevMode,
    [switch]$ProdMode,
    [switch]$Help
)

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

function Write-ErrorMsg {
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
            $fields[-1]
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

# Check prerequisites
function Test-Prerequisites {
    Write-Status "Checking prerequisites..."
    
    # Check Node.js
    if (-not (Test-Command "node")) {
        Write-ErrorMsg "Node.js is not installed. Please install Node.js v16 or higher."
        Write-Status "Download from: https://nodejs.org/"
        exit 1
    }
    
    $nodeMajor = ((node --version) -replace 'v', '' -split '\.')[0]
    if ([int]$nodeMajor -lt 16) {
        Write-ErrorMsg "Node.js version must be 16 or higher. Current version: $(node --version)"
        exit 1
    }
    Write-Success "Node.js $(node --version) found"
    
    # Check npm
    if (-not (Test-Command "npm")) {
        Write-ErrorMsg "npm is not installed. Please install npm."
        exit 1
    }
    Write-Success "npm $(npm --version) found"
    
    # Check if we're in the right directory
    if (-not (Test-Path "package.json")) {
        Write-ErrorMsg "package.json not found. Please run this script from the project root directory."
        exit 1
    }
    
    Write-Success "All prerequisites met"
}

# Install dependencies
function Install-Dependencies {
    Write-Status "Installing dependencies..."
    
    # Install global dependencies only if missing (avoid EEXIST/EPERM)
    Write-Status "Installing global dependencies..."
    $packages = @(
        @{ name = "truffle";       cmd = "truffle" },
        @{ name = "ganache-cli";   cmd = "ganache-cli" },
        @{ name = "nodemon";       cmd = "nodemon" },
        @{ name = "concurrently";  cmd = "concurrently" }
    )
    foreach ($pkg in $packages) {
        if (-not (Test-Command $pkg.cmd)) {
            Write-Status "Installing $($pkg.name)..."
            npm install -g $pkg.name
            if ($LASTEXITCODE -ne 0) {
                Write-Warning "Failed to install $($pkg.name). Continuing..."
            } else {
                Write-Success "$($pkg.name) installed"
            }
        } else {
            Write-Status "$($pkg.name) already installed; skipping"
        }
    }
    Write-Success "Global dependencies step completed"
    
    # Root dependencies
    Write-Status "Installing root dependencies..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-ErrorMsg "Failed to install root dependencies"
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
            Write-ErrorMsg "Failed to install backend dependencies"
            exit 1
        }
        Pop-Location
        Write-Success "Backend dependencies installed"
    }
    
    # Frontend dependencies (use legacy peer deps to avoid ERESOLVE with react-scripts)
    if (Test-Path "frontend") {
        Write-Status "Installing frontend dependencies..."
        Push-Location frontend
        npm install --legacy-peer-deps
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Retrying frontend install with --force"
            npm install --legacy-peer-deps --force
            if ($LASTEXITCODE -ne 0) {
                Pop-Location
                Write-ErrorMsg "Failed to install frontend dependencies"
                exit 1
            }
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
        $envContent = @'
NODE_ENV=development
PORT=5002
API_URL=http://localhost:5002
FRONTEND_URL=http://localhost:3001
MONGODB_URI=mongodb://localhost:27017/supply_chain_traceability
REDIS_URL=redis://localhost:6379
WEB3_PROVIDER_URL=http://localhost:8545
NETWORK_ID=1337
CONTRACT_OWNER_PRIVATE_KEY=0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d
LOG_LEVEL=info
DEBUG=true
ENABLE_SWAGGER=true
'@
        $envContent | Out-File -FilePath "backend\.env" -Encoding UTF8
        Write-Success "Backend .env file created"
    }
    else {
        Write-Success "Backend .env file already exists"
    }
    
    # Frontend environment
    if (-not (Test-Path "frontend\.env.local")) {
        Write-Status "Creating frontend environment file..."
        $frontendEnv = @'
REACT_APP_API_URL=http://localhost:5002/api
REACT_APP_WEB3_PROVIDER_URL=http://localhost:8545
REACT_APP_NETWORK_ID=1337
'@
        $frontendEnv | Out-File -FilePath "frontend\.env.local" -Encoding UTF8
        Write-Success "Frontend .env.local file created"
    }
    else {
        Write-Success "Frontend .env.local file already exists"
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
    
    # Build command line for Ganache (try ganache-cli, then ganache, then npx)
    $legacyArgs = "--deterministic --accounts 10 --host 127.0.0.1 --port 8545 --networkId 1337 --gasLimit 8000000 --gasPrice 20000000000"
    $modernArgs = "--wallet.deterministic --wallet.totalAccounts 10 --host 127.0.0.1 --port 8545 --chain.networkId 1337 --miner.blockGasLimit 8000000 --miner.defaultGasPrice 20000000000"
    if (Test-Command "ganache-cli") {
        $cmdLine = "ganache-cli $legacyArgs"
    } elseif (Test-Command "ganache") {
        $cmdLine = "ganache $modernArgs"
    } else {
        $cmdLine = "npx ganache-cli $legacyArgs"
    }

    Write-Status "Starting Ganache..."
    # Launch in a visible window that stays open
    Start-Process -FilePath "cmd" -ArgumentList "/k", $cmdLine -WindowStyle Normal
    
    # Wait for Ganache to start
    Write-Status "Waiting for blockchain to initialize..."
    $timeout = 90
    for ($i = 1; $i -le $timeout; $i++) {
        if (Test-Port 8545) {
            Write-Success "Ganache started successfully"
            return
        }
        Start-Sleep -Seconds 1
    }
    
    Write-ErrorMsg "Ganache failed to start within $timeout seconds"
    exit 1
}

function Ensure-TruffleSecret {
    $secretPath = Join-Path (Get-Location) ".secret"
    if (-not (Test-Path $secretPath)) {
        Write-Status "Creating .secret for Truffle (dev mnemonic)..."
        $mnemonic = "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat"
        $mnemonic | Set-Content -Path $secretPath -Encoding ASCII
        Write-Success ".secret created"
    } else {
        Write-Status ".secret already exists; skipping"
    }
}

# Deploy smart contracts
function Deploy-Contracts {
    Write-Status "Deploying smart contracts..."

    # Ensure Truffle's .secret exists so truffle-config.js can read it
    Ensure-TruffleSecret
    
    # Check if truffle-config.js exists, create if not
    if (-not (Test-Path "truffle-config.js")) {
        Write-Status "Creating truffle-config.js..."
        $truffleConfig = @'
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
'@
        $truffleConfig | Out-File -FilePath "truffle-config.js" -Encoding UTF8
    }
    
    # Compile contracts
    Write-Status "Compiling contracts..."
    npx truffle compile
    if ($LASTEXITCODE -ne 0) {
        Write-ErrorMsg "Contract compilation failed"
        exit 1
    }
    Write-Success "Contracts compiled successfully"
    
    # Deploy contracts
    Write-Status "Deploying contracts to local network..."
    npx truffle migrate --network development --reset
    if ($LASTEXITCODE -ne 0) {
        Write-ErrorMsg "Contract deployment failed"
        exit 1
    }
    Write-Success "Contracts deployed successfully"
}

# Start backend server
function Start-Backend {
    Write-Status "Starting backend server..."
    
    if (-not (Test-Path "backend")) {
        Write-ErrorMsg "Backend directory not found"
        exit 1
    }
    
    # Kill any existing process on port 5002
    if (Test-Port 5002) {
        Write-Warning "Port 5002 is in use. Attempting to free it..."
        Stop-ProcessByPort 5002
    }
    
    Write-Status "Starting backend in new window..."
    Start-Process -FilePath "cmd" -ArgumentList '/k', 'cd backend && npm run dev' -WindowStyle Normal
    
    # Wait for backend to start
    Write-Status "Waiting for backend server to initialize..."
    $timeout = 60
    for ($i = 1; $i -le $timeout; $i++) {
        if (Test-Port 5002) {
            Write-Success "Backend server started successfully"
            return
        }
        Start-Sleep -Seconds 1
    }
    
    Write-Warning "Backend server may still be starting..."
}

# Start frontend application
function Start-Frontend {
    Write-Status "Starting frontend application..."
    
    if (-not (Test-Path "frontend")) {
        Write-ErrorMsg "Frontend directory not found"
        exit 1
    }
    
    # Kill any existing process on port 3001
    if (Test-Port 3001) {
        Write-Warning "Port 3001 is in use. Attempting to free it..."
        Stop-ProcessByPort 3001
    }
    
    Write-Status "Starting frontend in new window..."
    Start-Process -FilePath "cmd" -ArgumentList '/k', 'cd frontend && npm start' -WindowStyle Normal
    
    # Wait for frontend to start
    Write-Status "Waiting for frontend application to initialize..."
    $timeout = 90
    for ($i = 1; $i -le $timeout; $i++) {
        if (Test-Port 3001) {
            Write-Success "Frontend application started successfully"
            return
        }
        Start-Sleep -Seconds 1
    }
    
    Write-Warning "Frontend application may still be starting..."
}

# Health check
function Test-Health {
    Write-Status "Performing health checks..."
    
    $allHealthy = $true
    
    # Check blockchain
    if (Test-Port 8545) {
        Write-Success "OK Blockchain (Ganache) is running on port 8545"
    }
    else {
        Write-ErrorMsg "FAIL Blockchain is not accessible"
        $allHealthy = $false
    }
    
    # Check backend
    if (Test-Port 5002) {
        Write-Success "OK Backend is running on port 5002"
    }
    else {
        Write-ErrorMsg "FAIL Backend is not accessible"
        $allHealthy = $false
    }
    
    # Check frontend
    if (Test-Port 3001) {
        Write-Success "OK Frontend is running on port 3001"
    }
    else {
        Write-ErrorMsg "FAIL Frontend is not accessible"
        $allHealthy = $false
    }
    
    return $allHealthy
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
    
    Write-Status "Detected platform: Windows PowerShell"
    
    Test-Prerequisites
    Install-Dependencies
    Initialize-Environment
    Start-Blockchain
    Deploy-Contracts
    Start-Backend
    Start-Frontend
    
    # Wait for all services to stabilize
    Write-Status "Waiting for all services to stabilize..."
    Start-Sleep -Seconds 10
    
    if (Test-Health) {
        Write-Host ""
        Write-Success "Deployment completed successfully!"
        Write-Host ""
        Write-Host "Application URLs:"
        Write-Host "   Frontend:        http://localhost:3001"
        Write-Host "   Backend API:     http://localhost:5002/api"
        Write-Host "   API Docs:        http://localhost:5002/api-docs"
        Write-Host "   Health Check:    http://localhost:5002/health"
        Write-Host ""
        Write-Host "Blockchain:"
        Write-Host "   RPC URL:         http://localhost:8545"
        Write-Host "   Network ID:      1337"
        Write-Host "   Chain ID:        1337"
        Write-Host ""
        Write-Host "Next Steps:"
        Write-Host "   1. Open http://localhost:3001 in your browser"
        Write-Host "   2. Configure MetaMask:"
        Write-Host "      - Network Name: Local Ganache"
        Write-Host "      - RPC URL: http://localhost:8545"
        Write-Host "      - Chain ID: 1337"
        Write-Host "      - Currency Symbol: ETH"
        Write-Host "   3. Import a Ganache account to MetaMask using private key:"
        Write-Host "      0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3"
        Write-Host "   4. Start using the application!"
        Write-Host ""
        Write-Host "To stop services: Close the individual service windows"
        Write-Host ""
        
        # Keep script running
        Write-Status "All services are running. Press Ctrl+C to stop..."
        try {
            while ($true) {
                Start-Sleep -Seconds 10
                if (-not (Test-Port 3001) -or -not (Test-Port 5002) -or -not (Test-Port 8545)) {
                    Write-Warning "One or more services may have stopped. Check the service windows."
                }
            }
        }
        finally {
            Write-Status "Stopping services..."
        }
    }
    else {
        Write-ErrorMsg "Deployment failed during health checks"
        Write-Host ""
        Write-Host "Troubleshooting:"
        Write-Host "   - Ensure all required ports are available"
        Write-Host "   - Verify Node.js version is 16 or higher"
        Write-Host "   - Allow Ganache if Windows Firewall prompts"
        Write-Host "   - Try running as administrator"
        Write-Host ""
        exit 1
    }
}

# Development mode
function Start-DevMode {
    Write-Status "Starting in development mode..."
    
    Test-Prerequisites
    Initialize-Environment
    Start-Blockchain
    Deploy-Contracts
    
    Write-Success "Development environment ready!"
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "   1. Open new terminal: cd backend; npm run dev"
    Write-Host "   2. Open new terminal: cd frontend; npm start"
    Write-Host ""
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