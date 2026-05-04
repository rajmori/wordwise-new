# Complete Google OAuth 2.0 Authentication Implementation

## 📋 Overview

This is a complete, secure Node.js/Express.js backend service for user authentication with MongoDB (using Mongoose) that implements Google OAuth 2.0 with JWT session management.

---

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Google OAuth 2.0 (google-auth-library)
- **Session Management**: JSON Web Tokens (JWT)
- **Token Expiry**: 4 hours

---

## 🔐 Authentication Logic

### **Signup (Registration) Flow**

**Endpoint**: `POST /api/users/auth/google/signup`

1. User initiates signup using Google account via OAuth flow
2. Backend verifies Google ID token
3. Check if user exists in MongoDB by `googleId`
4. **If user EXISTS**: Return `409 Conflict` with message: "Account already exists. Please use the sign-in option."
5. **If user NOT found**: Create new user record in MongoDB
6. Generate JWT Access Token (4-hour expiry)
7. Return token and user data to client

### **Signin (Login) Flow**

**Endpoint**: `POST /api/users/auth/google/signin`

1. User initiates signin using Google account via OAuth flow
2. Backend verifies Google ID token
3. Check if user exists in MongoDB by `googleId`
4. **CRUCIAL LOGIC**: If user NOT found, return `401 Unauthorized` with message: "Account not found. Please register a new account using the sign-up option."
5. **If user EXISTS**: Update user info and last login timestamp
6. Generate JWT Access Token (4-hour expiry)
7. Return token and user data to client

### **Legacy Combined Endpoint**

**Endpoint**: `POST /api/users/auth/google`

- Automatically creates account if not exists, or logs in if exists
- Kept for backward compatibility

---

## 📁 File Structure

```
server/
├── models/
│   └── User.js                    # Mongoose User Schema
├── controllers/
│   └── userAuthController.js      # Authentication logic
├── middleware/
│   └── userAuth.js                # JWT authentication middleware
├── routes/
│   └── userRoutes.js              # API routes
├── .env                           # Environment variables
└── server.js                      # Express server setup
```

---

## 🗄️ MongoDB User Schema

**File**: `server/models/User.js`

### Required Fields:
- `googleId` (String, required, unique, indexed)
- `email` (String, required, unique, lowercase)
- `name` (String, required)
- `picture` (String, default: '')
- `emailVerified` (Boolean, default: false)
- `createdAt` (Date, auto-generated)
- `lastLogin` (Date)
- `loginCount` (Number)
- `isActive` (Boolean, default: true)

### Additional Fields:
- `subscription` (Object with plan and status)
- `enrolledCourses` (Array of course enrollments)
- `preferences` (Object with user settings)

---

## 🔑 Environment Variables

**File**: `server/.env`

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/wordwise?retryWrites=true&w=majority

# JWT Secret (use a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars

# Google OAuth Client ID
GOOGLE_CLIENT_ID=287458285838-c1noct3nue62klke4gjv0svhqa725l8p.apps.googleusercontent.com

# Server Port
PORT=3000

# Node Environment
NODE_ENV=development
```

---

## 🚀 API Endpoints

### **Public Endpoints**

#### 1. **Signup (Registration)**
```http
POST /api/users/auth/google/signup
Content-Type: application/json

{
  "idToken": "google_id_token_here"
}
```

**Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "Account created successfully",
  "token": "jwt_access_token_here",
  "user": {
    "id": "user_mongodb_id",
    "googleId": "google_user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "picture": "https://...",
    "emailVerified": true,
    "subscription": { "plan": "free", "status": "active" },
    "createdAt": "2024-12-16T10:00:00.000Z"
  }
}
```

**Error Response (409 Conflict)** - User already exists:
```json
{
  "success": false,
  "message": "Account already exists. Please use the sign-in option."
}
```

#### 2. **Signin (Login)**
```http
POST /api/users/auth/google/signin
Content-Type: application/json

{
  "idToken": "google_id_token_here"
}
```

**Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt_access_token_here",
  "user": { ... }
}
```

**Error Response (401 Unauthorized)** - User not found:
```json
{
  "success": false,
  "message": "Account not found. Please register a new account using the sign-up option."
}
```

---

### **Protected Endpoints** (Require JWT Token)

#### 3. **Get User Profile**
```http
GET /api/users/profile
Authorization: Bearer <jwt_token>
```

**Success Response (200 OK)**:
```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "...",
    "name": "...",
    "picture": "...",
    "subscription": { ... },
    "enrolledCourses": [ ... ],
    "preferences": { ... }
  }
}
```

**Error Response (401 Unauthorized)** - Invalid/Expired Token:
```json
{
  "success": false,
  "message": "Session expired. Please login again."
}
```

#### 4. **Update User Profile**
```http
PUT /api/users/profile
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "preferences": {
    "language": "en",
    "theme": "dark"
  }
}
```

---

## 🔒 JWT Token Management

### **Token Generation**
- **Algorithm**: HS256 (HMAC with SHA-256)
- **Expiry**: 4 hours (`expiresIn: '4h'`)
- **Payload**:
  ```json
  {
    "id": "user_mongodb_id",
    "googleId": "google_user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "iat": 1702728000,
    "exp": 1702742400
  }
  ```

### **Token Verification**
- Middleware: `authenticateUser` in `server/middleware/userAuth.js`
- Validates token signature and expiration
- Checks if user exists and is active
- Attaches user info to `req.user`

---

## 📦 Installation & Setup

### **1. Install Dependencies**
```bash
cd server
npm install express mongoose jsonwebtoken google-auth-library dotenv cors express-validator bcryptjs
```

### **2. Configure Environment Variables**
Create `server/.env` file with the variables listed above.

### **3. Start MongoDB**
Make sure MongoDB Atlas is running and connection string is correct.

### **4. Start Server**
```bash
cd server
npm run dev
```

Server will start on `http://localhost:3000`

---

## ✅ Testing the Implementation

### **Test Signup**
```bash
curl -X POST http://localhost:3000/api/users/auth/google/signup \
  -H "Content-Type: application/json" \
  -d '{"idToken": "YOUR_GOOGLE_ID_TOKEN"}'
```

### **Test Signin**
```bash
curl -X POST http://localhost:3000/api/users/auth/google/signin \
  -H "Content-Type: application/json" \
  -d '{"idToken": "YOUR_GOOGLE_ID_TOKEN"}'
```

### **Test Protected Route**
```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

---

## 📝 Complete Code Examples

### **User Model** (`server/models/User.js`)

```javascript
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    // Required fields for Google OAuth
    googleId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    name: {
        type: String,
        required: true
    },
    picture: {
        type: String,
        default: ''
    },
    emailVerified: {
        type: Boolean,
        default: false
    },

    // Additional fields
    subscription: {
        plan: {
            type: String,
            enum: ['free', 'basic', 'premium', 'enterprise'],
            default: 'free'
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'cancelled', 'expired'],
            default: 'active'
        }
    },

    enrolledCourses: [{
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course'
        },
        progress: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        completedLessons: [{ type: String }],
        enrolledAt: {
            type: Date,
            default: Date.now
        }
    }],

    preferences: {
        language: {
            type: String,
            default: 'en'
        },
        notifications: {
            email: { type: Boolean, default: true },
            push: { type: Boolean, default: true }
        },
        theme: {
            type: String,
            enum: ['light', 'dark', 'auto'],
            default: 'auto'
        }
    },

    // Activity tracking
    lastLogin: {
        type: Date,
        default: Date.now
    },
    loginCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true // Adds createdAt and updatedAt
});

// Method to update last login
userSchema.methods.updateLastLogin = async function() {
    this.lastLogin = new Date();
    this.loginCount += 1;
    await this.save();
};

// Method to enroll in a course
userSchema.methods.enrollInCourse = async function(courseId) {
    const alreadyEnrolled = this.enrolledCourses.some(
        course => course.courseId.toString() === courseId.toString()
    );

    if (!alreadyEnrolled) {
        this.enrolledCourses.push({ courseId });
        await this.save();
    }
};

const User = mongoose.model('User', userSchema);

export default User;
```

---

### **Authentication Controller** (`server/controllers/userAuthController.js`)

See the complete implementation in the file - it includes:
- `googleSignup()` - Registration endpoint
- `googleSignin()` - Login endpoint with strict validation
- `googleAuth()` - Legacy combined endpoint
- `getUserProfile()` - Get user profile
- `updateUserProfile()` - Update user profile

Key features:
- ✅ Verifies Google ID tokens
- ✅ Enforces signup/signin separation
- ✅ Generates 4-hour JWT tokens
- ✅ Proper error handling
- ✅ Detailed logging

---

### **JWT Middleware** (`server/middleware/userAuth.js`)

See the complete implementation in the file - it includes:
- `authenticateUser()` - Protects routes requiring authentication
- `optionalAuth()` - Optional authentication for public routes

Key features:
- ✅ Validates JWT signature
- ✅ Checks token expiration
- ✅ Verifies user exists and is active
- ✅ Attaches user info to request
- ✅ Proper error messages

---

### **Routes** (`server/routes/userRoutes.js`)

```javascript
import express from 'express';
import {
    googleSignup,
    googleSignin,
    googleAuth,
    getUserProfile,
    updateUserProfile
} from '../controllers/userAuthController.js';
import { authenticateUser } from '../middleware/userAuth.js';

const router = express.Router();

// Public routes
router.post('/auth/google/signup', googleSignup);
router.post('/auth/google/signin', googleSignin);
router.post('/auth/google', googleAuth); // Legacy

// Protected routes
router.get('/profile', authenticateUser, getUserProfile);
router.put('/profile', authenticateUser, updateUserProfile);
router.get('/me', authenticateUser, (req, res) => {
    res.json({ success: true, user: req.user });
});

export default router;
```

---

## 🎯 Key Implementation Details

### **1. Separate Signup and Signin**
- **Signup**: Creates new user, returns 409 if exists
- **Signin**: Requires existing user, returns 401 if not found
- **Legacy**: Auto-creates or logs in (backward compatibility)

### **2. JWT Token Expiry**
- **Duration**: 4 hours (as per requirements)
- **Validation**: Server-side verification on every protected route
- **Error Handling**: Clear messages for expired tokens

### **3. Security Features**
- ✅ Google ID token verification
- ✅ JWT signature validation
- ✅ User active status check
- ✅ HTTPS recommended for production
- ✅ Environment variable protection

### **4. Error Handling**
- ✅ 400 Bad Request - Missing/invalid input
- ✅ 401 Unauthorized - Invalid/expired token, user not found
- ✅ 403 Forbidden - Inactive account
- ✅ 409 Conflict - User already exists (signup)
- ✅ 500 Internal Server Error - Server issues

---

## 🔄 Frontend Integration

### **Signup Flow**
```javascript
// After Google OAuth popup
const response = await fetch('http://localhost:3000/api/users/auth/google/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: googleIdToken })
});

const data = await response.json();

if (data.success) {
    // Store JWT token
    localStorage.setItem('access_token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    // Redirect to dashboard
} else {
    // Show error: "Account already exists..."
}
```

### **Signin Flow**
```javascript
// After Google OAuth popup
const response = await fetch('http://localhost:3000/api/users/auth/google/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: googleIdToken })
});

const data = await response.json();

if (data.success) {
    // Store JWT token
    localStorage.setItem('access_token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    // Redirect to dashboard
} else {
    // Show error: "Account not found. Please register..."
}
```

### **Protected API Calls**
```javascript
const token = localStorage.getItem('access_token');

const response = await fetch('http://localhost:3000/api/users/profile', {
    headers: {
        'Authorization': `Bearer ${token}`
    }
});

if (response.status === 401) {
    // Token expired, redirect to login
    localStorage.clear();
    window.location.href = '/login.html';
}
```

---

**Implementation Complete!** ✅

All code is production-ready and follows best practices for security, error handling, and maintainability.

