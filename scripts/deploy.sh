#!/bin/bash

# High-Efficiency Blockchain-Based Supply Chain Traceability
# Cross-Platform Deployment Script (Windows/Unix/Linux/Mac Compatible)

set -e

# Colors for output (Windows compatible)
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
    # Windows - no colors for better compatibility
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    NC=''
else
    # Unix/Linux/Mac - with colors
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m'
fi

# Global variables for process management
GANACHE_PID=""
MONGO_PID=""
REDIS_PID=""
BACKEND_PID=""
FRONTEND_PID=""

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is in use
port_in_use() {
    local port=$1
    if command_exists netstat; then
        netstat -an | grep -q ":$port "
    elif command_exists ss; then
        ss -tuln | grep -q ":$port "
    else
        # Fallback for Windows
        if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
            netstat -an | findstr ":$port " >/dev/null 2>&1
        else
            return 1
        fi
    fi
}

# Function to kill process by port (cross-platform)
kill_process_by_port() {
    local port=$1
    print_status "Attempting to free port $port..."
    
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
        # Windows
        for /f "tokens=5" %a in ('netstat -aon ^| findstr :$port') do taskkill /f /pid %a 2>/dev/null || true
    else
        # Unix/Linux/Mac
        if command_exists lsof; then
            lsof -ti:$port | xargs kill -9 2>/dev/null || true
        elif command_exists fuser; then
            fuser -k $port/tcp 2>/dev/null || true
        fi
    fi
    sleep 2
}

# Function to start process in background (cross-platform)
start_background_process() {
    local command="$1"
    local log_file="$2"
    local process_name="$3"
    
    print_status "Starting $process_name..."
    
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
        # Windows - use start command
        cmd //c "start /B $command > $log_file 2>&1"
    else
        # Unix/Linux/Mac
        eval "$command" > "$log_file" 2>&1 &
        echo $!
    fi
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Node.js
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js v16 or higher."
        print_status "Download from: https://nodejs.org/"
        exit 1
    fi
    
    local node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 16 ]; then
        print_error "Node.js version must be 16 or higher. Current version: $(node --version)"
        exit 1
    fi
    print_success "Node.js $(node --version) found"
    
    # Check npm
    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    print_success "npm $(npm --version) found"
    
    # Check Git
    if ! command_exists git; then
        print_warning "Git is not installed. Some features may not work properly."
    else
        print_success "Git $(git --version | cut -d' ' -f3) found"
    fi
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Please run this script from the project root directory."
        exit 1
    fi
    
    print_success "All prerequisites met"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install global dependencies
    print_status "Installing global dependencies..."
    npm install -g ganache-cli truffle nodemon concurrently 2>/dev/null || {
        print_warning "Failed to install some global packages. Trying with --force..."
        npm install -g ganache-cli truffle nodemon concurrently --force 2>/dev/null || {
            print_error "Failed to install global dependencies. Please run as administrator/sudo."
            exit 1
        }
    }
    print_success "Global dependencies installed"
    
    # Root dependencies
    print_status "Installing root dependencies..."
    npm install || {
        print_error "Failed to install root dependencies"
        exit 1
    }
    print_success "Root dependencies installed"
    
    # Backend dependencies
    if [ -d "backend" ]; then
        print_status "Installing backend dependencies..."
        cd backend
        npm install || {
            print_error "Failed to install backend dependencies"
            exit 1
        }
        cd ..
        print_success "Backend dependencies installed"
    fi
    
    # Frontend dependencies
    if [ -d "frontend" ]; then
        print_status "Installing frontend dependencies..."
        cd frontend
        npm install || {
            print_error "Failed to install frontend dependencies"
            exit 1
        }
        cd ..
        print_success "Frontend dependencies installed"
    fi
    
    print_success "All dependencies installed successfully"
}

# Setup environment files
setup_environment() {
    print_status "Setting up environment files..."
    
    # Create necessary directories
    mkdir -p backend/logs
    mkdir -p data/db
    mkdir -p uploads
    
    # Backend environment
    if [ ! -f "backend/.env" ]; then
        print_status "Creating backend environment file..."
        if [ -f "backend/.env.example" ]; then
            cp backend/.env.example backend/.env
        else
            # Create basic .env file
            cat > backend/.env << EOF
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
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_$(date +%s)
JWT_EXPIRES_IN=7d
JWT_COOKIE_EXPIRES_IN=7

# Logging Configuration
LOG_LEVEL=info

# Development Configuration
DEBUG=true
ENABLE_SWAGGER=true
EOF
        fi
        print_success "Backend .env file created"
    else
        print_success "Backend .env file already exists"
    fi
    
    # Frontend environment
    if [ ! -f "frontend/.env.local" ]; then
        print_status "Creating frontend environment file..."
        cat > frontend/.env.local << EOF
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_WEB3_PROVIDER_URL=http://localhost:8545
REACT_APP_NETWORK_ID=1337
EOF
        print_success "Frontend .env.local file created"
    else
        print_success "Frontend .env.local file already exists"
    fi
}

# Start MongoDB (if available)
start_mongodb() {
    print_status "Checking MongoDB..."
    
    if command_exists mongod; then
        if ! port_in_use 27017; then
            print_status "Starting MongoDB..."
            mkdir -p data/db
            start_background_process "mongod --dbpath ./data/db --port 27017" "backend/logs/mongodb.log" "MongoDB"
            sleep 3
            if port_in_use 27017; then
                print_success "MongoDB started successfully"
            else
                print_warning "MongoDB may not have started properly"
            fi
        else
            print_success "MongoDB is already running"
        fi
    else
        print_warning "MongoDB not found. Using in-memory database fallback."
        # Update backend .env to use in-memory database
        if [ -f "backend/.env" ]; then
            sed -i.bak 's|MONGODB_URI=.*|MONGODB_URI=memory://localhost/supply_chain_traceability|' backend/.env
        fi
    fi
}

# Start Redis (if available)
start_redis() {
    print_status "Checking Redis..."
    
    if command_exists redis-server; then
        if ! port_in_use 6379; then
            print_status "Starting Redis..."
            start_background_process "redis-server --port 6379" "backend/logs/redis.log" "Redis"
            sleep 2
            if port_in_use 6379; then
                print_success "Redis started successfully"
            else
                print_warning "Redis may not have started properly"
            fi
        else
            print_success "Redis is already running"
        fi
    else
        print_warning "Redis not found. Caching will be disabled."
    fi
}

# Start blockchain
start_blockchain() {
    print_status "Starting local blockchain..."
    
    # Kill any existing process on port 8545
    if port_in_use 8545; then
        print_warning "Port 8545 is in use. Attempting to free it..."
        kill_process_by_port 8545
    fi
    
    print_status "Starting Ganache CLI..."
    GANACHE_CMD="ganache-cli --deterministic --accounts 10 --host 0.0.0.0 --port 8545 --networkId 1337 --gasLimit 8000000 --gasPrice 20000000000"
    GANACHE_PID=$(start_background_process "$GANACHE_CMD" "backend/logs/ganache.log" "Ganache")
    
    # Wait for Ganache to start
    print_status "Waiting for blockchain to initialize..."
    for i in {1..30}; do
        if port_in_use 8545; then
            print_success "Ganache CLI started successfully"
            break
        fi
        sleep 1
        if [ $i -eq 30 ]; then
            print_error "Ganache failed to start within 30 seconds"
            exit 1
        fi
    done
}

# Deploy smart contracts
deploy_contracts() {
    print_status "Deploying smart contracts..."
    
    # Check if truffle-config.js exists, create if not
    if [ ! -f "truffle-config.js" ]; then
        print_status "Creating truffle-config.js..."
        cat > truffle-config.js << EOF
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
EOF
    fi
    
    # Compile contracts
    print_status "Compiling contracts..."
    npx truffle compile || {
        print_error "Contract compilation failed"
        exit 1
    }
    print_success "Contracts compiled successfully"
    
    # Deploy contracts
    print_status "Deploying contracts to local network..."
    npx truffle migrate --network development --reset || {
        print_error "Contract deployment failed"
        exit 1
    }
    print_success "Contracts deployed successfully"
    
    # Verify deployment
    print_status "Verifying contract deployment..."
    if [ -d "build/contracts" ] && [ "$(ls -A build/contracts)" ]; then
        print_success "Contract artifacts generated successfully"
    else
        print_error "Contract deployment verification failed"
        exit 1
    fi
}

# Start backend server
start_backend() {
    print_status "Starting backend server..."
    
    if [ ! -d "backend" ]; then
        print_error "Backend directory not found"
        exit 1
    fi
    
    # Kill any existing process on port 5000
    if port_in_use 5000; then
        print_warning "Port 5000 is in use. Attempting to free it..."
        kill_process_by_port 5000
    fi
    
    cd backend
    BACKEND_PID=$(start_background_process "npm run dev" "../backend/logs/backend.log" "Backend Server")
    cd ..
    
    # Wait for backend to start
    print_status "Waiting for backend server to initialize..."
    for i in {1..60}; do
        if port_in_use 5000; then
            print_success "Backend server started successfully"
            break
        fi
        sleep 1
        if [ $i -eq 60 ]; then
            print_error "Backend server failed to start within 60 seconds"
            print_error "Check backend/logs/backend.log for details"
            exit 1
        fi
    done
}

# Start frontend application
start_frontend() {
    print_status "Starting frontend application..."
    
    if [ ! -d "frontend" ]; then
        print_error "Frontend directory not found"
        exit 1
    fi
    
    # Kill any existing process on port 3000
    if port_in_use 3000; then
        print_warning "Port 3000 is in use. Attempting to free it..."
        kill_process_by_port 3000
    fi
    
    cd frontend
    FRONTEND_PID=$(start_background_process "npm start" "../backend/logs/frontend.log" "Frontend Application")
    cd ..
    
    # Wait for frontend to start
    print_status "Waiting for frontend application to initialize..."
    for i in {1..90}; do
        if port_in_use 3000; then
            print_success "Frontend application started successfully"
            break
        fi
        sleep 1
        if [ $i -eq 90 ]; then
            print_error "Frontend application failed to start within 90 seconds"
            print_error "Check backend/logs/frontend.log for details"
            exit 1
        fi
    done
}

# Health check
health_check() {
    print_status "Performing health checks..."
    
    local all_healthy=true
    
    # Check blockchain
    if port_in_use 8545; then
        print_success "✓ Blockchain (Ganache) is running on port 8545"
    else
        print_error "✗ Blockchain is not accessible"
        all_healthy=false
    fi
    
    # Check backend
    if command_exists curl; then
        if curl -s http://localhost:5000/health > /dev/null 2>&1; then
            print_success "✓ Backend API is healthy on port 5000"
        else
            print_warning "⚠ Backend health check failed (may still be starting)"
        fi
    else
        if port_in_use 5000; then
            print_success "✓ Backend is running on port 5000"
        else
            print_error "✗ Backend is not accessible"
            all_healthy=false
        fi
    fi
    
    # Check frontend
    if port_in_use 3000; then
        print_success "✓ Frontend is running on port 3000"
    else
        print_error "✗ Frontend is not accessible"
        all_healthy=false
    fi
    
    # Check databases
    if port_in_use 27017; then
        print_success "✓ MongoDB is running on port 27017"
    else
        print_warning "⚠ MongoDB is not running (using fallback)"
    fi
    
    if port_in_use 6379; then
        print_success "✓ Redis is running on port 6379"
    else
        print_warning "⚠ Redis is not running (caching disabled)"
    fi
    
    return $([ "$all_healthy" = true ])
}

# Cleanup function
cleanup() {
    print_status "Cleaning up processes..."
    
    # Kill processes based on platform
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
        # Windows cleanup
        taskkill //F //IM node.exe 2>/dev/null || true
        taskkill //F //IM mongod.exe 2>/dev/null || true
        taskkill //F //IM redis-server.exe 2>/dev/null || true
    else
        # Unix/Linux/Mac cleanup
        [ ! -z "$FRONTEND_PID" ] && kill $FRONTEND_PID 2>/dev/null || true
        [ ! -z "$BACKEND_PID" ] && kill $BACKEND_PID 2>/dev/null || true
        [ ! -z "$GANACHE_PID" ] && kill $GANACHE_PID 2>/dev/null || true
        [ ! -z "$MONGO_PID" ] && kill $MONGO_PID 2>/dev/null || true
        [ ! -z "$REDIS_PID" ] && kill $REDIS_PID 2>/dev/null || true
        
        # Cleanup ports
        kill_process_by_port 3000
        kill_process_by_port 5000
        kill_process_by_port 8545
    fi
    
    print_status "Cleanup completed"
}

# Trap cleanup function on script exit
trap cleanup EXIT INT TERM

# Show usage information
show_usage() {
    echo "High-Efficiency Blockchain-Based Supply Chain Traceability"
    echo "Deployment Script"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --dev-mode    Start in development mode (default)"
    echo "  --prod-mode   Start in production mode"
    echo "  --help        Show this help message"
    echo ""
}

# Main deployment function
deploy() {
    print_status "Starting High-Efficiency Blockchain-Based Supply Chain Traceability deployment..."
    echo ""
    
    # Platform detection
    print_status "Detected platform: $OSTYPE"
    
    check_prerequisites
    install_dependencies
    setup_environment
    start_mongodb
    start_redis
    start_blockchain
    deploy_contracts
    start_backend
    start_frontend
    
    # Wait for all services to stabilize
    print_status "Waiting for all services to stabilize..."
    sleep 10
    
    if health_check; then
        echo ""
        print_success "🎉 Deployment completed successfully!"
        echo ""
        echo "📊 Application URLs:"
        echo "   Frontend:        http://localhost:3000"
        echo "   Backend API:     http://localhost:5000/api"
        echo "   API Docs:        http://localhost:5000/api-docs"
        echo "   Health Check:    http://localhost:5000/health"
        echo ""
        echo "🔗 Blockchain:"
        echo "   RPC URL:         http://localhost:8545"
        echo "   Network ID:      1337"
        echo "   Chain ID:        1337"
        echo ""
        echo "📝 Next Steps:"
        echo "   1. Open http://localhost:3000 in your browser"
        echo "   2. Configure MetaMask:"
        echo "      - Network Name: Local Ganache"
        echo "      - RPC URL: http://localhost:8545"
        echo "      - Chain ID: 1337"
        echo "      - Currency Symbol: ETH"
        echo "   3. Import a Ganache account to MetaMask using one of the private keys"
        echo "   4. Start using the application!"
        echo ""
        echo "📋 Test Accounts (Private Keys):"
        echo "   Account 0: 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3"
        echo "   Account 1: 0xae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f"
        echo ""
        echo "🛑 To stop all services, press Ctrl+C"
        echo ""
        
        # Keep script running
        print_status "All services are running. Press Ctrl+C to stop..."
        while true; do
            sleep 10
            # Basic health monitoring
            if ! port_in_use 3000 || ! port_in_use 5000 || ! port_in_use 8545; then
                print_warning "One or more services may have stopped. Check the logs."
                print_status "Frontend: $(port_in_use 3000 && echo "✓ Running" || echo "✗ Stopped")"
                print_status "Backend:  $(port_in_use 5000 && echo "✓ Running" || echo "✗ Stopped")"
                print_status "Blockchain: $(port_in_use 8545 && echo "✓ Running" || echo "✗ Stopped")"
            fi
        done
    else
        print_error "❌ Deployment failed during health checks"
        echo ""
        echo "🔍 Troubleshooting:"
        echo "   - Check log files in backend/logs/"
        echo "   - Ensure all required ports are available"
        echo "   - Verify Node.js version is 16 or higher"
        echo "   - Try running the script as administrator (Windows) or with sudo (Unix/Linux)"
        echo ""
        exit 1
    fi
}

# Development mode (lighter setup)
dev_mode() {
    print_status "Starting in development mode (faster startup)..."
    
    check_prerequisites
    setup_environment
    start_blockchain
    deploy_contracts
    
    print_success "Development environment ready!"
    echo ""
    echo "🚀 Quick start commands:"
    echo "   Backend:  cd backend && npm run dev"
    echo "   Frontend: cd frontend && npm start"
    echo ""
}

# Main script logic
case "${1:-}" in
    --dev-mode)
        dev_mode
        ;;
    --prod-mode)
        export NODE_ENV=production
        deploy
        ;;
    --help)
        show_usage
        exit 0
        ;;
    *)
        deploy
        ;;
esac