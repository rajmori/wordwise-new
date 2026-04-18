# Admin Session Management - 24 Hour Token System

## Overview
All admin pages now enforce a **24-hour session timeout** with automatic logout when the session expires. The session is validated on every page load and before every API call.

## Features Implemented

### ✅ 24-Hour Session Duration
- Admin sessions automatically expire after 24 hours from login
- Session time is tracked using login timestamp in localStorage
- Automatic logout when session expires

### ✅ Token-Based Authentication
- JWT tokens from MongoDB authentication
- Tokens validated on every API call
- Server-side token expiry (401) triggers automatic logout

### ✅ Automatic Session Validation
- Session checked on every admin page load
- Session checked before every API call
- Invalid/expired sessions redirect to login page

### ✅ Centralized Auth Utility
- Shared `auth-utils.js` module for all admin pages
- Consistent authentication logic across all pages
- Easy to maintain and update

## Files Modified

### New Files
1. **`admin/auth-utils.js`** - Shared authentication utility module

### Updated Files
1. **`admin/admin.js`** - Uses shared auth utility
2. **`admin/course-management.js`** - Session validation on page load and API calls
3. **`admin/course-editor.js`** - Session validation on page load and API calls

## How It Works

### 1. Login Process
```javascript
// When admin logs in successfully:
saveLoginSession(token, adminInfo);
// This stores:
// - wordwise_admin_token: JWT token
// - wordwise_admin_session: 'authenticated'
// - wordwise_admin_login_time: timestamp
// - wordwise_admin_info: admin user data
```

### 2. Session Validation
```javascript
// On every page load:
requireAuth(true); // Shows alert if session expired

// Before every API call:
const token = getAdminToken(); // Returns null if expired
```

### 3. Automatic Logout
Session expires and auto-logout occurs when:
- 24 hours have passed since login
- Token is missing or invalid
- Server returns 401 Unauthorized
- User manually logs out

## Admin Pages Protected

All admin pages now have session validation:

1. **`admin/dashboard.html`** - User management dashboard
2. **`admin/courses.html`** - Course listing page
3. **`admin/course-editor.html`** - Course creation/editing page
4. **`admin/login.html`** - Login page (redirects if already authenticated)

## API Calls Protected

All API calls now validate session before execution:
- Course listing
- Course creation
- Course editing
- Course deletion
- Course publishing
- File uploads
- All other admin operations

## Session Storage

Data stored in localStorage:
```javascript
{
  "wordwise_admin_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "wordwise_admin_session": "authenticated",
  "wordwise_admin_login_time": "1734336000000",
  "wordwise_admin_info": "{\"id\":\"...\",\"email\":\"...\",\"name\":\"...\",\"role\":\"...\"}"
}
```

## Utility Functions Available

### `isAdminAuthenticated()`
Returns true if admin has valid 24-hour session

### `requireAuth(showAlert)`
Redirects to login if not authenticated. Shows alert if `showAlert=true`

### `getAdminToken()`
Returns valid token or null if expired

### `getAdminInfo()`
Returns admin user information object

### `saveLoginSession(token, adminInfo)`
Saves login session data after successful authentication

### `clearAdminSession()`
Clears all session data from localStorage

### `logout()`
Logs out admin and redirects to login page

### `getRemainingSessionTime()`
Returns hours remaining in current session

## Testing Session Expiry

### Test Immediate Expiry (for development)
```javascript
// In browser console:
// Set login time to 25 hours ago
const twentyFiveHoursAgo = Date.now() - (25 * 60 * 60 * 1000);
localStorage.setItem('wordwise_admin_login_time', twentyFiveHoursAgo.toString());

// Refresh page or make API call - should auto-logout
```

### Test Valid Session
```javascript
// In browser console:
import { getRemainingSessionTime } from './auth-utils.js';
console.log('Hours remaining:', getRemainingSessionTime());
```

## Security Features

1. **Client-Side Validation**: Session time checked in browser
2. **Server-Side Validation**: JWT token validated on server (24h expiry)
3. **Double Protection**: Both client and server enforce 24-hour limit
4. **Automatic Cleanup**: Session data cleared on logout/expiry
5. **No Sensitive Data**: Only token stored, no passwords in localStorage

## User Experience

### On Session Expiry
1. User sees alert: "Your session has expired. Please login again."
2. All session data is cleared
3. User is redirected to login page
4. User must re-authenticate to continue

### During Active Session
1. User can navigate freely between admin pages
2. All API calls work seamlessly
3. No interruptions for 24 hours
4. Session persists across browser tabs

## Troubleshooting

### Issue: Session expires immediately after login
**Solution**: Check that login timestamp is being saved correctly

### Issue: Session doesn't expire after 24 hours
**Solution**: Verify `SESSION_DURATION_HOURS` constant in `auth-utils.js`

### Issue: API calls fail with 401
**Solution**: Check that JWT_SECRET matches between client and server

### Issue: Redirect loop on login page
**Solution**: Ensure login page doesn't call `requireAuth()`

## Next Steps (Optional Enhancements)

1. **Session Extension**: Add "Remember Me" for 7-day sessions
2. **Activity Tracking**: Reset timer on user activity
3. **Session Warning**: Show warning 5 minutes before expiry
4. **Multiple Sessions**: Track sessions across devices
5. **Session Analytics**: Log session duration and patterns

