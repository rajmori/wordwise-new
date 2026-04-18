# Annual Subscription System - Testing Guide

## 🧪 Quick Start Testing

### Prerequisites
1. Server running on `http://localhost:3000`
2. MongoDB connected
3. Razorpay test account configured

---

## 1️⃣ Email/Password Authentication

### **Test Signup**
```bash
curl -X POST http://localhost:3000/api/users/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "phone": "1234567890"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "test@example.com",
    "name": "Test User"
  }
}
```

### **Test Login**
```bash
curl -X POST http://localhost:3000/api/users/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### **Test Invalid Login**
```bash
curl -X POST http://localhost:3000/api/users/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "wrongpassword"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

## 2️⃣ Payment Link Creation

### **Create Payment Link**
```bash
curl -X POST http://localhost:3000/api/subscriptions/create-payment-link \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{}'
```

**Expected Response:**
```json
{
  "success": true,
  "paymentUrl": "https://rzp.io/i/xxx",
  "paymentLinkId": "plink_xxx"
}
```

**What to Check:**
- Payment link URL is valid
- User can complete payment on Razorpay
- Redirects to success page after payment

---

## 3️⃣ Subscription Confirmation

### **Confirm Payment Link**
```bash
curl -X POST http://localhost:3000/api/subscriptions/confirm-payment-link \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "razorpay_payment_link_id": "plink_xxx",
    "razorpay_payment_id": "pay_xxx"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Payment confirmed and subscription activated",
  "subscription": {
    "id": "...",
    "status": "active",
    "currentPeriodStart": "2025-12-18T...",
    "currentPeriodEnd": "2026-12-18T...",
    "planName": "WordWise Vocabulary Course - Annual Access"
  }
}
```

**What to Check:**
- `currentPeriodEnd` is exactly 1 year from `currentPeriodStart`
- `status` is "active"
- User's `isSubscribed` field is set to `true` in database

---

## 4️⃣ Subscription Access Control

### **Get User Subscription**
```bash
curl -X GET http://localhost:3000/api/subscriptions/my-subscription \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **Access Protected Course (With Subscription)**
```bash
curl -X GET http://localhost:3000/api/courses/COURSE_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected:** 200 OK with course data

### **Access Protected Course (Without Subscription)**
```bash
# Use token from user without subscription
curl -X GET http://localhost:3000/api/courses/COURSE_ID \
  -H "Authorization: Bearer TOKEN_WITHOUT_SUBSCRIPTION"
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Active subscription required to access this content. Please subscribe to continue.",
  "requiresSubscription": true
}
```

---

## 5️⃣ Subscription Expiry Banner

### **Get Banner (Subscription Expires Soon)**
```bash
curl -X GET http://localhost:3000/api/user/subscription-banner \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response (if expires within 15 days):**
```json
{
  "success": true,
  "showBanner": true,
  "message": "Your subscription expires in 12 days on January 15, 2026...",
  "daysUntilExpiry": 12,
  "expiryDate": "2026-01-15T00:00:00.000Z"
}
```

**Expected Response (if expires >15 days):**
```json
{
  "success": true,
  "showBanner": false
}
```

---

## 6️⃣ Admin Functions

### **List All Subscriptions**
```bash
curl -X GET "http://localhost:3000/api/subscriptions/admin/subscriptions?page=1&limit=20" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### **Filter by Status**
```bash
curl -X GET "http://localhost:3000/api/subscriptions/admin/subscriptions?status=active" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### **Cancel Subscription**
```bash
curl -X POST http://localhost:3000/api/subscriptions/admin/SUBSCRIPTION_ID/cancel \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

**What to Check:**
- User's `isSubscribed` field set to `false`
- Subscription `canceledAt` timestamp recorded
- User retains access until `currentPeriodEnd`

---

## 7️⃣ Webhook Testing

### **Simulate payment_link.paid Event**
```bash
curl -X POST http://localhost:3000/api/subscriptions/webhook \
  -H "Content-Type: application/json" \
  -H "x-razorpay-signature: SIGNATURE" \
  -d '{
    "event": "payment_link.paid",
    "payload": {
      "payment_link": {
        "entity": {
          "id": "plink_xxx",
          "notes": {
            "userId": "USER_ID",
            "userEmail": "test@example.com"
          }
        }
      },
      "payment": {
        "entity": {
          "id": "pay_xxx",
          "amount": 250000,
          "currency": "INR"
        }
      }
    }
  }'
```

**What to Check:**
- Subscription created in database
- `currentPeriodEnd` is 1 year from now
- User's `isSubscribed` set to `true`
- Idempotent: sending same webhook twice doesn't create duplicate

---

## 🔍 Database Verification

### **Check User Document**
```javascript
db.users.findOne({ email: "test@example.com" })
```

**Verify:**
- `isSubscribed: true` (after payment)
- `password` field exists and is hashed
- `googleId` is optional (can be null)

### **Check Subscription Document**
```javascript
db.subscriptions.findOne({ userId: ObjectId("USER_ID") })
```

**Verify:**
- `status: "active"`
- `currentPeriodStart` is set
- `currentPeriodEnd` is 1 year from start
- `amount` and `currency` are populated

---

## ⚠️ Common Issues

### **Issue: Webhook signature verification fails**
**Solution:** Set `RAZORPAY_WEBHOOK_SECRET` in `.env` file

### **Issue: Password login fails**
**Solution:** Ensure password is at least 6 characters

### **Issue: Subscription access denied**
**Solution:** Check:
1. User has active subscription
2. `currentPeriodEnd > new Date()`
3. `status === 'active'`

### **Issue: Duplicate subscriptions created**
**Solution:** Webhook handlers check for existing records (idempotency)

---

## ✅ Success Criteria

- [x] Email/password signup and login work
- [x] Google OAuth signup and login work
- [x] Payment link creation succeeds
- [x] Payment confirmation creates 1-year subscription
- [x] Subscribed users can access courses
- [x] Non-subscribed users get 403 error
- [x] Expiry banner shows 15 days before expiry
- [x] Admin can list and cancel subscriptions
- [x] Webhooks update user.isSubscribed correctly
- [x] Duplicate webhooks handled idempotently


