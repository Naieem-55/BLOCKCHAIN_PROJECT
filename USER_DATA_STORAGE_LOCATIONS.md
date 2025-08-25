# User Information Storage Locations

This document details where user information is stored across the entire blockchain supply chain system.

## 1. MongoDB Database (Primary Storage)

### Location
- **Connection**: `mongodb://localhost:27017/supply_chain_traceability`
- **Configuration**: `backend/config/database.js`
- **Local Database Path**: MongoDB default data directory (typically `C:\Program Files\MongoDB\Server\[version]\data` or `/data/db`)

### User Model Schema (`backend/models/User.js`)
```javascript
{
  email: String (unique, lowercase),
  password: String (hashed with bcrypt),
  name: String,
  role: String (admin/supplier/manufacturer/distributor/retailer/auditor/consumer),
  company: String,
  location: String,
  phone: String,
  walletAddress: String,
  userKey: String (unique, indexed) - Format: USR_ROLE_TIMESTAMP_RANDOM,
  avatar: String (URL),
  isActive: Boolean,
  isVerified: Boolean,
  verificationDate: Date,
  lastLogin: Date,
  createdBy: ObjectId,
  permissions: Array,
  profileComplete: Boolean,
  timestamps: {createdAt, updatedAt}
}
```

### Collections
- **users**: Stores all user account information
- **products**: References users via `currentOwner`, `createdBy`, `manufacturer` fields and stores `createdByUserKey`

## 2. Browser Local Storage (Frontend)

### Location
Browser's local storage (persistent across sessions)

### Stored Data
- **token**: JWT authentication token
- **user**: User object (in some components)
- **qr-scan-history**: QR code scanning history

### Access Points
- `frontend/src/store/authSlice.ts`: Token management
- `frontend/src/services/authService.ts`: Token operations
- `frontend/src/pages/TestLogin.tsx`: User object storage

## 3. Browser Session Storage (Frontend)

### Location
Browser's session storage (cleared when tab closes)

### Usage
- Cleared on logout for additional security
- No persistent user data stored here

## 4. Redis Cache (Optional)

### Location
- **Connection**: `redis://localhost:6379`
- **Configuration**: `backend/config/redis.js`

### Cached Data
- **Blacklisted tokens**: `blacklist_[token]` - Stores invalidated JWT tokens after logout
- **Temporary session data**: Can be used for session management
- **API response caching**: For performance optimization

## 5. Ethereum Blockchain (Smart Contracts)

### Contract: `SupplyChainTraceability.sol`

### Participant Storage
```solidity
struct Participant {
    address participantAddress;
    string name;
    string role;
    string location;
    string userKey;
    bool isActive;
    uint256 registeredAt;
}
```

### Mappings
- `mapping(address => uint256) addressToParticipantId`: Links wallet address to participant
- `mapping(string => uint256) userKeyToParticipantId`: Links user key to participant
- `mapping(uint256 => Participant) participants`: Stores participant data on-chain

### Blockchain Data Location
- **Local Development**: Ganache blockchain at `http://localhost:7545`
- **Network**: Depends on deployment (Mainnet, Testnet, or Private network)

## 6. In-Memory Storage (Runtime)

### Backend Server
- **JWT payload**: Contains `userId` during request processing
- **Request object**: `req.user` populated by auth middleware
- **Active sessions**: Managed in memory during runtime

### Frontend Application
- **Redux Store**: `frontend/src/store/authSlice.ts`
  - Current user object
  - Authentication status
  - Wallet connection info
  - User permissions

## Security Considerations

### Sensitive Data Protection
1. **Passwords**: Never stored in plain text, always hashed with bcrypt (12 rounds)
2. **User Keys**: Stored securely, used for additional validation
3. **Tokens**: JWT tokens with expiration, blacklisted on logout
4. **Wallet Private Keys**: NEVER stored - managed by MetaMask or wallet provider

### Data Access Control
1. **Database**: Protected by MongoDB authentication
2. **API**: JWT-based authentication required
3. **Smart Contracts**: Role-based access control (RBAC)
4. **Frontend**: Token validation for protected routes

## Data Flow

1. **Registration**: 
   - User data → MongoDB
   - User key generated → MongoDB & returned to user
   - If blockchain enabled → Participant registered on-chain

2. **Login**:
   - Credentials verified against MongoDB
   - JWT token generated → Local Storage
   - User object → Redux Store & optionally Local Storage

3. **Product Creation**:
   - User key validated against MongoDB
   - Product stored in MongoDB with `createdByUserKey`
   - If blockchain enabled → Product created on-chain

4. **Logout**:
   - Token blacklisted in Redis
   - Local Storage cleared
   - Session Storage cleared
   - Redux Store reset

## Backup and Recovery

### Database Backup
- MongoDB data should be regularly backed up
- User keys should be securely stored by users (cannot be recovered if lost)

### Blockchain Data
- Immutable once written
- Can be recovered from any blockchain node
- Smart contract state persists across all nodes

## Important File Locations

- **User Model**: `backend/models/User.js`
- **Auth Routes**: `backend/routes/auth.js`
- **Database Config**: `backend/config/database.js`
- **Redis Config**: `backend/config/redis.js`
- **Auth Service**: `frontend/src/services/authService.ts`
- **Auth Store**: `frontend/src/store/authSlice.ts`
- **Smart Contract**: `contracts/SupplyChainTraceability.sol`