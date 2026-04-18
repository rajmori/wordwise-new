# 🚀 Quick Start - Test Razorpay Without Webhooks

This guide helps you test the Razorpay integration **without setting up webhooks** initially.

---

## ✅ What Works Without Webhooks

- ✅ Payment collection
- ✅ Subscription creation
- ✅ Payment verification
- ✅ User gets immediate access
- ✅ Subscription stored in database

## ❌ What Doesn't Work Without Webhooks

- ❌ Automatic subscription updates
- ❌ Payment failure notifications
- ❌ Subscription cancellation events
- ❌ Recurring charge notifications

---

## 🎯 Perfect For

- Initial development and testing
- Testing payment UI/UX
- Testing subscription flow
- Demo purposes

---

## 📋 Prerequisites

1. Razorpay account (Test mode)
2. API keys from Razorpay Dashboard
3. Subscription plan created in Razorpay

---

## 🚀 Step-by-Step Setup

### Step 1: Get Razorpay Credentials

1. **Sign up:** https://razorpay.com/
2. **Login to Dashboard:** https://dashboard.razorpay.com/
3. **Get API Keys:**
   - Go to Settings → API Keys
   - Generate Test Keys
   - Copy **Key ID** (e.g., `rzp_test_xxxxxxxxxxxxx`)
   - Copy **Key Secret**

### Step 2: Create Subscription Plan

1. **Go to Dashboard** → Products → Subscriptions → Plans
2. **Click "Create Plan"**
3. **Fill Details:**
   - Plan Name: `WordWise Annual Pro`
   - Billing Interval: `Yearly`
   - Billing Amount: `₹7,999` (or your price)
   - Currency: `INR`
4. **Save** and copy the **Plan ID** (e.g., `plan_xxxxxxxxxxxxx`)

### Step 3: Update Environment Variables

**Backend (`server/.env`):**
```env
# MongoDB
MONGODB_URI=your_mongodb_uri

# JWT
JWT_SECRET=your_jwt_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Email
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Razorpay (Test Mode)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_PLAN_ID=plan_xxxxxxxxxxxxx

# You can leave webhook secret empty for now
RAZORPAY_WEBHOOK_SECRET=

# Frontend URL
FRONTEND_URL=http://localhost:4173
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4173,http://localhost:3000
```

**Frontend (`.env.production`):**
```env
VITE_API_URL=http://localhost:3000/api
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
```

### Step 4: Install Dependencies

```bash
# Backend
cd server
npm install

# Frontend (if not already installed)
cd ..
npm install
```

### Step 5: Start Backend

```bash
cd server
npm run dev
```

You should see:
```
✅ MongoDB connected successfully
🚀 Server running on port 3000
```

### Step 6: Build and Start Frontend

**Terminal 2:**
```bash
npm run build
npm run preview
```

You should see:
```
➜  Local:   http://localhost:4173/
```

### Step 7: Test the Payment Flow

1. **Open browser:** http://localhost:4173/subscription.html

2. **Login with Google** (if not already logged in)

3. **Click "Get Lifetime Access"** button

4. **Razorpay modal opens** with subscription details

5. **Enter test card details:**
   - Card Number: `4111 1111 1111 1111`
   - CVV: `123`
   - Expiry: Any future date (e.g., `12/25`)
   - Name: Any name

6. **Click Pay**

7. **Payment is processed:**
   - Frontend receives payment response
   - Frontend calls `/verify-payment` endpoint
   - Backend verifies signature
   - Backend creates subscription in database
   - User is redirected to success page

8. **Success!** You should see the success page

### Step 8: Verify in Database

Check MongoDB to see the subscription:

```javascript
// In MongoDB Compass or Shell
db.subscriptions.find().pretty()

// You should see:
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),
  razorpaySubscriptionId: "sub_xxxxxxxxxxxxx",
  razorpayCustomerId: "cust_xxxxxxxxxxxxx",
  razorpayPaymentId: "pay_xxxxxxxxxxxxx",
  planName: "Annual Pro Course Series",
  status: "active",
  currentPeriodEnd: ISODate("2025-12-17T..."),
  cancelAtPeriodEnd: false,
  createdAt: ISODate("2024-12-17T..."),
  updatedAt: ISODate("2024-12-17T...")
}
```

### Step 9: Test Course Access

1. **Go to dashboard:** http://localhost:4173/dashboard.html
2. **You should see subscription status:** "Active"
3. **Try accessing a course** - should work!

---

## 🧪 Test Scenarios

### Test 1: Successful Payment
- Use card: `4111 1111 1111 1111`
- Expected: Payment succeeds, subscription created

### Test 2: Failed Payment
- Use card: `4000 0000 0000 0002`
- Expected: Payment fails, error shown

### Test 3: Duplicate Subscription
- Try subscribing again with same user
- Expected: Error message "You already have an active subscription"

### Test 4: Unauthenticated User
- Logout and try to subscribe
- Expected: Redirected to login page

---

## 🔍 Debugging

### Check Backend Logs

Look for these messages:
```
✅ Subscription created successfully
✅ Payment verified successfully
```

### Check Browser Console

Look for these messages:
```
🔄 Creating Razorpay subscription...
✅ Subscription created, opening Razorpay payment...
✅ Payment successful
```

### Common Issues

**1. "Failed to create subscription"**
- Check if `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are correct
- Check if `RAZORPAY_PLAN_ID` is correct
- Check backend logs for errors

**2. "Payment verification failed"**
- Check if `RAZORPAY_KEY_SECRET` is correct
- Check backend logs for signature verification errors

**3. Razorpay modal doesn't open**
- Check if Razorpay script is loaded in HTML
- Check browser console for errors
- Verify `VITE_RAZORPAY_KEY_ID` in `.env.production`

---

## 📊 What Happens Behind the Scenes

1. **User clicks "Subscribe"**
   - Frontend calls `/create-subscription`
   - Backend creates Razorpay subscription
   - Backend returns subscription ID

2. **Razorpay modal opens**
   - User enters payment details
   - Razorpay processes payment
   - Razorpay returns payment response

3. **Payment verification**
   - Frontend calls `/verify-payment` with response
   - Backend verifies signature using Razorpay secret
   - Backend creates subscription in database
   - Backend returns success

4. **User gets access**
   - Frontend redirects to success page
   - User can now access courses

---

## ⏭️ Next Steps

Once you've tested the basic flow:

1. **Set up webhooks** for production (see `WEBHOOK_TESTING_GUIDE.md`)
2. **Test subscription lifecycle** (cancellation, renewal)
3. **Add email notifications** for payments
4. **Deploy to production** with proper webhook URL

---

## 🎉 You're Ready!

You can now test the complete Razorpay payment flow without worrying about webhooks!

**When you're ready for webhooks:**
- See `WEBHOOK_TESTING_GUIDE.md` for ngrok setup
- Or deploy backend to cloud and use production URL

---

## 📞 Need Help?

- **Setup Guide:** `RAZORPAY_SETUP_GUIDE.md`
- **Webhook Guide:** `WEBHOOK_TESTING_GUIDE.md`
- **Migration Guide:** `STRIPE_TO_RAZORPAY_MIGRATION.md`
- **Razorpay Docs:** https://razorpay.com/docs/

