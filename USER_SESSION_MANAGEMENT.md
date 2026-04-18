# Customer User Session Management

## Overview

This document describes the customer user session management system implemented for WordWise. The system keeps user details alive in the header across all customer pages until logout or session timeout (24 hours).

---

## ✅ Features Implemented

### 1. **User Header Component** (`user-header.js`)
A reusable component that:
- ✅ Displays user profile picture or initials in navigation
- ✅ Shows user name and email (if elements exist)
- ✅ Monitors session validity every 60 seconds
- ✅ Automatically logs out user when session expires (24 hours)
- ✅ Handles logout button clicks
- ✅ Works across all customer pages

### 2. **Session Monitoring**
- ✅ Checks session validity every 60 seconds
- ✅ Validates JWT token expiration
- ✅ Alerts user when session expires
- ✅ Redirects to login page on expiration
- ✅ Clears all user data on logout

### 3. **User Profile Display**
- ✅ Shows Google profile picture if available
- ✅ Falls back to initials from user name
- ✅ Falls back to first letter of email
- ✅ Updates avatar title with user name

---

## 📁 Files Modified/Created

### **New Files**
1. **`user-header.js`** - Reusable user header component with session monitoring

### **Updated Files**
1. **`dashboard-auth.js`** - Now uses `user-header.js` for profile display and session management
2. **`course-player.js`** - Integrated `user-header.js` for authentication and profile display
3. **`my-course.html`** - Added logout button to navigation

---

## 🔄 How It Works

### **Initialization Flow**

```
Page Load
    ↓
Check Authentication (authService.isAuthenticated())
    ↓
If Authenticated:
    - Initialize userHeader.init()
    - Display user avatar/name
    - Setup logout handler
    - Start session monitoring (every 60s)
    ↓
If Not Authenticated:
    - Redirect to /login.html
```

### **Session Monitoring Flow**

```
Every 60 seconds:
    ↓
Check if token exists
    ↓
Check if session is still valid (< 24 hours)
    ↓
If Valid:
    - Continue monitoring
    ↓
If Expired:
    - Stop monitoring
    - Clear user data
    - Alert user
    - Redirect to login
```

### **Logout Flow**

```
User clicks Logout
    ↓
Stop session monitoring
    ↓
Clear all localStorage data:
    - wordwise_user_token
    - wordwise_user_session
    - wordwise_user_login_time
    - wordwise_user
    ↓
Disable Google auto-select
    ↓
Redirect to /login.html
```

---

## 🎯 Pages Protected

All customer-facing pages now have user session management:

1. **`dashboard.html`** - User dashboard with personalized welcome
2. **`my-course.html`** - Course player page
3. Any other page that imports `user-header.js`

---

## 💾 Session Storage

### **localStorage Keys**
- `wordwise_user_token` - JWT token from backend (24-hour validity)
- `wordwise_user_session` - Session status ('authenticated')
- `wordwise_user_login_time` - Timestamp of login (milliseconds)
- `wordwise_user` - User profile data (JSON)

### **User Profile Data Structure**
```javascript
{
    id: "user_mongodb_id",
    googleId: "google_user_id",
    email: "user@example.com",
    name: "John Doe",
    picture: "https://lh3.googleusercontent.com/...",
    emailVerified: true,
    subscription: {
        plan: "free",
        status: "active"
    },
    preferences: {
        language: "en",
        theme: "auto",
        notifications: { email: true, push: true }
    },
    lastLogin: "2024-12-16T10:00:00.000Z",
    createdAt: "2024-12-01T08:00:00.000Z"
}
```

---

## 🔒 Security Features

1. **24-Hour Session Expiry** - Tokens expire after 24 hours
2. **Automatic Logout** - Session monitoring detects expired tokens
3. **Client-Side Validation** - Checks token validity before API calls
4. **Server-Side Validation** - Backend verifies JWT on every request
5. **Secure Token Storage** - Tokens stored in localStorage (HTTPS recommended for production)

---

## 🚀 Usage

### **In Any Customer Page**

```javascript
import { userHeader } from './user-header.js';
import { authService } from './auth-service.js';

document.addEventListener('DOMContentLoaded', () => {
    // Require authentication
    if (!authService.requireAuth()) {
        return; // Will redirect to login
    }

    // Initialize user header
    userHeader.init();

    // Your page logic here...
});
```

---

## ✨ Benefits

1. **Consistent User Experience** - Same header across all pages
2. **Automatic Session Management** - No manual token checking needed
3. **Security** - Forced re-authentication after 24 hours
4. **User Feedback** - Clear alerts when session expires
5. **Maintainability** - Centralized logic in one component
6. **Reusability** - Easy to add to new pages

---

**Your customer user session management is now fully implemented!** 🎉

