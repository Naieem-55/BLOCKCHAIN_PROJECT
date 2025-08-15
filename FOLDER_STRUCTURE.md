# 📁 High-Efficiency Blockchain-Based Supply Chain Traceability - Folder Structure

## 🏗️ Complete Project Architecture

```
supply-chain-traceability/
├── 📄 README.md                                    # Comprehensive project documentation
├── 📄 FOLDER_STRUCTURE.md                          # This file - project structure guide
├── 📄 LICENSE                                      # MIT license
├── 📄 package.json                                 # Root project dependencies
├── 📄 package-lock.json                            # Dependency lock file
├── 📄 yarn.lock                                    # Yarn lock file (if using yarn)
├── 📄 truffle-config.js                            # Truffle blockchain configuration
├── 📄 .gitignore                                   # Git ignore rules
│
├── 📂 contracts/                                   # 🔗 Smart Contracts
│   ├── 📄 Migrations.sol                          # Truffle migrations contract
│   ├── 📄 SupplyChain.sol                         # Legacy supply chain contract
│   ├── 📄 SupplyChainTraceability.sol             # ⭐ Enhanced traceability contract
│   ├── 📄 IoTIntegration.sol                      # 🌡️ IoT sensor data management
│   └── 📄 AccessControl.sol                       # 🔐 Role-based access control
│
├── 📂 migrations/                                  # 🚀 Blockchain Deployment Scripts
│   ├── 📄 1_initial_migration.js                  # Initial Truffle migration
│   ├── 📄 2_deploy_contracts.js                   # Legacy contract deployment
│   └── 📄 3_deploy_traceability_contracts.js      # ⭐ New enhanced contracts deployment
│
├── 📂 backend/                                     # 🔧 Backend API (Node.js + Express)
│   ├── 📄 package.json                            # Backend dependencies
│   ├── 📄 package-lock.json                       # Backend dependency lock
│   ├── 📄 server.js                               # ⭐ Main server entry point
│   ├── 📄 .env.example                            # Environment variables template
│   ├── 📄 .env                                    # Environment variables (created during setup)
│   │
│   ├── 📂 config/                                  # ⚙️ Configuration Files
│   │   ├── 📄 database.js                         # MongoDB connection setup
│   │   └── 📄 redis.js                            # Redis caching configuration
│   │
│   ├── 📂 controllers/                             # 🎮 API Controllers
│   │   ├── 📄 authController.js                   # Authentication logic
│   │   ├── 📄 productController.js                # Product management
│   │   ├── 📄 participantController.js            # Participant management
│   │   ├── 📄 iotController.js                    # IoT sensor management
│   │   └── 📄 analyticsController.js              # Analytics & reporting
│   │
│   ├── 📂 middleware/                              # 🛡️ Express Middleware
│   │   ├── 📄 auth.js                             # Authentication middleware
│   │   ├── 📄 validation.js                       # Input validation
│   │   ├── 📄 rateLimiting.js                     # Rate limiting
│   │   ├── 📄 errorHandler.js                     # ⭐ Global error handling
│   │   └── 📄 cache.js                            # Caching middleware
│   │
│   ├── 📂 models/                                  # 🗄️ Database Models
│   │   ├── 📄 User.js                             # User/participant model
│   │   ├── 📄 Product.js                          # Product information model
│   │   ├── 📄 Sensor.js                           # IoT sensor model
│   │   ├── 📄 SensorData.js                       # Sensor readings model
│   │   ├── 📄 QualityCheck.js                     # Quality assurance model
│   │   └── 📄 Alert.js                            # System alerts model
│   │
│   ├── 📂 routes/                                  # 🛣️ API Routes
│   │   ├── 📄 auth.js                             # Authentication endpoints
│   │   ├── 📄 products.js                         # Product management endpoints
│   │   ├── 📄 participants.js                     # Participant management endpoints
│   │   ├── 📄 iot.js                              # IoT sensor endpoints
│   │   └── 📄 analytics.js                        # Analytics endpoints
│   │
│   ├── 📂 services/                                # 🔧 Business Logic Services
│   │   ├── 📄 blockchainService.js                # ⭐ Blockchain interaction service
│   │   ├── 📄 authService.js                      # Authentication service
│   │   ├── 📄 emailService.js                     # Email notifications
│   │   ├── 📄 qrCodeService.js                    # QR code generation
│   │   ├── 📄 analyticsService.js                 # Data analytics
│   │   └── 📄 iotService.js                       # IoT data processing
│   │
│   ├── 📂 utils/                                   # 🔨 Utility Functions
│   │   ├── 📄 logger.js                           # ⭐ Winston logging configuration
│   │   ├── 📄 validation.js                       # Input validation helpers
│   │   ├── 📄 crypto.js                           # Encryption utilities
│   │   ├── 📄 dateUtils.js                        # Date manipulation
│   │   └── 📄 constants.js                        # Application constants
│   │
│   ├── 📂 tests/                                   # 🧪 Backend Tests
│   │   ├── 📂 unit/                               # Unit tests
│   │   ├── 📂 integration/                        # Integration tests
│   │   └── 📂 fixtures/                           # Test data
│   │
│   └── 📂 logs/                                    # 📊 Application Logs (created at runtime)
│       ├── 📄 combined.log                        # All logs
│       ├── 📄 error.log                           # Error logs only
│       ├── 📄 mongodb.log                         # MongoDB logs
│       └── 📄 redis.log                           # Redis logs
│
├── 📂 frontend/                                    # 🎨 React Frontend (TypeScript)
│   ├── 📄 package.json                            # ⭐ Frontend dependencies
│   ├── 📄 package-lock.json                       # Frontend dependency lock
│   ├── 📄 tsconfig.json                           # TypeScript configuration
│   ├── 📄 .env.local                              # Frontend environment variables
│   │
│   ├── 📂 public/                                  # 📁 Static Assets
│   │   ├── 📄 index.html                          # Main HTML template
│   │   ├── 📄 manifest.json                       # PWA manifest
│   │   ├── 📄 favicon.ico                         # Favicon
│   │   └── 📂 icons/                              # App icons
│   │
│   └── 📂 src/                                     # 💻 Source Code
│       ├── 📄 App.tsx                             # ⭐ Main application component
│       ├── 📄 index.tsx                           # React entry point
│       ├── 📄 index.css                           # Global styles
│       │
│       ├── 📂 components/                          # 🧩 Reusable Components
│       │   ├── 📂 Layout/                         # Layout components
│       │   │   ├── 📄 Layout.tsx                  # Main layout wrapper
│       │   │   ├── 📄 Sidebar.tsx                 # Navigation sidebar
│       │   │   ├── 📄 Header.tsx                  # Top header
│       │   │   └── 📄 Footer.tsx                  # Footer component
│       │   │
│       │   ├── 📂 Auth/                           # Authentication components
│       │   │   ├── 📄 LoginForm.tsx               # Login form
│       │   │   ├── 📄 RegisterForm.tsx            # Registration form
│       │   │   └── 📄 ProtectedRoute.tsx          # Route protection
│       │   │
│       │   ├── 📂 Product/                        # Product-related components
│       │   │   ├── 📄 ProductCard.tsx             # Product display card
│       │   │   ├── 📄 ProductForm.tsx             # Product creation/edit form
│       │   │   ├── 📄 ProductList.tsx             # Product listing
│       │   │   └── 📄 ProductTimeline.tsx         # Product journey timeline
│       │   │
│       │   ├── 📂 IoT/                            # IoT sensor components
│       │   │   ├── 📄 SensorCard.tsx              # Sensor display card
│       │   │   ├── 📄 SensorChart.tsx             # Sensor data visualization
│       │   │   ├── 📄 AlertPanel.tsx              # Alert notifications
│       │   │   └── 📄 ThresholdSettings.tsx       # Threshold configuration
│       │   │
│       │   ├── 📂 Analytics/                      # Analytics components
│       │   │   ├── 📄 Dashboard.tsx               # Main dashboard
│       │   │   ├── 📄 Charts.tsx                  # Chart components
│       │   │   ├── 📄 Metrics.tsx                 # Metrics display
│       │   │   └── 📄 Reports.tsx                 # Report generation
│       │   │
│       │   ├── 📂 QR/                             # QR code components
│       │   │   ├── 📄 QRGenerator.tsx             # QR code generation
│       │   │   ├── 📄 QRScanner.tsx               # QR code scanning
│       │   │   └── 📄 QRDisplay.tsx               # QR code display
│       │   │
│       │   └── 📂 Common/                         # Common UI components
│       │       ├── 📄 LoadingScreen.tsx           # Loading indicator
│       │       ├── 📄 ErrorBoundary.tsx           # Error handling
│       │       ├── 📄 Modal.tsx                   # Modal dialog
│       │       ├── 📄 DataTable.tsx               # Data table component
│       │       └── 📄 SearchBar.tsx               # Search functionality
│       │
│       ├── 📂 pages/                               # 📄 Page Components
│       │   ├── 📄 Dashboard.tsx                   # ⭐ Main dashboard page
│       │   ├── 📄 Products.tsx                    # Product management page
│       │   ├── 📄 ProductDetail.tsx               # Product detail view
│       │   ├── 📄 Participants.tsx                # Participant management
│       │   ├── 📄 IoTSensors.tsx                  # IoT sensor management
│       │   ├── 📄 Analytics.tsx                   # Analytics page
│       │   ├── 📄 QRScanner.tsx                   # QR code scanner page
│       │   ├── 📄 Login.tsx                       # Login page
│       │   ├── 📄 Register.tsx                    # Registration page
│       │   ├── 📄 Profile.tsx                     # User profile page
│       │   ├── 📄 Settings.tsx                    # Application settings
│       │   └── 📄 NotFound.tsx                    # 404 error page
│       │
│       ├── 📂 services/                            # 🔗 API Services
│       │   ├── 📄 api.ts                          # Base API configuration
│       │   ├── 📄 authService.ts                  # Authentication API calls
│       │   ├── 📄 productService.ts               # Product API calls
│       │   ├── 📄 participantService.ts           # Participant API calls
│       │   ├── 📄 iotService.ts                   # IoT sensor API calls
│       │   ├── 📄 analyticsService.ts             # Analytics API calls
│       │   └── 📄 web3Service.ts                  # Blockchain interaction
│       │
│       ├── 📂 store/                               # 🗃️ Redux State Management
│       │   ├── 📄 index.ts                        # Store configuration
│       │   ├── 📄 authSlice.ts                    # Authentication state
│       │   ├── 📄 productSlice.ts                 # Product state
│       │   ├── 📄 iotSlice.ts                     # IoT sensor state
│       │   └── 📄 uiSlice.ts                      # UI state
│       │
│       ├── 📂 types/                               # 📝 TypeScript Type Definitions
│       │   ├── 📄 index.ts                        # Main type exports
│       │   ├── 📄 auth.ts                         # Authentication types
│       │   ├── 📄 product.ts                      # Product types
│       │   ├── 📄 participant.ts                  # Participant types
│       │   ├── 📄 iot.ts                          # IoT sensor types
│       │   └── 📄 api.ts                          # API response types
│       │
│       ├── 📂 utils/                               # 🔨 Utility Functions
│       │   ├── 📄 constants.ts                    # Application constants
│       │   ├── 📄 helpers.ts                      # Helper functions
│       │   ├── 📄 formatters.ts                   # Data formatters
│       │   ├── 📄 validators.ts                   # Form validators
│       │   └── 📄 web3Utils.ts                    # Web3 utilities
│       │
│       ├── 📂 hooks/                               # ⚓ Custom React Hooks
│       │   ├── 📄 useAuth.ts                      # Authentication hook
│       │   ├── 📄 useProducts.ts                  # Product management hook
│       │   ├── 📄 useIoT.ts                       # IoT sensor hook
│       │   └── 📄 useWeb3.ts                      # Web3 integration hook
│       │
│       └── 📂 assets/                              # 🎨 Static Assets
│           ├── 📂 images/                         # Images
│           ├── 📂 icons/                          # Icon files
│           └── 📂 styles/                         # CSS/SCSS files
│
├── 📂 test/                                        # 🧪 Smart Contract Tests
│   ├── 📄 SupplyChainTraceability.test.js         # Main contract tests
│   ├── 📄 IoTIntegration.test.js                  # IoT contract tests
│   ├── 📄 AccessControl.test.js                   # Access control tests
│   └── 📂 helpers/                                # Test helper functions
│
├── 📂 scripts/                                     # 🚀 Deployment & Utility Scripts
│   ├── 📄 deploy.sh                               # ⭐ Main deployment script
│   ├── 📄 setup-dev.sh                            # Development setup
│   ├── 📄 backup.sh                               # Database backup script
│   └── 📄 migrate-data.js                         # Data migration script
│
├── 📂 docs/                                        # 📚 Additional Documentation
│   ├── 📄 API.md                                  # API documentation
│   ├── 📄 DEPLOYMENT.md                           # Deployment guide
│   ├── 📄 CONTRIBUTING.md                         # Contribution guidelines
│   ├── 📂 contracts/                              # Smart contract documentation
│   ├── 📂 user-guide/                             # User guides
│   └── 📂 architecture/                           # Architecture diagrams
│
├── 📂 build/                                       # 🏗️ Build Artifacts (created during compilation)
│   └── 📂 contracts/                              # Compiled smart contracts
│       ├── 📄 SupplyChainTraceability.json        # Contract ABI & bytecode
│       ├── 📄 IoTIntegration.json                 # IoT contract artifacts
│       └── 📄 AccessControl.json                  # Access control artifacts
│
├── 📂 data/                                        # 💾 Local Data Storage (created at runtime)
│   ├── 📂 db/                                     # MongoDB data directory
│   ├── 📂 uploads/                                # File uploads
│   └── 📂 backups/                                # Database backups
│
└── 📂 .vscode/                                     # 🔧 VS Code Configuration (optional)
    ├── 📄 settings.json                           # Editor settings
    ├── 📄 launch.json                             # Debug configuration
    └── 📄 extensions.json                         # Recommended extensions
```

## 🎯 Key Components Explained

### 🔗 Smart Contracts (`/contracts/`)
- **SupplyChainTraceability.sol**: Main contract handling product lifecycle, ownership transfers, and traceability
- **IoTIntegration.sol**: Manages IoT sensor data, alerts, and real-time monitoring
- **AccessControl.sol**: Implements role-based permissions and security

### 🔧 Backend API (`/backend/`)
- **RESTful API** built with Node.js and Express
- **MongoDB** for data persistence
- **Redis** for caching and session management
- **WebSocket** support for real-time updates
- **Comprehensive logging** and error handling

### 🎨 Frontend (`/frontend/`)
- **React 18** with TypeScript
- **Material-UI** for modern UI components
- **Redux Toolkit** for state management
- **React Query** for API data fetching
- **WebSocket** integration for real-time updates

### 🧪 Testing (`/test/`)
- **Smart contract tests** using Truffle framework
- **Backend API tests** with Jest and Supertest
- **Frontend component tests** with React Testing Library

### 🚀 Deployment (`/scripts/`)
- **Automated deployment** script for complete setup
- **Development environment** setup
- **Database migration** utilities

## 🔧 Technology Stack

### Blockchain Layer
- **Ethereum** blockchain platform
- **Solidity** smart contract language
- **Truffle** development framework
- **Ganache** local blockchain
- **Web3.js** blockchain interaction

### Backend Layer
- **Node.js** runtime environment
- **Express.js** web framework
- **MongoDB** document database
- **Redis** in-memory cache
- **Socket.io** real-time communication
- **JWT** authentication
- **Winston** logging

### Frontend Layer
- **React** UI library
- **TypeScript** type safety
- **Material-UI** component library
- **Redux Toolkit** state management
- **React Query** data fetching
- **Recharts** data visualization

### DevOps & Tools
- **Docker** containerization
- **GitHub Actions** CI/CD
- **ESLint** code linting
- **Prettier** code formatting
- **Jest** testing framework

## 📊 Data Flow Architecture

```
User Interface (React)
        ↕
    API Layer (Express)
        ↕
   Business Logic (Services)
        ↕
┌─────────────────────────────┐
│    Data Storage Layer       │
├─────────────────────────────┤
│ MongoDB  │ Redis │ Ethereum │
│ (Primary)│(Cache)│(Immutable)│
└─────────────────────────────┘
```

## 🔐 Security Features

- **Role-based access control** at smart contract level
- **JWT authentication** for API access
- **Input validation** and sanitization
- **Rate limiting** to prevent abuse
- **HTTPS enforcement** in production
- **Smart contract auditing** best practices

## 📈 Scalability Considerations

- **Microservices architecture** ready
- **Horizontal scaling** support
- **Database indexing** optimization
- **Caching strategies** implemented
- **Load balancing** ready
- **CDN integration** support

---

**This folder structure provides a complete, production-ready blockchain-based supply chain traceability system with modern development practices and comprehensive documentation.**