# Quick Start - Google OAuth Customer Authentication

## ✅ What's Been Implemented

You now have a complete Google OAuth authentication system for customers with:
- ✅ Google Sign-In integration
- ✅ MongoDB user profile storage
- ✅ 24-hour JWT session tokens
- ✅ Automatic session expiry and logout
- ✅ User profile management API

## 🚀 How to Use

### 1. Start the Servers

```bash
# Terminal 1 - Backend (already running on port 3000)
cd server && npm run dev

# Terminal 2 - Frontend (already running on port 5173)
npm run dev
```

### 2. Test Customer Login

1. Open browser: **http://localhost:5173/login.html**
2. Click **"Sign in with Google"** button
3. Select your Google account
4. You'll be redirected to the dashboard
5. Your profile is now stored in MongoDB!

### 3. Check MongoDB

Your user data is automatically saved in MongoDB with:
- Google ID
- Email
- Name
- Profile picture
- Login history
- Enrolled courses (empty initially)
- Subscription info
- Preferences

## 📋 API Endpoints Available

### Customer Authentication

**Login with Google:**
```javascript
POST /api/users/auth/google
Body: { "idToken": "google_id_token" }
```

**Get User Profile:**
```javascript
GET /api/users/profile
Headers: { "Authorization": "Bearer <token>" }
```

**Update Profile:**
```javascript
PUT /api/users/profile
Headers: { "Authorization": "Bearer <token>" }
Body: { "firstName": "John", "lastName": "Doe" }
```

**Get Basic Info:**
```javascript
GET /api/users/me
Headers: { "Authorization": "Bearer <token>" }
```

## 🔐 Session Management

### How It Works

1. **Login:** User signs in with Google
2. **Token Generated:** Backend creates 24-hour JWT token
3. **Token Stored:** Frontend stores token in localStorage
4. **Auto-Validation:** Every API call checks if session is still valid
5. **Auto-Logout:** After 24 hours, user is automatically logged out

### Session Data in Browser

```javascript
localStorage.getItem('wordwise_user_token')        // JWT token
localStorage.getItem('wordwise_user_session')      // 'authenticated'
localStorage.getItem('wordwise_user_login_time')   // Timestamp
localStorage.getItem('wordwise_user')              // User profile JSON
```

## 🧪 Testing

### Test Login Flow

```javascript
// In browser console after login:
import { authService } from './auth-service.js';

// Check if authenticated
console.log(authService.isAuthenticated()); // true

// Get current user
console.log(authService.getCurrentUser());

// Get token
console.log(authService.getBackendToken());
```

### Test Session Expiry

```javascript
// In browser console:
// Simulate expired session (25 hours ago)
const expired = Date.now() - (25 * 60 * 60 * 1000);
localStorage.setItem('wordwise_user_login_time', expired.toString());

// Refresh page - should redirect to login
location.reload();
```

### Test API Calls

```bash
# Get a token by logging in through the browser first
# Then copy the token from localStorage

# Test getting profile
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://localhost:3000/api/users/profile | jq .

# Test updating profile
curl -X PUT http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"firstName": "John", "preferences": {"theme": "dark"}}' | jq .
```

## 📊 User Profile Structure

When a user signs in, this data is stored in MongoDB:

```javascript
{
  googleId: "1234567890",
  email: "user@example.com",
  name: "John Doe",
  picture: "https://lh3.googleusercontent.com/...",
  emailVerified: true,
  enrolledCourses: [],
  subscription: {
    plan: "free",
    status: "active"
  },
  preferences: {
    language: "en",
    notifications: { email: true, push: true },
    theme: "auto"
  },
  lastLogin: "2024-12-16T...",
  loginCount: 1,
  isActive: true,
  createdAt: "2024-12-16T...",
  updatedAt: "2024-12-16T..."
}
```

## 🔧 Configuration

### Frontend Config (`config.js`)

```javascript
export const GOOGLE_CLIENT_ID = '740316754976-7drsbe3579buj6r6e6bckrubmul558qs.apps.googleusercontent.com';
export const APP_CONFIG = {
    apiUrl: 'http://localhost:3000/api'
};
```

### Backend Config (`server/.env`)

```env
GOOGLE_CLIENT_ID=740316754976-7drsbe3579buj6r6e6bckrubmul558qs.apps.googleusercontent.com
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
MONGODB_URI=mongodb+srv://...
```

## 🎯 Key Features

### ✅ Automatic User Creation
- First-time Google users are automatically created in MongoDB
- Returning users are updated with latest Google info

### ✅ Session Security
- 24-hour token expiration (both client and server)
- Automatic logout on expiry
- Token validation on every API call

### ✅ Profile Management
- Users can update their profile
- Track enrolled courses and progress
- Manage preferences and subscription

### ✅ Activity Tracking
- Last login timestamp
- Total login count
- Account status (active/inactive)

## 📝 Next Steps

### For Development:

1. **Test the login flow** - Sign in with your Google account
2. **Check MongoDB** - Verify user was created
3. **Test API endpoints** - Try getting/updating profile
4. **Test session expiry** - Simulate 24-hour timeout

### For Production:

1. **Update GOOGLE_CLIENT_ID** - Use production OAuth credentials
2. **Change JWT_SECRET** - Use a strong, random secret
3. **Enable HTTPS** - Required for production OAuth
4. **Update ALLOWED_ORIGINS** - Add production domain
5. **Set up monitoring** - Track authentication errors

## 🐛 Troubleshooting

### "Authentication failed" error
- Check GOOGLE_CLIENT_ID matches in frontend and backend
- Verify Google OAuth consent screen is configured
- Check network tab for API errors

### Session expires immediately
- Verify JWT_SECRET is set in backend .env
- Check server logs for JWT errors

### User not saved in MongoDB
- Verify MongoDB connection string
- Check MongoDB Atlas network access settings
- Look for errors in server logs

### CORS errors
- Verify ALLOWED_ORIGINS includes http://localhost:5173
- Check backend CORS configuration

## 📚 Documentation

For complete details, see:
- **GOOGLE_AUTH_INTEGRATION.md** - Full technical documentation
- **admin/SESSION_MANAGEMENT_README.md** - Admin session management
- **server/ADMIN_AUTH_README.md** - Admin authentication

## 🎉 You're All Set!

Your Google OAuth customer authentication is fully integrated and ready to use!

**Test it now:**
1. Go to http://localhost:5173/login.html
2. Click "Sign in with Google"
3. Check MongoDB to see your user profile!

