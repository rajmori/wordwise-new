# Admin Authentication System

## Overview
The admin authentication system now uses MongoDB to store and validate admin user credentials instead of hardcoded values.

## Features
- ✅ MongoDB-based admin user storage
- ✅ Bcrypt password hashing (10 salt rounds)
- ✅ JWT token generation (24-hour expiration)
- ✅ Last login tracking
- ✅ Active/inactive user status
- ✅ Role-based access (admin, super_admin)

## Files Modified/Created

### New Files
1. **`server/models/Admin.js`** - Mongoose model for admin users
2. **`server/seed-admin.js`** - Script to create default admin user

### Modified Files
1. **`server/middleware/auth.js`** - Updated to use MongoDB for authentication
2. **`server/routes/authRoutes.js`** - Updated login route to be async

## Admin Model Schema

```javascript
{
  email: String (required, unique, lowercase)
  password: String (required, hashed with bcrypt)
  name: String (required)
  role: String (enum: ['admin', 'super_admin'], default: 'admin')
  isActive: Boolean (default: true)
  lastLogin: Date
  createdAt: Date
  updatedAt: Date
}
```

## Default Admin Credentials

**Email:** admin@wordwise.com  
**Password:** admin123  
**Role:** super_admin

⚠️ **IMPORTANT:** Change the password after first login in production!

## How to Create Admin Users

### Method 1: Using the Seed Script
```bash
cd server
node seed-admin.js
```

### Method 2: Manually in MongoDB
```javascript
// Connect to MongoDB and run:
const admin = new Admin({
  email: 'newadmin@wordwise.com',
  password: 'securepassword', // Will be hashed automatically
  name: 'Admin Name',
  role: 'admin',
  isActive: true
});
await admin.save();
```

### Method 3: Create an API endpoint (recommended for production)
Add a protected route that only super_admins can access to create new admins.

## API Endpoints

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@wordwise.com",
  "password": "admin123"
}

# Response:
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "694114ad8c15cc0082a5a21d",
    "email": "admin@wordwise.com",
    "name": "WordWise Admin",
    "role": "super_admin"
  }
}
```

## Testing

### Test Valid Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@wordwise.com", "password": "admin123"}'
```

### Test Invalid Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@wordwise.com", "password": "wrongpassword"}'
```

## Security Features

1. **Password Hashing**: Passwords are hashed using bcrypt with 10 salt rounds
2. **JWT Tokens**: Secure token-based authentication with 24-hour expiration
3. **Password Hiding**: Password field is excluded from JSON responses
4. **Active Status**: Deactivated accounts cannot login
5. **Role-Based Access**: Different permission levels (admin, super_admin)

## Next Steps (Recommended)

1. **Add Password Change Endpoint**: Allow admins to change their password
2. **Add Admin Management UI**: Create interface for super_admins to manage other admins
3. **Add Password Reset**: Implement forgot password functionality
4. **Add Email Verification**: Verify admin email addresses
5. **Add Audit Logging**: Track admin actions for security
6. **Add Rate Limiting**: Prevent brute force attacks on login endpoint
7. **Add 2FA**: Two-factor authentication for enhanced security

## Environment Variables Required

Make sure these are set in `server/.env`:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

