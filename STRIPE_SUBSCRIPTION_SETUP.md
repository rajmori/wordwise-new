# 🎯 Stripe Annual Subscription Service - Setup Guide

## 📋 Overview

This guide will help you set up the **Stripe Annual Subscription Service** for the WordWise E-Learning Platform. The implementation follows a **webhook-driven architecture** where Stripe webhooks are the single source of truth for all subscription state changes.

---

## 🏗️ Architecture

### **Key Principles**

1. **Annual Subscriptions Only** - No monthly plans, no free trials, no promotional discounts
2. **Webhook-Driven State** - ALL subscription data creation and updates happen through Stripe webhook handlers
3. **Access Control Pattern** - `authenticateUser` → `checkSubscriptionAccess` → route handler
4. **Customer Cancellations** - Handled via existing contact form. Backend only implements admin-initiated cancellations
5. **No Pause/Resume** - Users can only subscribe or cancel (discontinue)

### **Database Models**

#### **User Model** (Updated)
- Added `stripeCustomerId` field to link users with Stripe customers

#### **Subscription Model** (New)
- `userId` - Reference to User
- `stripeSubscriptionId` - Stripe subscription ID (unique)
- `stripeCustomerId` - Stripe customer ID
- `planName` - Subscription plan name
- `status` - Subscription status: `active`, `canceled`, `past_due`
- `currentPeriodEnd` - Subscription expiry date
- `cancelAtPeriodEnd` - Whether subscription will cancel at period end

---

## 🔧 Setup Instructions

### **Step 1: Create Stripe Account**

1. Go to [https://stripe.com](https://stripe.com) and create an account
2. Complete the account verification process
3. Navigate to **Developers** → **API Keys**
4. Copy your **Secret Key** (starts with `sk_test_` for test mode)

### **Step 2: Create Annual Subscription Product**

1. In Stripe Dashboard, go to **Products** → **Add Product**
2. Fill in product details:
   - **Name**: `WordWise Annual Pro Course Series`
   - **Description**: `Annual subscription to all WordWise language learning courses`
3. Add pricing:
   - **Pricing Model**: `Recurring`
   - **Billing Period**: `Yearly`
   - **Price**: Enter your annual price (e.g., $99.00)
4. Click **Save Product**
5. Copy the **Price ID** (starts with `price_`)

### **Step 3: Configure Webhook Endpoint**

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add Endpoint**
3. Enter your webhook URL:
   - **Development**: `http://localhost:3000/api/subscriptions/webhook`
   - **Production**: `https://yourdomain.com/api/subscriptions/webhook`
4. Select events to listen to:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_failed`
5. Click **Add Endpoint**
6. Copy the **Signing Secret** (starts with `whsec_`)

### **Step 4: Update Environment Variables**

Edit `server/.env` and update the following values:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_actual_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret_here
STRIPE_ANNUAL_PRICE_ID=price_your_actual_price_id_here

# Frontend URL (for Stripe redirect URLs)
FRONTEND_URL=http://localhost:5173
```

**⚠️ IMPORTANT**: Replace the placeholder values with your actual Stripe keys!

### **Step 5: Restart Backend Server**

```bash
cd server
npm run dev
```

The server should start without errors. Check the console for:
```
✅ MongoDB Connected: wordwise.odvkecn.mongodb.net
🚀 Server running on port 3000
```

---

## 🧪 Testing with Stripe CLI (Recommended)

### **Install Stripe CLI**

**macOS (Homebrew):**
```bash
brew install stripe/stripe-cli/stripe
```

**Windows (Scoop):**
```bash
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

**Linux:**
```bash
wget https://github.com/stripe/stripe-cli/releases/download/v1.19.4/stripe_1.19.4_linux_x86_64.tar.gz
tar -xvf stripe_1.19.4_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin
```

### **Login to Stripe CLI**

```bash
stripe login
```

This will open a browser window to authenticate.

### **Forward Webhooks to Local Server**

```bash
stripe listen --forward-to localhost:3000/api/subscriptions/webhook
```

This will output a webhook signing secret (starts with `whsec_`). Update your `.env` file with this secret for local testing.

### **Test Webhook Events**

```bash
# Test checkout.session.completed
stripe trigger checkout.session.completed

# Test customer.subscription.updated
stripe trigger customer.subscription.updated

# Test customer.subscription.deleted
stripe trigger customer.subscription.deleted
```

---

## 📡 API Endpoints

### **Customer Endpoints**

#### **1. Create Checkout Session**
```http
POST /api/subscriptions/create-checkout-session
Authorization: Bearer <user_jwt_token>
```

**Response:**
```json
{
  "success": true,
  "url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

#### **2. Get My Subscription**
```http
GET /api/subscriptions/my-subscription
Authorization: Bearer <user_jwt_token>
```

**Response:**
```json
{
  "success": true,
  "subscription": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "planName": "Annual Pro Course Series",
    "status": "active",
    "currentPeriodEnd": "2025-12-16T00:00:00.000Z",
    "cancelAtPeriodEnd": false,
    "isValid": true,
    "createdAt": "2024-12-16T00:00:00.000Z"
  }
}
```

### **Admin Endpoints**

#### **3. Cancel Subscription (Admin Only)**
```http
POST /api/subscriptions/admin/:subscriptionId/cancel
Authorization: Bearer <admin_jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription will be canceled at period end",
  "periodEnd": "2025-12-16T00:00:00.000Z"
}
```

### **Webhook Endpoint**

#### **4. Stripe Webhook Handler**
```http
POST /api/subscriptions/webhook
Stripe-Signature: <stripe_signature_header>
Content-Type: application/json
```

**Handled Events:**
- ✅ `checkout.session.completed` - Creates new subscription in database
- ✅ `customer.subscription.updated` - Updates subscription status and dates
- ✅ `customer.subscription.deleted` - Marks subscription as canceled
- ✅ `invoice.payment_failed` - Marks subscription as past_due

---

## 🔒 Access Control

### **Protected Routes**

The following routes now require an **active subscription**:

#### **Course Routes**
```javascript
GET /api/courses/:id  // Requires: authenticateUser + checkSubscriptionAccess
```

#### **Lesson Routes**
```javascript
GET /api/lessons/course/:courseId  // Requires: authenticateUser + checkSubscriptionAccess
GET /api/lessons/:id               // Requires: authenticateUser + checkSubscriptionAccess
```

### **Access Control Flow**

```
User Request
    ↓
authenticateUser (verify JWT)
    ↓
checkSubscriptionAccess (verify active subscription)
    ↓
Route Handler (serve content)
```

### **Subscription Validation**

A subscription is considered **valid** if:
1. `status === 'active'`
2. `currentPeriodEnd > new Date()` (not expired)

If validation fails, the API returns:
```json
{
  "success": false,
  "message": "Active subscription required to access this content. Please subscribe to continue.",
  "requiresSubscription": true
}
```

---

## 🧪 Testing the Implementation

### **Test 1: Create Checkout Session**

```bash
# Get user JWT token first (login via Google OAuth)
USER_TOKEN="your_user_jwt_token_here"

# Create checkout session
curl -X POST http://localhost:3000/api/subscriptions/create-checkout-session \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

### **Test 2: Complete Checkout (Use Stripe Test Cards)**

1. Open the checkout URL from Test 1 in your browser
2. Use Stripe test card:
   - **Card Number**: `4242 4242 4242 4242`
   - **Expiry**: Any future date (e.g., `12/25`)
   - **CVC**: Any 3 digits (e.g., `123`)
   - **ZIP**: Any 5 digits (e.g., `12345`)
3. Complete the checkout
4. Check your server logs for:
   ```
   ✅ Subscription created for user user@example.com: sub_xxxxx
   ```

### **Test 3: Get User Subscription**

```bash
curl -X GET http://localhost:3000/api/subscriptions/my-subscription \
  -H "Authorization: Bearer $USER_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "subscription": {
    "id": "...",
    "planName": "Annual Pro Course Series",
    "status": "active",
    "currentPeriodEnd": "2025-12-16T00:00:00.000Z",
    "cancelAtPeriodEnd": false,
    "isValid": true
  }
}
```

### **Test 4: Access Protected Content**

```bash
# Try to access course content
curl -X GET http://localhost:3000/api/courses/COURSE_ID \
  -H "Authorization: Bearer $USER_TOKEN"
```

**With Active Subscription:**
```json
{
  "success": true,
  "data": { /* course data */ }
}
```

**Without Active Subscription:**
```json
{
  "success": false,
  "message": "Active subscription required to access this content. Please subscribe to continue.",
  "requiresSubscription": true
}
```

### **Test 5: Admin Cancel Subscription**

```bash
# Get admin JWT token first (login as admin)
ADMIN_TOKEN="your_admin_jwt_token_here"
SUBSCRIPTION_ID="subscription_mongodb_id_here"

curl -X POST http://localhost:3000/api/subscriptions/admin/$SUBSCRIPTION_ID/cancel \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 🛠️ Utility Functions

### **Check Expiring Subscriptions**

You can manually check for subscriptions expiring in the next 15 days:

```javascript
import { checkSubscriptionExpiryJob } from './utils/subscriptionJobs.js';

// Run the check
const expiringUserIds = await checkSubscriptionExpiryJob();
console.log(`Found ${expiringUserIds.length} users with expiring subscriptions`);
```

### **Get Subscription Statistics**

```javascript
import { getSubscriptionStats } from './utils/subscriptionJobs.js';

// Get stats
const stats = await getSubscriptionStats();
console.log(stats);
// {
//   total: 100,
//   active: 85,
//   canceled: 10,
//   pastDue: 5,
//   expiringSoon: 12
// }
```

---

## 🚨 Troubleshooting

### **Issue: Webhook signature verification failed**

**Solution:**
1. Make sure `STRIPE_WEBHOOK_SECRET` in `.env` matches the webhook signing secret from Stripe Dashboard
2. For local testing, use Stripe CLI's webhook secret (from `stripe listen` command)
3. Ensure the webhook route is registered with `express.raw()` middleware BEFORE `express.json()`

### **Issue: Subscription not created after checkout**

**Solution:**
1. Check server logs for webhook events
2. Verify webhook endpoint is accessible (use Stripe CLI for local testing)
3. Check Stripe Dashboard → Developers → Webhooks → Events to see if events are being sent

### **Issue: User already has stripeCustomerId but checkout fails**

**Solution:**
1. Check if the Stripe customer still exists in Stripe Dashboard
2. If customer was deleted, set `user.stripeCustomerId = null` and try again

### **Issue: Access denied even with active subscription**

**Solution:**
1. Check subscription status: `status === 'active'`
2. Check expiry date: `currentPeriodEnd > new Date()`
3. Verify user is authenticated (JWT token is valid)
4. Check server logs for subscription access check errors

---

## 🔐 Security Best Practices

1. **Never expose Stripe Secret Key** - Keep it in `.env` file, never commit to version control
2. **Always verify webhook signatures** - Prevents unauthorized webhook calls
3. **Use HTTPS in production** - Stripe requires HTTPS for webhook endpoints
4. **Validate user authentication** - Always use `authenticateUser` before `checkSubscriptionAccess`
5. **Handle webhook idempotency** - The implementation handles duplicate webhook events gracefully

---

## 📊 Monitoring

### **Server Logs**

The implementation includes comprehensive logging:

- ✅ **Success**: Green checkmark with success message
- ❌ **Error**: Red X with error details
- ⚠️ **Warning**: Warning symbol for important notices
- ℹ️ **Info**: Information symbol for general logs

**Example Logs:**
```
✅ Created Stripe customer: cus_xxxxx for user user@example.com
✅ Checkout session created: cs_xxxxx for user user@example.com
✅ Subscription created for user user@example.com: sub_xxxxx
✅ Subscription updated: sub_xxxxx, status: active
⚠️ Payment failed for subscription: sub_xxxxx
❌ Subscription not found: sub_xxxxx
```

---

## 🎉 Implementation Complete!

Your Stripe Annual Subscription Service is now fully implemented and ready to use!

### **What's Implemented:**

✅ User model updated with `stripeCustomerId`
✅ Subscription model created with all required fields
✅ Checkout session creation endpoint
✅ Stripe webhook handler (4 events)
✅ Subscription access middleware
✅ Admin cancellation endpoint
✅ Subscription expiry check utility
✅ Protected course and lesson routes
✅ Comprehensive error handling and logging

### **Next Steps:**

1. **Configure Stripe Keys** - Update `.env` with your actual Stripe keys
2. **Test Locally** - Use Stripe CLI to test webhook events
3. **Create Frontend UI** - Build subscription purchase and management pages
4. **Deploy to Production** - Update webhook URL in Stripe Dashboard
5. **Monitor Subscriptions** - Use the utility functions to track subscription health

---

## 📞 Support

If you encounter any issues or have questions:

1. Check the **Troubleshooting** section above
2. Review Stripe Dashboard → Developers → Events for webhook delivery status
3. Check server logs for detailed error messages
4. Contact support via the existing contact form at `ifusetech@gmail.com`

---

**Built with ❤️ for WordWise E-Learning Platform**


