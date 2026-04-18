# 🔄 Stripe to Razorpay Migration Guide

This guide explains the changes made to migrate from Stripe to Razorpay payment integration.

---

## 📋 What Changed

### 1. **Dependencies**

**Removed:**
```bash
npm uninstall stripe
```

**Added:**
```bash
npm install razorpay
```

---

### 2. **Database Models**

#### Subscription Model (`server/models/Subscription.js`)

**Before (Stripe):**
```javascript
stripeSubscriptionId: String
stripeCustomerId: String
```

**After (Razorpay):**
```javascript
razorpaySubscriptionId: String
razorpayCustomerId: String
razorpayOrderId: String
razorpayPaymentId: String
```

#### User Model (`server/models/User.js`)

**Before (Stripe):**
```javascript
stripeCustomerId: String
```

**After (Razorpay):**
```javascript
razorpayCustomerId: String
```

---

### 3. **Environment Variables**

#### Backend (`server/.env`)

**Before (Stripe):**
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_ANNUAL_PRICE_ID=price_...
```

**After (Razorpay):**
```env
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
RAZORPAY_PLAN_ID=plan_...
```

#### Frontend (`.env.production`)

**Added:**
```env
VITE_RAZORPAY_KEY_ID=rzp_test_...
```

---

### 4. **API Endpoints**

#### Changed Endpoints

**Before (Stripe):**
```
POST /api/subscriptions/create-checkout-session
```

**After (Razorpay):**
```
POST /api/subscriptions/create-subscription
POST /api/subscriptions/verify-payment
```

#### Unchanged Endpoints

```
GET /api/subscriptions/my-subscription
POST /api/subscriptions/webhook
POST /api/subscriptions/admin/:subscriptionId/cancel
```

---

### 5. **Payment Flow**

#### Stripe Flow (Old)

1. User clicks "Subscribe"
2. Backend creates Stripe Checkout Session
3. User redirected to Stripe hosted page
4. Payment completed on Stripe
5. Stripe redirects back to success page
6. Webhook creates subscription in database

#### Razorpay Flow (New)

1. User clicks "Subscribe"
2. Backend creates Razorpay Subscription
3. Frontend opens Razorpay modal (on same page)
4. User completes payment in modal
5. Frontend verifies payment with backend
6. Backend creates subscription in database
7. User redirected to success page

---

### 6. **Frontend Changes**

#### Subscription Service (`subscription-service.js`)

**Key Changes:**
- Replaced `createCheckoutSession()` with `createSubscription()`
- Added `openRazorpayPayment()` for modal
- Added `verifyPayment()` for backend verification
- No redirect to external payment page

#### HTML Files

**Added Razorpay Script:**
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

**Success Page URL Parameter:**
- Before: `?session_id=cs_test_...`
- After: `?subscription_id=sub_...`

---

### 7. **Webhook Events**

#### Stripe Events (Old)

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

#### Razorpay Events (New)

- `subscription.activated`
- `subscription.charged`
- `subscription.cancelled`
- `subscription.completed`
- `subscription.paused`
- `subscription.resumed`
- `payment.failed`

---

## 🗄️ Data Migration

### For Existing Stripe Subscriptions

If you have existing Stripe subscriptions, you need to migrate the data:

#### Option 1: Manual Migration Script

```javascript
// server/migrate-stripe-to-razorpay.js
import mongoose from 'mongoose';
import Subscription from './models/Subscription.js';
import User from './models/User.js';

async function migrateSubscriptions() {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);

    // Find all Stripe subscriptions
    const stripeSubscriptions = await Subscription.find({
        stripeSubscriptionId: { $exists: true }
    });

    console.log(`Found ${stripeSubscriptions.length} Stripe subscriptions`);

    // Note: You cannot automatically migrate to Razorpay
    // Users need to re-subscribe with Razorpay
    // This script just marks old subscriptions

    for (const sub of stripeSubscriptions) {
        sub.status = 'canceled';
        sub.notes = 'Migrated from Stripe - User needs to re-subscribe';
        await sub.save();
    }

    console.log('Migration complete');
    process.exit(0);
}

migrateSubscriptions();
```

#### Option 2: Grandfather Existing Users

Keep Stripe subscriptions active for existing users:

1. Don't delete Stripe code completely
2. Check if user has `stripeSubscriptionId` or `razorpaySubscriptionId`
3. Handle both payment providers
4. New users only use Razorpay

---

## 🧪 Testing Migration

### 1. Test New Razorpay Flow

```bash
# Start backend
cd server && npm run dev

# Start frontend
npm run dev

# Test subscription creation
# Use test card: 4111 1111 1111 1111
```

### 2. Verify Database

```javascript
// Check new subscription format
db.subscriptions.findOne({ razorpaySubscriptionId: { $exists: true } })
```

### 3. Test Webhooks

```bash
# Use Razorpay webhook testing in dashboard
# Or use ngrok for local testing
ngrok http 3000
```

---

## ⚠️ Important Notes

### 1. **Existing Subscriptions**

- Stripe subscriptions will continue to work until canceled
- Users need to re-subscribe with Razorpay
- Send email notification about migration
- Offer discount for re-subscription

### 2. **Webhook URLs**

- Update webhook URL in Razorpay Dashboard
- Remove webhook URL from Stripe Dashboard (or keep for existing subs)

### 3. **Currency Change**

- Stripe: USD ($99/year)
- Razorpay: INR (₹7,999/year)
- Update pricing on frontend

### 4. **Payment Methods**

- Stripe: Cards, Apple Pay, Google Pay
- Razorpay: Cards, UPI, Netbanking, Wallets

---

## 📝 Deployment Checklist

- [ ] Install Razorpay package
- [ ] Update database models
- [ ] Update environment variables
- [ ] Update API endpoints
- [ ] Update frontend service
- [ ] Add Razorpay script to HTML
- [ ] Create Razorpay plan
- [ ] Set up webhooks
- [ ] Test payment flow
- [ ] Test webhook events
- [ ] Update documentation
- [ ] Notify existing users
- [ ] Deploy to production

---

## 🔄 Rollback Plan

If you need to rollback to Stripe:

1. **Reinstall Stripe:**
   ```bash
   npm install stripe
   ```

2. **Restore files from Git:**
   ```bash
   git checkout HEAD~1 server/controllers/subscriptionController.js
   git checkout HEAD~1 server/models/Subscription.js
   git checkout HEAD~1 subscription-service.js
   ```

3. **Restore environment variables**

4. **Restart servers**

---

## 📞 Support

For migration issues:
- Check logs in `server/` directory
- Review Razorpay Dashboard for errors
- Contact Razorpay support: https://razorpay.com/support/

---

**✅ Migration Complete!** Your platform now uses Razorpay for payments.

