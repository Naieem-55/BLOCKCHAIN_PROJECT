#!/bin/bash

# High-Efficiency Blockchain-Based Supply Chain Traceability
# Deployment Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Node.js
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js v16 or higher."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d 'v' -f 2 | cut -d '.' -f 1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        print_error "Node.js version must be 16 or higher. Current version: $(node --version)"
        exit 1
    fi
    print_success "Node.js $(node --version) is installed"
    
    # Check npm
    if ! command_exists npm; then
        print_error "npm is not installed."
        exit 1
    fi
    print_success "npm $(npm --version) is installed"
    
    # Check MongoDB
    if ! command_exists mongod; then
        print_warning "MongoDB is not installed or not in PATH. Please ensure MongoDB is running."
    else
        print_success "MongoDB is available"
    fi
    
    # Check Redis
    if ! command_exists redis-server; then
        print_warning "Redis is not installed or not in PATH. Please ensure Redis is running."
    else
        print_success "Redis is available"
    fi
    
    # Check Ganache CLI
    if ! command_exists ganache-cli; then
        print_warning "Ganache CLI is not installed. Installing..."
        npm install -g ganache-cli
        print_success "Ganache CLI installed"
    else
        print_success "Ganache CLI is available"
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Root dependencies
    print_status "Installing root dependencies..."
    npm install
    print_success "Root dependencies installed"
    
    # Backend dependencies
    print_status "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    print_success "Backend dependencies installed"
    
    # Frontend dependencies
    print_status "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    print_success "Frontend dependencies installed"
}

# Setup environment files
setup_environment() {
    print_status "Setting up environment files..."
    
    # Backend environment
    if [ ! -f "backend/.env" ]; then
        print_status "Creating backend environment file..."
        cp backend/.env.example backend/.env
        print_warning "Please update backend/.env with your configuration"
    else
        print_success "Backend .env file already exists"
    fi
    
    # Frontend environment
    if [ ! -f "frontend/.env.local" ]; then
        print_status "Creating frontend environment file..."
        cat > frontend/.env.local << EOF
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WEB3_PROVIDER_URL=http://localhost:8545
REACT_APP_NETWORK_ID=1337
EOF
        print_success "Frontend .env.local file created"
    else
        print_success "Frontend .env.local file already exists"
    fi
}

# Start blockchain
start_blockchain() {
    print_status "Starting local blockchain..."
    
    # Check if Ganache is already running
    if lsof -Pi :8545 -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Port 8545 is already in use. Assuming blockchain is running."
    else
        print_status "Starting Ganache CLI..."
        ganache-cli --deterministic --accounts 10 --host 0.0.0.0 --port 8545 &
        GANACHE_PID=$!
        sleep 5
        print_success "Ganache CLI started (PID: $GANACHE_PID)"
    fi
}

# Deploy smart contracts
deploy_contracts() {
    print_status "Deploying smart contracts..."
    
    # Compile contracts
    print_status "Compiling contracts..."
    npx truffle compile
    print_success "Contracts compiled"
    
    # Deploy contracts
    print_status "Deploying contracts to local network..."
    npx truffle migrate --network development --reset
    print_success "Contracts deployed"
    
    # Verify deployment
    print_status "Verifying contract deployment..."
    npx truffle console --network development << EOF
SupplyChainTraceability.deployed().then(instance => {
    console.log('SupplyChainTraceability deployed at:', instance.address);
    process.exit(0);
});
EOF
    print_success "Contract deployment verified"
}

# Start services
start_services() {
    print_status "Starting services..."
    
    # Create logs directory
    mkdir -p backend/logs
    
    # Start MongoDB if not running
    if ! pgrep mongod > /dev/null; then
        print_status "Starting MongoDB..."
        mongod --fork --logpath backend/logs/mongodb.log --dbpath ./data/db
        sleep 3
        print_success "MongoDB started"
    else
        print_success "MongoDB is already running"
    fi
    
    # Start Redis if not running
    if ! pgrep redis-server > /dev/null; then
        print_status "Starting Redis..."
        redis-server --daemonize yes --logfile backend/logs/redis.log
        sleep 2
        print_success "Redis started"
    else
        print_success "Redis is already running"
    fi
    
    # Start backend
    print_status "Starting backend server..."
    cd backend
    npm run dev > ../backend/logs/backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    sleep 5
    print_success "Backend server started (PID: $BACKEND_PID)"
    
    # Start frontend
    print_status "Starting frontend server..."
    cd frontend
    npm start > ../backend/logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ..
    sleep 10
    print_success "Frontend server started (PID: $FRONTEND_PID)"
}

# Health check
health_check() {
    print_status "Performing health checks..."
    
    # Check backend health
    if curl -s http://localhost:5000/health > /dev/null; then
        print_success "Backend is healthy"
    else
        print_error "Backend health check failed"
        return 1
    fi
    
    # Check frontend
    if curl -s http://localhost:3000 > /dev/null; then
        print_success "Frontend is accessible"
    else
        print_error "Frontend health check failed"
        return 1
    fi
    
    # Check blockchain connection
    if curl -s -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://localhost:8545 > /dev/null; then
        print_success "Blockchain is accessible"
    else
        print_error "Blockchain health check failed"
        return 1
    fi
}

# Cleanup function
cleanup() {
    print_status "Cleaning up..."
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$GANACHE_PID" ]; then
        kill $GANACHE_PID 2>/dev/null || true
    fi
}

# Trap cleanup function on script exit
trap cleanup EXIT

# Main deployment function
deploy() {
    print_status "Starting High-Efficiency Blockchain-Based Supply Chain Traceability deployment..."
    
    check_prerequisites
    install_dependencies
    setup_environment
    start_blockchain
    deploy_contracts
    start_services
    
    # Wait for services to start
    print_status "Waiting for services to initialize..."
    sleep 15
    
    if health_check; then
        print_success "Deployment completed successfully!"
        echo ""
        echo "🚀 Application URLs:"
        echo "   Frontend:        http://localhost:3000"
        echo "   Backend API:     http://localhost:5000"
        echo "   API Docs:        http://localhost:5000/api-docs"
        echo "   Health Check:    http://localhost:5000/health"
        echo ""
        echo "📊 Blockchain:"
        echo "   RPC URL:         http://localhost:8545"
        echo "   Network ID:      1337"
        echo ""
        echo "📝 Next Steps:"
        echo "   1. Configure MetaMask with local network"
        echo "   2. Import Ganache accounts to MetaMask"
        echo "   3. Access the application at http://localhost:3000"
        echo "   4. Check the API documentation at http://localhost:5000/api-docs"
        echo ""
        echo "🛑 To stop all services, press Ctrl+C"
        
        # Keep script running
        wait
    else
        print_error "Deployment failed during health checks"
        exit 1
    fi
}

# Development mode
dev_mode() {
    print_status "Starting in development mode..."
    
    # Just start the services without full deployment
    start_services
    health_check
    
    print_success "Development mode started!"
    echo "Access the application at http://localhost:3000"
    
    wait
}

# Show usage
show_usage() {
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  deploy    Full deployment (default)"
    echo "  dev       Development mode (start services only)"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                # Full deployment"
    echo "  $0 deploy         # Full deployment"
    echo "  $0 dev            # Development mode"
    echo "  $0 help           # Show help"
}

# Main script logic
case "${1:-deploy}" in
    "deploy")
        deploy
        ;;
    "dev")
        dev_mode
        ;;
    "help"|"-h"|"--help")
        show_usage
        ;;
    *)
        print_error "Unknown option: $1"
        show_usage
        exit 1
        ;;
esac