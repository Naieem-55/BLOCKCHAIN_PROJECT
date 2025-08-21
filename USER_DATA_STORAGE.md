# User Registration Data Storage

## Where User Data is Saved

User registration data is stored in **MongoDB database** with the following details:

### Database Configuration:
- **Database Name**: `supply_chain_traceability`
- **Collection**: `users`
- **Connection**: `mongodb://localhost:27017/supply_chain_traceability`
- **Location**: Local MongoDB instance on your computer

### Data Structure:
```javascript
{
  _id: ObjectId,           // Unique user ID
  email: String,           // User's email (unique)
  password: String,        // Encrypted password (bcrypt)
  name: String,           // Full name
  role: String,           // supplier, manufacturer, etc.
  company: String,        // Company name (optional)
  location: String,       // Location (optional)
  phone: String,          // Phone number (optional)
  walletAddress: String,  // Blockchain wallet (optional)
  avatar: String,         // Profile picture URL (optional)
  isActive: Boolean,      // Account status
  isVerified: Boolean,    // Email verification status
  lastLogin: Date,        // Last login timestamp
  createdAt: Date,        // Registration date
  updatedAt: Date,        // Last update date
  permissions: Array      // User permissions
}
```

### Security Features:
1. **Password Encryption**: Passwords are hashed using bcrypt
2. **Unique Email**: Each email can only register once
3. **Input Validation**: All data is validated before saving
4. **Secure Fields**: Password is excluded from queries by default

## How to View User Data

### Option 1: Use the Custom Script
```bash
cd backend
node view-users.js
```

### Option 2: MongoDB Shell (if installed)
```bash
mongosh
use supply_chain_traceability
db.users.find().pretty()
```

### Option 3: MongoDB Compass (GUI)
- Connect to: `mongodb://localhost:27017`
- Database: `supply_chain_traceability`
- Collection: `users`

## Current Registered Users

Based on the database query, there is currently **1 user** registered:

```
👤 User: Test User
   Email: test@example.com
   Role: supplier
   Status: Active
   Registered: Aug 21, 2025
   Last Login: Aug 21, 2025
```

## Registration Process Flow

1. **User fills registration form** (frontend)
2. **Data sent to backend** via POST `/api/auth/register`
3. **Server validates data** (email format, password strength, etc.)
4. **Password is encrypted** using bcrypt
5. **User document saved** to MongoDB `users` collection
6. **JWT token generated** for authentication
7. **Response sent back** with user info (excluding password)

## File Locations

- **User Model**: `backend/models/User.js`
- **Registration Route**: `backend/routes/auth.js`
- **Database Config**: `backend/config/database.js`
- **View Script**: `backend/view-users.js`

## Backup and Data Management

The data is stored locally in MongoDB. To backup:
```bash
mongodump --db supply_chain_traceability
```

To restore:
```bash
mongorestore --db supply_chain_traceability dump/supply_chain_traceability/
```