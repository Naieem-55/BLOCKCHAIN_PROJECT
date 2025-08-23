# Supply Chain Traceability System - Usage Instructions

## Prerequisites

1. **Node.js**: Version 20.x or higher
2. **MongoDB**: Running instance (local or cloud)
3. **Redis**: Running instance (optional, for caching)
4. **Ganache**: For local blockchain development
5. **MetaMask**: Browser extension for Web3 interaction

## System Setup

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file with the following variables:
PORT=5000
MONGODB_URI=mongodb://localhost:27017/supply_chain
JWT_SECRET=your_jwt_secret_here
REDIS_URL=redis://localhost:6379
NODE_ENV=development
BLOCKCHAIN_RPC_URL=http://localhost:7545
CONTRACT_ADDRESS=your_deployed_contract_address

# Start the backend server
npm run dev
```

The backend will run on `http://localhost:5000`

### 2. Smart Contract Deployment

```bash
# Navigate to project root
cd BLOCKCHAIN_PROJECT

# Compile contracts
npx truffle compile

# Start Ganache (in a new terminal)
ganache-cli -p 7545

# Deploy contracts
npx truffle migrate --reset

# Note the deployed contract addresses
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# Start the frontend
npm start
```

The frontend will run on `http://localhost:3001`

## Using the Application

### 1. Registration and Login

1. Navigate to `http://localhost:3001/register`
2. Create an account with:
   - Name
   - Email
   - Password
   - Role (Manufacturer, Supplier, Distributor, Retailer)
3. Login at `http://localhost:3001/login`

### 2. Dashboard

After login, you'll see the main dashboard with:
- Total products overview
- Active participants
- Recent activities
- Quick action buttons

### 3. Product Management

#### Creating a Product
1. Go to **Products** page (`/products`)
2. Click **"Add Product"**
3. Fill in:
   - Product name
   - Description
   - Category
   - Initial quantity
   - Unit price
4. Click **"Create"**

#### Viewing Product Details
1. Click on any product from the products list
2. You'll see multiple tabs:
   - **Lifecycle**: Track product through supply chain stages
   - **Location**: View real-time location tracking
   - **History**: See all transactions and updates
   - **Analytics**: View product-specific metrics

### 4. Product Lifecycle Management

#### Tracking Lifecycle Stages
1. Open a product's detail page
2. Go to the **Lifecycle** tab
3. You'll see the current stage and timeline
4. Available stages:
   - Created
   - Raw Material
   - Manufacturing
   - Quality Control
   - Packaging
   - Distribution
   - Retail
   - Sold/Recalled

#### Updating Lifecycle Stage
1. In the Lifecycle tab, click **"Update Stage"**
2. Select the next valid stage
3. Add notes (optional)
4. Click **"Confirm Update"**
5. The update will be recorded on the blockchain

### 5. Location Tracking

#### Viewing Location History
1. Open a product's detail page
2. Go to the **Location** tab
3. View the map with location markers
4. See the route history

#### Adding Location Update
1. Click **"Add Location"**
2. Enter:
   - Latitude and Longitude (or use current location)
   - Location name
   - Notes
3. Click **"Save Location"**

### 6. IoT Integration

1. Go to **IoT Sensors** page (`/iot-sensors`)
2. View connected sensors
3. Monitor real-time data:
   - Temperature
   - Humidity
   - Vibration
   - Light exposure
4. Set alerts for threshold violations

### 7. Analytics

1. Go to **Analytics** page (`/analytics`)
2. View:
   - Supply chain metrics
   - Product distribution
   - Performance indicators
   - Time-based trends
3. Export reports as CSV/PDF

### 8. Blockchain Features

#### Sharding Dashboard
1. Go to **Sharding** page (`/sharding`)
2. View:
   - Active shards
   - Load distribution
   - Performance metrics
3. Optimize shard allocation

#### Verifying Product Authenticity
1. Use **QR Scanner** (`/qr-scanner`)
2. Scan product QR code
3. View blockchain-verified information:
   - Product authenticity
   - Complete history
   - Current owner
   - Lifecycle stage

### 9. Participant Management

1. Go to **Participants** page (`/participants`)
2. View all supply chain participants
3. Add new participants
4. Manage permissions and roles

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Products
- `GET /api/products` - List all products
- `POST /api/products` - Create new product
- `GET /api/products/:id` - Get product details
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Lifecycle Management
- `GET /api/lifecycle/product/:id/lifecycle` - Get lifecycle status
- `POST /api/lifecycle/product/:id/update-stage` - Update stage
- `GET /api/lifecycle/product/:id/history` - Get stage history
- `POST /api/lifecycle/product/:id/validate-transition` - Validate stage transition

### Location Tracking
- `GET /api/location/product/:id/locations` - Get location history
- `POST /api/location/product/:id/location` - Add location update
- `GET /api/location/product/:id/current` - Get current location
- `GET /api/location/product/:id/route` - Get route history

### IoT Integration
- `GET /api/iot/sensors` - List all sensors
- `POST /api/iot/sensors/:id/data` - Submit sensor data
- `GET /api/iot/products/:id/readings` - Get product sensor readings
- `POST /api/iot/alerts` - Configure alerts

### Analytics
- `GET /api/analytics/dashboard` - Dashboard metrics
- `GET /api/analytics/products/:id/metrics` - Product metrics
- `GET /api/analytics/supply-chain/performance` - Performance data

## Troubleshooting

### Backend Issues
1. **MongoDB connection failed**: Ensure MongoDB is running
2. **Port already in use**: Change PORT in .env file
3. **Redis connection failed**: Redis is optional, can be disabled

### Frontend Issues
1. **Proxy error**: Ensure backend is running on correct port (5000)
2. **Dependency conflicts**: Use `npm install --legacy-peer-deps`
3. **TypeScript errors**: Run `npx tsc --noEmit` to check

### Smart Contract Issues
1. **Deployment failed**: Ensure Ganache is running
2. **Contract not found**: Update CONTRACT_ADDRESS in backend .env
3. **Gas errors**: Increase gas limit in truffle-config.js

## Testing the Features

### Test Product Lifecycle
1. Create a new product
2. Update through stages: Created → Raw Material → Manufacturing
3. Verify blockchain records each transition
4. Check history for audit trail

### Test Location Tracking
1. Open any product
2. Add multiple location updates
3. View the route on the map
4. Verify timestamps and coordinates

### Test Real-time Updates
1. Open same product in two browser tabs
2. Update product in one tab
3. Verify real-time update in other tab (via WebSocket)

## Security Notes

1. Always use HTTPS in production
2. Keep JWT_SECRET secure
3. Implement rate limiting for API endpoints
4. Regular security audits of smart contracts
5. Use environment variables for sensitive data

## Support

For issues or questions:
1. Check the logs in backend: `npm run dev`
2. Frontend console: F12 in browser
3. Smart contract events: Check Ganache logs

## Next Steps

1. Configure email notifications
2. Set up automated backups
3. Implement multi-signature wallets
4. Add more IoT sensor types
5. Enhance analytics dashboard