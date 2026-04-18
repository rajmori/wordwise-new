# Google OAuth Integration with MongoDB - Customer Authentication

## Overview
This document describes the complete Google OAuth integration for customer signup/signin with MongoDB-based user profile management and 24-hour JWT session tokens.

## Architecture

### Flow Diagram
```
User clicks "Sign in with Google"
    ↓
Google OAuth (Frontend)
    ↓
Google ID Token received
    ↓
Send ID Token to Backend API
    ↓
Backend verifies token with Google
    ↓
Create/Update user in MongoDB
    ↓
Generate 24-hour JWT session token
    ↓
Return token + user profile to frontend
    ↓
Store token in localStorage
    ↓
User authenticated for 24 hours
```

## Backend Implementation

### 1. User Model (`server/models/User.js`)

MongoDB schema for customer users with the following fields:

**Google OAuth Fields:**
- `googleId` - Unique Google user ID (required, indexed)
- `email` - User email from Google (required, unique)
- `name` - Full name from Google
- `picture` - Profile picture URL
- `emailVerified` - Email verification status

**Profile Fields:**
- `firstName`, `lastName` - Optional name fields
- `enrolledCourses` - Array of enrolled courses with progress tracking
- `subscription` - Subscription plan and status
- `preferences` - User preferences (language, notifications, theme)

**Activity Tracking:**
- `lastLogin` - Last login timestamp
- `loginCount` - Total number of logins
- `isActive` - Account status
- `createdAt`, `updatedAt` - Timestamps

### 2. Authentication Controller (`server/controllers/userAuthController.js`)

**`googleAuth(req, res)`**
- Receives Google ID token from frontend
- Verifies token with Google OAuth2Client
- Extracts user info (googleId, email, name, picture)
- Creates new user or updates existing user in MongoDB
- Updates last login timestamp
- Generates 24-hour JWT session token
- Returns token and user profile

**`getUserProfile(req, res)`**
- Protected route (requires authentication)
- Returns full user profile with enrolled courses

**`updateUserProfile(req, res)`**
- Protected route (requires authentication)
- Updates user profile fields (firstName, lastName, preferences)

### 3. Authentication Middleware (`server/middleware/userAuth.js`)

**`authenticateUser`**
- Extracts JWT token from Authorization header
- Verifies token signature and expiration
- Checks if user exists and is active
- Attaches user info to request object
- Returns 401 if token is invalid/expired

**`optionalAuth`**
- Same as authenticateUser but doesn't fail if no token
- Used for routes that work for both authenticated and guest users

### 4. User Routes (`server/routes/userRoutes.js`)

- `POST /api/users/auth/google` - Google OAuth authentication (public)
- `GET /api/users/profile` - Get full user profile (protected)
- `PUT /api/users/profile` - Update user profile (protected)
- `GET /api/users/me` - Get basic user info (protected)

### 5. Environment Variables (`.env`)

```env
GOOGLE_CLIENT_ID=740316754976-7drsbe3579buj6r6e6bckrubmul558qs.apps.googleusercontent.com
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
MONGODB_URI=mongodb+srv://...
```

## Frontend Implementation

### 1. Updated Auth Service (`auth-service.js`)

**Key Changes:**

**`handleCredentialResponse(response, callback)`** - Now async
- Sends Google ID token to backend `/api/users/auth/google`
- Receives backend JWT token (24-hour session)
- Stores token using `storeBackendToken()`
- Stores user profile in localStorage

**`storeBackendToken(token)`** - New method
- Stores JWT token in `wordwise_user_token`
- Stores session flag in `wordwise_user_session`
- Stores login timestamp in `wordwise_user_login_time`

**`getBackendToken()`** - New method
- Retrieves token from localStorage
- Validates 24-hour session duration
- Returns null if expired (auto-logout)

**`isAuthenticated()`** - Updated
- Uses `getBackendToken()` instead of legacy token check
- Validates both token existence and 24-hour session

**`logout()`** - Updated
- Clears all session data (legacy + new tokens)
- Signs out from Google

**`handleOAuthCallback()`** - Updated
- Sends ID token to backend for verification
- Stores backend JWT token instead of Google token

### 2. Configuration (`config.js`)

Added `apiUrl` to APP_CONFIG:
```javascript
export const APP_CONFIG = {
    // ... other config
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
};
```

## Session Management

### 24-Hour Session Duration

**Client-Side Validation:**
- Login timestamp stored in localStorage
- Every `getBackendToken()` call checks if 24 hours have passed
- Auto-logout if session expired

**Server-Side Validation:**
- JWT token has 24-hour expiration (`expiresIn: '24h'`)
- Server validates token on every protected route
- Returns 401 if token expired

### Session Data in localStorage

```javascript
{
  "wordwise_user_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "wordwise_user_session": "authenticated",
  "wordwise_user_login_time": "1734336000000",
  "wordwise_user": "{\"id\":\"...\",\"email\":\"...\",\"name\":\"...\"}"
}
```

## API Endpoints

### Public Endpoints

**POST /api/users/auth/google**
```json
Request:
{
  "idToken": "google_id_token_here"
}

Response (Success):
{
  "success": true,
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "googleId": "google_id",
    "email": "user@example.com",
    "name": "User Name",
    "picture": "https://...",
    "emailVerified": true,
    "subscription": {...},
    "enrolledCourses": [...],
    "preferences": {...},
    "lastLogin": "2024-12-16T...",
    "createdAt": "2024-12-16T..."
  }
}

Response (Error):
{
  "success": false,
  "message": "Authentication failed. Please try again."
}
```

### Protected Endpoints

All protected endpoints require Authorization header:
```
Authorization: Bearer <jwt_token>
```

**GET /api/users/profile**
- Returns full user profile with populated enrolled courses

**PUT /api/users/profile**
```json
Request:
{
  "firstName": "John",
  "lastName": "Doe",
  "preferences": {
    "language": "en",
    "theme": "dark"
  }
}
```

**GET /api/users/me**
- Returns basic user info (id, email, name, picture, subscription)

## Testing

### Test Google OAuth Flow

1. **Start servers:**
```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
npm run dev
```

2. **Open browser:**
```
http://localhost:5173/login.html
```

3. **Click "Sign in with Google"**
- Select Google account
- Frontend receives Google ID token
- Token sent to backend
- Backend verifies with Google
- User created/updated in MongoDB
- JWT token returned
- User redirected to dashboard

### Test Session Expiry

```javascript
// In browser console:
// Set login time to 25 hours ago
const expired = Date.now() - (25 * 60 * 60 * 1000);
localStorage.setItem('wordwise_user_login_time', expired.toString());

// Try to make an API call or refresh page
// Should auto-logout and redirect to login
```

### Test API Endpoints

```bash
# 1. Login and get token (use real Google ID token)
TOKEN=$(curl -X POST http://localhost:3000/api/users/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken": "REAL_GOOGLE_ID_TOKEN"}' | jq -r '.token')

# 2. Get user profile
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/users/profile | jq .

# 3. Update profile
curl -X PUT http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"firstName": "John", "lastName": "Doe"}' | jq .
```

## Security Features

1. **Google Token Verification** - Backend verifies ID token with Google servers
2. **JWT Tokens** - Secure session tokens with 24-hour expiration
3. **Double Validation** - Both client and server enforce 24-hour limit
4. **Active User Check** - Middleware checks if user account is active
5. **No Password Storage** - OAuth-only authentication
6. **HTTPS Ready** - Works with production HTTPS endpoints

## Database Schema

Users are stored in MongoDB `users` collection with automatic indexing on:
- `googleId` (unique)
- `email` (unique)

## Next Steps (Optional Enhancements)

1. **Email Notifications** - Send welcome email on first signup
2. **Profile Completion** - Prompt users to complete profile after first login
3. **Social Features** - Add profile visibility settings
4. **Activity Logging** - Track user actions and learning progress
5. **Subscription Management** - Integrate payment gateway
6. **Multi-device Sessions** - Track sessions across devices
7. **Refresh Tokens** - Implement refresh token flow for extended sessions
8. **Account Deletion** - Add GDPR-compliant account deletion

## Troubleshooting

### Issue: "Authentication failed" error
**Solution:** Check that GOOGLE_CLIENT_ID matches in both frontend and backend

### Issue: Token expired immediately
**Solution:** Verify JWT_SECRET is set in backend .env file

### Issue: User not created in MongoDB
**Solution:** Check MongoDB connection string and network access

### Issue: CORS errors
**Solution:** Verify ALLOWED_ORIGINS includes frontend URL (http://localhost:5173)

## Files Modified/Created

### Backend Files Created:
- `server/models/User.js`
- `server/controllers/userAuthController.js`
- `server/middleware/userAuth.js`
- `server/routes/userRoutes.js`

### Backend Files Modified:
- `server/server.js` - Added user routes
- `server/.env` - Added GOOGLE_CLIENT_ID

### Frontend Files Modified:
- `auth-service.js` - Updated to use backend authentication
- `config.js` - Added apiUrl to APP_CONFIG

### Documentation Created:
- `GOOGLE_AUTH_INTEGRATION.md` (this file)

## Dependencies Added

```bash
cd server && npm install google-auth-library
```

Package: `google-auth-library@^9.x.x`

