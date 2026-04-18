# Annual Subscription System - Refactor Summary

## 🎯 Overview

This document summarizes the comprehensive review and refactoring of the WordWise backend to implement a complete **Razorpay-based annual subscription system** for the e-learning platform.

---

## ✅ Completed Features

### 1. **Dual Authentication System**
- ✅ Email/Password authentication alongside Google OAuth
- ✅ JWT tokens with 4-hour expiry
- ✅ Password hashing with bcryptjs (10 salt rounds)
- ✅ Secure password storage (excluded from queries by default)

**Endpoints:**
- `POST /api/users/auth/signup` - Email/password registration
- `POST /api/users/auth/login` - Email/password login
- `POST /api/users/auth/google/signup` - Google OAuth registration
- `POST /api/users/auth/google/signin` - Google OAuth login

### 2. **Annual Subscription Model**
- ✅ Changed from lifetime access (100 years) to **1-year subscriptions**
- ✅ Subscription starts on payment completion date
- ✅ Automatic expiry after 1 year
- ✅ Payment link integration with Razorpay

### 3. **User Schema Updates**
**File:** `server/models/User.js`

**New Fields:**
- `password` (String, select: false) - For email/password auth
- `phone` (String) - User phone number
- `isSubscribed` (Boolean, default: false, indexed) - Quick subscription status check

**Modified Fields:**
- `googleId` - Now optional with sparse index (supports email/password users)

### 4. **Subscription Schema Updates**
**File:** `server/models/Subscription.js`

**New Fields:**
- `amount` (Number, min: 0) - Subscription amount
- `currency` (String, default: 'INR') - Payment currency
- `currentPeriodStart` (Date, indexed) - Subscription start date
- `canceledAt` (Date) - Cancellation timestamp

**Modified Fields:**
- `status` enum - Added 'expired' status
- `razorpayCustomerId` - Now optional (not required for payment links)

### 5. **Subscription Expiry Warning System**
**File:** `server/controllers/userAuthController.js`

**Endpoint:** `GET /api/user/subscription-banner`
- Shows warning banner if subscription expires within 15 days
- Returns days until expiry and formatted expiry date
- Automatically validates subscription using `subscription.isValid()` method

**Response:**
```json
{
  "success": true,
  "showBanner": true,
  "message": "Your subscription expires in 12 days on January 15, 2026...",
  "daysUntilExpiry": 12,
  "expiryDate": "2026-01-15T00:00:00.000Z"
}
```

### 6. **Admin Subscription Management**
**File:** `server/controllers/subscriptionController.js`

**Endpoint:** `GET /api/subscriptions/admin/subscriptions`
- Lists all subscriptions with pagination
- Supports filtering by status
- Includes user details (name, email, phone, isSubscribed)
- Returns subscription validity status

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)
- `status` (optional: 'active', 'canceled', 'expired', 'past_due')

**Response:**
```json
{
  "success": true,
  "subscriptions": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalCount": 100,
    "limit": 20,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### 7. **Enhanced Webhook Handlers**
**File:** `server/controllers/subscriptionController.js`

All webhook handlers now:
- ✅ Update `user.isSubscribed` field based on subscription status
- ✅ Handle idempotent operations (prevent duplicates)
- ✅ Set proper subscription dates (currentPeriodStart, currentPeriodEnd)
- ✅ Include amount and currency fields

**Updated Handlers:**
- `handlePaymentLinkPaid()` - Sets isSubscribed = true, 1-year subscription
- `handleSubscriptionActivated()` - Sets isSubscribed = true
- `handleSubscriptionCharged()` - Sets isSubscribed = true, updates period dates
- `handleSubscriptionCancelled()` - Sets isSubscribed = false, records canceledAt
- `handleSubscriptionCompleted()` - Sets isSubscribed = false, status = 'expired'
- `handleSubscriptionPaused()` - Sets isSubscribed = false

### 8. **Payment Confirmation Updates**
**Files:** `server/controllers/subscriptionController.js`

**Functions Updated:**
- `confirmPaymentLink()` - Now creates 1-year subscriptions (not lifetime)
- `confirmPayment()` - Updates user.isSubscribed field
- Both functions now populate: amount, currency, currentPeriodStart, currentPeriodEnd

### 9. **Admin Cancellation Enhancement**
**File:** `server/controllers/subscriptionController.js`

**Endpoint:** `POST /api/subscriptions/admin/:subscriptionId/cancel`
- Now updates `user.isSubscribed = false` when canceling
- Records `canceledAt` timestamp
- Cancels at period end (user retains access until expiry)

---

## 🔒 Access Control

### **Subscription-Protected Routes**

**Course Routes:**
- `GET /api/courses/:id` - Requires: `authenticateUser` + `checkSubscriptionAccess`

**Lesson Routes:**
- `GET /api/lessons/course/:courseId` - Requires: `authenticateUser` + `checkSubscriptionAccess`
- `GET /api/lessons/:id` - Requires: `authenticateUser` + `checkSubscriptionAccess`

### **Subscription Validation Logic**

A subscription is valid if:
1. `status === 'active'`
2. `currentPeriodEnd > new Date()` (not expired)

**Middleware:** `server/middleware/checkSubscriptionAccess.js`

---

## 📋 Complete API Endpoints

### **Authentication**
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/users/auth/signup` | Public | Email/password registration |
| POST | `/api/users/auth/login` | Public | Email/password login |
| POST | `/api/users/auth/google/signup` | Public | Google OAuth registration |
| POST | `/api/users/auth/google/signin` | Public | Google OAuth login |

### **User Management**
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/profile` | User | Get user profile |
| PUT | `/api/users/profile` | User | Update user profile |
| GET | `/api/user/subscription-banner` | User | Get expiry warning banner |

### **Subscriptions**
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/subscriptions/create-payment-link` | User | Create Razorpay payment link |
| POST | `/api/subscriptions/confirm-payment-link` | User | Confirm payment & activate subscription |
| GET | `/api/subscriptions/my-subscription` | User | Get user's subscription |
| GET | `/api/subscriptions/admin/subscriptions` | Admin | List all subscriptions (paginated) |
| POST | `/api/subscriptions/admin/:id/cancel` | Admin | Cancel subscription |
| POST | `/api/subscriptions/webhook` | Razorpay | Webhook handler |

---

## 🔧 Technical Implementation Details

### **Database Indexes**

**User Model:**
- `email` (unique)
- `googleId` (unique, sparse)
- `isSubscribed` (single)

**Subscription Model:**
- `userId` (single)
- `razorpaySubscriptionId` (single)
- `razorpayPaymentId` (single)
- `status` (single)
- `currentPeriodStart` (single)
- `currentPeriodEnd` (single)

### **Webhook Security**

**File:** `server/controllers/subscriptionController.js`

**Signature Verification:**
```javascript
const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');

if (expectedSignature !== razorpaySignature) {
    return res.status(400).json({ error: 'Invalid signature' });
}
```

**⚠️ Important:** Set `RAZORPAY_WEBHOOK_SECRET` in `.env` file for production!

### **Idempotency Handling**

All webhook handlers check for existing records before creating new ones:

```javascript
// Example from handlePaymentLinkPaid
let subscription = await Subscription.findOne({
    razorpayPaymentId: payment.id
});

if (subscription) {
    console.log(`✅ Subscription already exists (idempotent)`);
    return;
}
```

### **Password Security**

**Hashing:**
```javascript
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);
```

**Verification:**
```javascript
const isPasswordValid = await bcrypt.compare(password, user.password);
```

**Query Exclusion:**
```javascript
// Password excluded by default
const user = await User.findOne({ email });

// Explicitly include password when needed
const user = await User.findOne({ email }).select('+password');
```

---

## 🧪 Testing Checklist

### **1. Email/Password Authentication**
- [ ] Register new user with email/password
- [ ] Login with correct credentials
- [ ] Login fails with incorrect password
- [ ] Duplicate email registration fails
- [ ] JWT token has 4-hour expiry

### **2. Google OAuth Authentication**
- [ ] Register new user with Google
- [ ] Login existing user with Google
- [ ] Both auth methods work for same user (if email matches)

### **3. Payment Flow**
- [ ] Create payment link for user
- [ ] Complete payment on Razorpay
- [ ] Subscription created with 1-year validity
- [ ] `user.isSubscribed` set to true
- [ ] `currentPeriodStart` and `currentPeriodEnd` set correctly

### **4. Subscription Access**
- [ ] Subscribed user can access courses
- [ ] Subscribed user can access lessons
- [ ] Non-subscribed user gets 403 error
- [ ] Expired subscription denies access

### **5. Expiry Warning Banner**
- [ ] Banner shows when subscription expires in ≤15 days
- [ ] Banner hidden when subscription expires in >15 days
- [ ] Banner hidden when no active subscription
- [ ] Correct days until expiry displayed

### **6. Admin Functions**
- [ ] List all subscriptions with pagination
- [ ] Filter subscriptions by status
- [ ] Cancel subscription (sets isSubscribed = false)
- [ ] Canceled subscription retains access until period end

### **7. Webhook Events**
- [ ] `payment_link.paid` - Creates subscription, sets isSubscribed = true
- [ ] `subscription.activated` - Sets isSubscribed = true
- [ ] `subscription.charged` - Updates period dates, sets isSubscribed = true
- [ ] `subscription.cancelled` - Sets isSubscribed = false
- [ ] `subscription.completed` - Sets status = 'expired', isSubscribed = false
- [ ] `subscription.paused` - Sets isSubscribed = false
- [ ] Duplicate webhook events handled idempotently

### **8. Edge Cases**
- [ ] User with expired subscription cannot access content
- [ ] User with canceled subscription retains access until period end
- [ ] Multiple payment attempts don't create duplicate subscriptions
- [ ] Webhook signature verification rejects invalid requests

---

## 📝 Configuration Requirements

### **Environment Variables**

**Required in `.env`:**
```env
# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=<SET_THIS_IN_PRODUCTION>
RAZORPAY_PLAN_ID=plan_xxx
RAZORPAY_COURSE_AMOUNT=250000

# Frontend URL
FRONTEND_URL=http://localhost:4173
```

### **Dependencies**

**Already Installed:**
- `bcryptjs` (^2.4.3) - Password hashing
- `razorpay` (^2.9.6) - Payment gateway
- `jsonwebtoken` (^9.0.2) - JWT authentication
- `mongoose` (^8.0.3) - MongoDB ODM

---

## 🚀 Deployment Notes

### **Before Production:**

1. **Set Webhook Secret:**
   - Get webhook secret from Razorpay Dashboard
   - Set `RAZORPAY_WEBHOOK_SECRET` in production `.env`

2. **Update Razorpay Keys:**
   - Replace test keys with live keys
   - Update `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`

3. **Configure Webhook URL:**
   - Set webhook URL in Razorpay Dashboard: `https://yourdomain.com/api/subscriptions/webhook`
   - Enable events: `payment_link.paid`, `subscription.*`, `payment.failed`

4. **Update Frontend URL:**
   - Set production `FRONTEND_URL` for payment redirects

5. **Database Indexes:**
   - Ensure all indexes are created (run server once to auto-create)

6. **Security:**
   - Use strong `JWT_SECRET` (minimum 32 characters)
   - Enable HTTPS for all API endpoints
   - Validate webhook signatures

---

## 📊 Files Modified

### **Models**
- ✅ `server/models/User.js` - Added password, phone, isSubscribed fields
- ✅ `server/models/Subscription.js` - Added amount, currency, currentPeriodStart, canceledAt fields

### **Controllers**
- ✅ `server/controllers/userAuthController.js` - Added email/password auth, subscription banner
- ✅ `server/controllers/subscriptionController.js` - Updated webhooks, added admin list, changed to annual subscriptions

### **Routes**
- ✅ `server/routes/userRoutes.js` - Added signup/login routes, subscription banner route
- ✅ `server/routes/subscriptionRoutes.js` - Added admin list subscriptions route

### **Middleware**
- ✅ `server/middleware/checkSubscriptionAccess.js` - Already implemented (verified)

---

## ✅ Summary

All required features for the annual subscription system have been successfully implemented:

1. ✅ Dual authentication (email/password + Google OAuth)
2. ✅ Annual subscriptions (1 year from payment date)
3. ✅ Payment link integration with Razorpay
4. ✅ Subscription expiry warning (15-day advance notice)
5. ✅ Admin subscription management with pagination
6. ✅ Webhook handlers with idempotency and user.isSubscribed updates
7. ✅ Subscription-based access control for courses and lessons
8. ✅ Proper date tracking (currentPeriodStart, currentPeriodEnd)
9. ✅ Secure password handling with bcryptjs
10. ✅ JWT authentication with 4-hour expiry

**Server Status:** ✅ Running without errors on port 3000

**Next Steps:** Test the complete flow and configure production webhook secret.


