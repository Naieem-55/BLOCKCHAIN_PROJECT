# High-Efficiency Blockchain-Based Supply Chain Traceability with Adaptive Sharding

A comprehensive blockchain-based supply chain traceability system that provides end-to-end visibility, real-time IoT integration, and advanced analytics for supply chain management.

## 🔧 Quick Start Guide

### Prerequisites
- Node.js v18+ 
- MongoDB (running on localhost:27017)
- Redis (optional, for caching)
- Ethereum local blockchain (optional, for blockchain features)

### Installation & Running

1. **Install Dependencies**
```bash
# Backend
cd backend
npm install

# Frontend  
cd ../frontend
npm install
```

2. **Start Backend** (Port 5001)
```bash
cd backend
npm run dev
```

3. **Start Frontend** (Port 3000)
```bash
cd frontend
npm start
```

4. **Access the Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001
- API Docs: http://localhost:5001/api-docs

### First Time Setup
1. Go to http://localhost:3000/register
2. Create an account (choose any role)
3. Login with your credentials

**Test Account Available:**
- Email: test@example.com
- Password: Test123!

## 🚀 Features

### Core Functionality
- **End-to-End Traceability**: Track products from raw materials to end consumers
- **Blockchain Integration**: Immutable record keeping using Ethereum smart contracts
- **IoT Sensor Integration**: Real-time monitoring of temperature, humidity, location, and other environmental factors
- **Role-Based Access Control**: Secure multi-party access with granular permissions
- **Batch Processing**: Efficient handling of multiple products for gas optimization
- **Quality Assurance**: Comprehensive quality check recording and verification
- **Real-Time Alerts**: Automatic notifications for threshold violations and anomalies

### Advanced Features
- **Analytics Dashboard**: Comprehensive insights and reporting
- **QR Code Integration**: Easy product scanning and verification
- **Multi-Signature Support**: Enhanced security for critical operations
- **API-First Architecture**: RESTful APIs with comprehensive documentation
- **Real-Time Updates**: WebSocket integration for live data streaming
- **Caching Layer**: Redis-based caching for improved performance
- **Mobile Responsive**: Works seamlessly across all devices

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React + TypeScript)            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │  Dashboard  │ │  Products   │ │ Participants│ │ IoT Sensors │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP/WebSocket
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Backend API (Node.js + Express)             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │    Auth     │ │  Products   │ │     IoT     │ │  Analytics  │ │
│  │  Service    │ │  Service    │ │   Service   │ │   Service   │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                    │
                        ┌───────────┼───────────┐
                        │           │           │
                        ▼           ▼           ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐
│   MongoDB   │ │    Redis    │ │    Blockchain Network   │
│  Database   │ │   Cache     │ │   (Ethereum/Ganache)    │
└─────────────┘ └─────────────┘ └─────────────────────────┘
                                            │
                                            ▼
                                ┌─────────────────────────┐
                                │    Smart Contracts      │
                                │ ┌─────────────────────┐ │
                                │ │ SupplyChain         │ │
                                │ │ Traceability        │ │
                                │ └─────────────────────┘ │
                                │ ┌─────────────────────┐ │
                                │ │ IoT Integration     │ │
                                │ └─────────────────────┘ │
                                │ ┌─────────────────────┐ │
                                │ │ Access Control      │ │
                                │ └─────────────────────┘ │
                                └─────────────────────────┘
```

## 📁 Project Structure

```
supply-chain-traceability/
├── contracts/                          # Smart Contracts
│   ├── SupplyChainTraceability.sol    # Main traceability contract
│   ├── IoTIntegration.sol             # IoT sensor data management
│   ├── AccessControl.sol              # Role-based access control
│   └── Migrations.sol                 # Migration helper
├── migrations/                         # Deployment scripts
│   ├── 1_initial_migration.js
│   ├── 2_deploy_contracts.js
│   └── 3_deploy_traceability_contracts.js
├── backend/                           # Backend API
│   ├── config/                        # Configuration files
│   │   ├── database.js               # MongoDB connection
│   │   └── redis.js                  # Redis connection
│   ├── controllers/                   # API controllers
│   ├── middleware/                    # Express middleware
│   ├── models/                        # Database models
│   ├── routes/                        # API routes
│   ├── services/                      # Business logic
│   │   └── blockchainService.js      # Blockchain interaction
│   ├── utils/                         # Utility functions
│   │   └── logger.js                 # Logging configuration
│   ├── server.js                     # Main server file
│   └── package.json                  # Dependencies
├── frontend/                          # React Frontend
│   ├── public/                       # Static assets
│   ├── src/                          # Source code
│   │   ├── components/               # Reusable components
│   │   ├── pages/                    # Page components
│   │   ├── services/                 # API services
│   │   ├── store/                    # Redux store
│   │   ├── types/                    # TypeScript types
│   │   ├── utils/                    # Utility functions
│   │   └── App.tsx                   # Main app component
│   └── package.json                  # Dependencies
├── test/                             # Test files
├── truffle-config.js                 # Truffle configuration
├── package.json                      # Root dependencies
└── README.md                         # This file
```

## 🛠️ Installation & Setup

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (v4.4 or higher)
- **Redis** (v6 or higher)
- **Ganache CLI** or **Ganache GUI** for local blockchain
- **MetaMask** browser extension

### Step-by-Step Installation Guide

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd supply-chain-traceability
```

#### 2. Install Root Dependencies

```bash
npm install
```

#### 3. Set Up Local Blockchain

**Option A: Using Ganache CLI**
```bash
npm install -g ganache-cli
ganache-cli --deterministic --accounts 10 --host 0.0.0.0 --port 8545
```

**Option B: Using Ganache GUI**
- Download and install Ganache GUI
- Create a new workspace
- Set RPC server to `http://127.0.0.1:8545`
- Set network ID to `1337`

#### 4. Deploy Smart Contracts

```bash
# Compile contracts
npx truffle compile

# Deploy to local network
npx truffle migrate --network development

# Verify deployment
npx truffle console
> SupplyChainTraceability.deployed().then(instance => console.log(instance.address))
```

#### 5. Set Up Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Edit .env file with your configurations
nano .env
```

**Required Environment Variables:**
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/supply_chain_traceability
REDIS_URL=redis://localhost:6379

# Blockchain
WEB3_PROVIDER_URL=http://localhost:8545
NETWORK_ID=1337

# Security
JWT_SECRET=your_super_secret_jwt_key_here
BCRYPT_SALT_ROUNDS=12

# Server
PORT=5000
NODE_ENV=development
```

#### 6. Set Up Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

**Frontend Environment Variables:**
```bash
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WEB3_PROVIDER_URL=http://localhost:8545
REACT_APP_NETWORK_ID=1337
```

#### 7. Start the Services

**Terminal 1 - Start MongoDB:**
```bash
mongod
```

**Terminal 2 - Start Redis:**
```bash
redis-server
```

**Terminal 3 - Start Backend:**
```bash
cd backend
npm run dev
```

**Terminal 4 - Start Frontend:**
```bash
cd frontend
npm start
```

#### 8. Configure MetaMask

1. Open MetaMask browser extension
2. Add custom network:
   - **Network Name:** Local Ganache
   - **New RPC URL:** http://localhost:8545
   - **Chain ID:** 1337
   - **Currency Symbol:** ETH
3. Import accounts using private keys from Ganache

### 🚀 Quick Start

Once everything is set up:

1. **Access the application:** http://localhost:3000
2. **API documentation:** http://localhost:5000/api-docs
3. **Health check:** http://localhost:5000/health

## 📱 Usage Guide

### For Supply Chain Participants

#### 1. Registration & Authentication
- Register as a new participant with role (Supplier, Manufacturer, Distributor, Retailer)
- Complete profile setup with company information
- Connect MetaMask wallet for blockchain interactions

#### 2. Product Management
- **Create Products:** Add new products with detailed information
- **Transfer Ownership:** Transfer products between supply chain stages
- **Update Status:** Mark products as processed, shipped, or delivered
- **Batch Operations:** Handle multiple products simultaneously for efficiency

#### 3. Quality Control
- **Add Quality Checks:** Record inspection results and certifications
- **Upload Documents:** Attach certificates, test reports, and compliance documents
- **Set Quality Standards:** Define acceptable ranges for various parameters

#### 4. IoT Integration
- **Register Sensors:** Add temperature, humidity, location, and custom sensors
- **Monitor Real-Time Data:** View live sensor readings and historical trends
- **Set Alerts:** Configure automatic notifications for threshold violations
- **Batch Data Recording:** Efficiently record multiple sensor readings

### For Consumers

#### 1. Product Verification
- **QR Code Scanning:** Scan product QR codes to view complete traceability
- **Authenticity Check:** Verify product authenticity using blockchain records
- **Supply Chain Journey:** View complete product journey from origin to shelf

#### 2. Information Access
- **Product Details:** Access comprehensive product information
- **Quality Reports:** View quality check results and certifications
- **Environmental Data:** See temperature, humidity, and storage conditions

### For Administrators

#### 1. System Management
- **User Management:** Approve new participants and manage roles
- **System Monitoring:** Monitor system health and performance
- **Analytics:** Access comprehensive supply chain analytics

#### 2. Compliance & Auditing
- **Audit Trails:** Access complete audit trails for compliance
- **Report Generation:** Generate compliance and performance reports
- **Alert Management:** Monitor and resolve system alerts

## 🔧 API Documentation

The system provides comprehensive RESTful APIs for all operations:

### Authentication Endpoints
```
POST /api/auth/register          # Register new user
POST /api/auth/login            # User login
POST /api/auth/logout           # User logout
GET  /api/auth/profile          # Get user profile
PUT  /api/auth/profile          # Update user profile
```

### Product Management
```
GET    /api/products            # Get all products
POST   /api/products            # Create new product
GET    /api/products/:id        # Get product details
PUT    /api/products/:id        # Update product
DELETE /api/products/:id        # Delete product
GET    /api/products/:id/history # Get product history
POST   /api/products/:id/transfer # Transfer product ownership
```

### IoT Sensor Management
```
GET    /api/iot/sensors         # Get all sensors
POST   /api/iot/sensors         # Register new sensor
GET    /api/iot/sensors/:id     # Get sensor details
POST   /api/iot/sensors/:id/data # Record sensor data
GET    /api/iot/products/:id/data # Get product sensor data
```

### Analytics & Reporting
```
GET    /api/analytics/dashboard  # Dashboard statistics
GET    /api/analytics/products   # Product analytics
GET    /api/analytics/sensors    # Sensor analytics
GET    /api/analytics/participants # Participant analytics
```

**Full API documentation is available at:** `http://localhost:5000/api-docs`

## 🧪 Testing

### Running Tests

**Backend Tests:**
```bash
cd backend
npm test                    # Run all tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage
```

**Frontend Tests:**
```bash
cd frontend
npm test                   # Run all tests
npm run test:coverage      # Run tests with coverage
```

**Smart Contract Tests:**
```bash
npx truffle test           # Run contract tests
npx truffle test --network development
```

### Test Coverage

The system includes comprehensive tests for:
- Smart contract functionality
- API endpoints
- Business logic
- Frontend components
- Integration scenarios

## 🔒 Security Features

### Blockchain Security
- **Immutable Records:** All transactions recorded on blockchain
- **Multi-Signature Support:** Critical operations require multiple approvals
- **Role-Based Access:** Granular permissions for different user types
- **Smart Contract Auditing:** Contracts follow security best practices

### Application Security
- **JWT Authentication:** Secure token-based authentication
- **Input Validation:** Comprehensive input sanitization
- **Rate Limiting:** Protection against abuse and DoS attacks
- **HTTPS Enforcement:** Secure communication in production
- **Data Encryption:** Sensitive data encrypted at rest and in transit

### Privacy Protection
- **GDPR Compliance:** User data handling follows GDPR guidelines
- **Data Minimization:** Only necessary data is collected and stored
- **Right to Erasure:** Users can request data deletion
- **Audit Trails:** Complete audit logs for compliance

## 📊 Performance Optimization

### Blockchain Optimization
- **Batch Processing:** Multiple operations in single transaction
- **Gas Optimization:** Efficient contract code to minimize gas costs
- **Event Indexing:** Efficient event filtering and querying
- **State Management:** Optimized state variable packing

### Application Performance
- **Caching Strategy:** Redis caching for frequently accessed data
- **Database Indexing:** Optimized database queries
- **API Rate Limiting:** Prevents system overload
- **Code Splitting:** Lazy loading of frontend components
- **CDN Integration:** Fast asset delivery

### Scalability Features
- **Horizontal Scaling:** Microservices architecture
- **Load Balancing:** Multiple server instances support
- **Database Sharding:** Distributed data storage
- **Queue Management:** Asynchronous task processing

## 🚀 Deployment

### Production Deployment

#### 1. Environment Setup
```bash
# Set production environment variables
export NODE_ENV=production
export MONGODB_URI=mongodb://your-production-db
export REDIS_URL=redis://your-production-redis
export WEB3_PROVIDER_URL=https://your-ethereum-node
```

#### 2. Build Applications
```bash
# Build frontend
cd frontend
npm run build

# Build backend (if using TypeScript)
cd backend
npm run build
```

#### 3. Deploy Smart Contracts
```bash
# Deploy to mainnet/testnet
npx truffle migrate --network mainnet
```

#### 4. Start Production Services
```bash
# Start backend
cd backend
npm start

# Serve frontend (using nginx or similar)
nginx -s reload
```

### Docker Deployment

```yaml
# docker-compose.yml
version: '3.8'
services:
  mongodb:
    image: mongo:4.4
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    depends_on:
      - mongodb
      - redis
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/supply_chain
      - REDIS_URL=redis://redis:6379

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mongodb_data:
```

## 🤝 Contributing

We welcome contributions to improve the supply chain traceability system!

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Standards
- Follow TypeScript/JavaScript best practices
- Write comprehensive tests
- Update documentation
- Follow commit message conventions
- Ensure security best practices

## 📞 Support

### Documentation
- **API Docs:** http://localhost:5000/api-docs
- **Smart Contract Docs:** `/docs/contracts/`
- **User Guide:** `/docs/user-guide/`

### Community
- **Issues:** Report bugs and request features on GitHub
- **Discussions:** Join community discussions
- **Wiki:** Access additional documentation

### Enterprise Support
For enterprise deployments and custom requirements:
- **Email:** enterprise@supplychain.com
- **Consulting:** Professional services available
- **Training:** Team training and workshops

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenZeppelin:** Smart contract security libraries
- **Truffle Suite:** Development framework
- **Material-UI:** React component library
- **Web3.js:** Ethereum JavaScript API
- **Express.js:** Node.js web framework

---

**Built with ❤️ for transparent and efficient supply chains**
