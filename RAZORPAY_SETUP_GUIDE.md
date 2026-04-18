# 🎉 Razorpay Payment Integration - Setup Guide

This guide will help you set up Razorpay payment integration for the WordWise E-Learning Platform.

---

## 📋 Prerequisites

- Razorpay account (Sign up at https://razorpay.com/)
- Business details for KYC verification
- Bank account for settlements

---

## 🚀 Step 1: Create Razorpay Account

1. **Sign up:** Go to https://razorpay.com/ and create an account
2. **Complete KYC:** Submit business documents for verification
3. **Activate account:** Wait for approval (usually 24-48 hours)

---

## 🔑 Step 2: Get API Keys

1. **Login to Dashboard:** https://dashboard.razorpay.com/
2. **Go to Settings** → API Keys
3. **Generate Keys:**
   - Test Mode: For development and testing
   - Live Mode: For production (after KYC approval)
4. **Copy Keys:**
   - Key ID: `rzp_test_xxxxxxxxxxxxx` (Test) or `rzp_live_xxxxxxxxxxxxx` (Live)
   - Key Secret: `xxxxxxxxxxxxxxxxxxxxxxxx`

⚠️ **Important:** Never commit Key Secret to Git!

---

## 💳 Step 3: Create Subscription Plan

### Option A: Using Dashboard (Recommended)

1. **Go to Dashboard** → Products → Subscriptions → Plans
2. **Click "Create Plan"**
3. **Fill Details:**
   - Plan Name: `WordWise Annual Pro`
   - Billing Interval: `Yearly`
   - Billing Amount: `₹7,999` (or your price)
   - Currency: `INR`
   - Description: `Annual subscription to WordWise Pro Course Series`
4. **Save Plan** and copy the Plan ID (e.g., `plan_xxxxxxxxxxxxx`)

### Option B: Using API

```bash
curl -X POST https://api.razorpay.com/v1/plans \
  -u YOUR_KEY_ID:YOUR_KEY_SECRET \
  -H "Content-Type: application/json" \
  -d '{
    "period": "yearly",
    "interval": 1,
    "item": {
      "name": "WordWise Annual Pro",
      "amount": 799900,
      "currency": "INR",
      "description": "Annual subscription to WordWise Pro Course Series"
    }
  }'
```

---

## 🔧 Step 4: Configure Environment Variables

### Backend (.env)

Update `server/.env`:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
RAZORPAY_PLAN_ID=plan_xxxxxxxxxxxxx
```

### Frontend (.env.production)

Update `.env.production`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
```

---

## 🔔 Step 5: Set Up Webhooks

⚠️ **Important:** Razorpay webhooks require a publicly accessible URL. You **cannot** use `localhost` directly.

### For Local Testing (Use ngrok)

**See detailed guide:** `WEBHOOK_TESTING_GUIDE.md`

**Quick Setup:**
```bash
# Install ngrok
brew install ngrok

# Start your backend
cd server && npm run dev

# In another terminal, start ngrok
ngrok http 3000

# Copy the public URL (e.g., https://abc123.ngrok-free.app)
```

### Configure Webhook in Razorpay

1. **Go to Dashboard** → Settings → Webhooks
2. **Click "Create Webhook"**
3. **Configure:**
   - **Webhook URL:**
     - Local testing: `https://abc123.ngrok-free.app/api/subscriptions/webhook`
     - Production: `https://your-backend-url.com/api/subscriptions/webhook`
   - **Active Events:**
     - ✅ `subscription.activated`
     - ✅ `subscription.charged`
     - ✅ `subscription.cancelled`
     - ✅ `subscription.completed`
     - ✅ `subscription.paused`
     - ✅ `subscription.resumed`
     - ✅ `payment.failed`
4. **Save** and copy the Webhook Secret
5. **Update** `RAZORPAY_WEBHOOK_SECRET` in `server/.env`

### Alternative: Skip Webhooks for Initial Testing

You can test the payment flow without webhooks initially. The payment verification happens via the `/verify-payment` endpoint. See `WEBHOOK_TESTING_GUIDE.md` for details.

---

## 🧪 Step 6: Test the Integration

### Test Cards

Razorpay provides test cards for testing:

**Successful Payment:**
- Card Number: `4111 1111 1111 1111`
- CVV: Any 3 digits
- Expiry: Any future date
- Name: Any name

**Failed Payment:**
- Card Number: `4000 0000 0000 0002`

### Test Flow

1. **Start servers:**
   ```bash
   # Terminal 1: Backend
   cd server && npm run dev

   # Terminal 2: Frontend
   npm run dev
   ```

2. **Go to subscription page:** http://localhost:5173/subscription.html

3. **Click "Get Lifetime Access"**

4. **Razorpay modal opens** with subscription details

5. **Enter test card details** and complete payment

6. **Verify:**
   - Payment success page shows
   - Subscription created in database
   - User can access courses

---

## 📊 Step 7: Monitor Subscriptions

### Razorpay Dashboard

- **Subscriptions:** View all subscriptions
- **Payments:** Track payment history
- **Customers:** Manage customer data
- **Analytics:** Revenue and growth metrics

### Database

Check MongoDB for subscription records:

```javascript
// Find all active subscriptions
db.subscriptions.find({ status: 'active' })

// Find user's subscription
db.subscriptions.find({ userId: ObjectId('...') })
```

---

## 🔒 Security Best Practices

1. **Never expose Key Secret** in frontend code
2. **Always verify webhook signatures** on backend
3. **Use HTTPS** in production
4. **Validate payment** on backend before granting access
5. **Store sensitive data** in environment variables
6. **Enable 2FA** on Razorpay account
7. **Regularly rotate** API keys

---

## 🌐 Step 8: Go Live

### Before Going Live

- [ ] Complete KYC verification
- [ ] Add bank account for settlements
- [ ] Test complete payment flow
- [ ] Update to Live API keys
- [ ] Update webhook URL to production
- [ ] Test webhooks in production
- [ ] Set up monitoring and alerts

### Switch to Live Mode

1. **Get Live API Keys** from Dashboard
2. **Update Environment Variables:**
   ```env
   RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=your_live_key_secret
   ```
3. **Create Live Plan** (same as test plan)
4. **Update Webhook** with production URL
5. **Test with real card** (small amount first)

---

## 🎯 API Endpoints

### Create Subscription
```http
POST /api/subscriptions/create-subscription
Authorization: Bearer <user_token>
```

### Verify Payment
```http
POST /api/subscriptions/verify-payment
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "razorpay_payment_id": "pay_xxxxx",
  "razorpay_subscription_id": "sub_xxxxx",
  "razorpay_signature": "xxxxx"
}
```

### Get User Subscription
```http
GET /api/subscriptions/my-subscription
Authorization: Bearer <user_token>
```

### Webhook Handler
```http
POST /api/subscriptions/webhook
X-Razorpay-Signature: <signature>
Content-Type: application/json
```

---

## 🆘 Troubleshooting

### Payment Modal Not Opening

- Check if Razorpay script is loaded: `<script src="https://checkout.razorpay.com/v1/checkout.js"></script>`
- Verify `VITE_RAZORPAY_KEY_ID` in frontend env
- Check browser console for errors

### Webhook Not Receiving Events

- Verify webhook URL is publicly accessible
- Check webhook secret matches
- Review webhook logs in Razorpay Dashboard
- Ensure server is returning 200 OK

### Payment Verification Failed

- Check signature verification logic
- Ensure Key Secret is correct
- Verify payment data format

### Subscription Not Created

- Check backend logs for errors
- Verify MongoDB connection
- Ensure user is authenticated
- Check subscription model fields

---

## 📞 Support

- **Razorpay Docs:** https://razorpay.com/docs/
- **API Reference:** https://razorpay.com/docs/api/
- **Support:** https://razorpay.com/support/

---

## ✅ Checklist

- [ ] Razorpay account created and verified
- [ ] API keys generated (Test/Live)
- [ ] Subscription plan created
- [ ] Environment variables configured
- [ ] Webhooks set up and tested
- [ ] Payment flow tested with test cards
- [ ] Database subscriptions verified
- [ ] Error handling tested
- [ ] Ready for production

---

**🎉 Congratulations!** Your Razorpay integration is complete!

