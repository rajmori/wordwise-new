# 🔔 Razorpay Webhook Testing Guide

Since Razorpay webhooks require a publicly accessible URL, you can't use `localhost` directly. Here are the solutions:

---

## 🚀 Solution 1: Using ngrok (Recommended for Testing)

### Step 1: Install ngrok

**macOS (using Homebrew):**
```bash
brew install ngrok
```

**Or download from:** https://ngrok.com/download

### Step 2: Sign up for ngrok (Free)

1. Go to https://ngrok.com/
2. Sign up for a free account
3. Get your auth token from dashboard

### Step 3: Configure ngrok

```bash
# Add your auth token
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### Step 4: Start Your Backend Server

```bash
cd server
npm run dev
```

Your backend should be running on `http://localhost:3000`

### Step 5: Start ngrok Tunnel

**Open a new terminal:**
```bash
ngrok http 3000
```

You'll see output like:
```
ngrok

Session Status                online
Account                       your-email@example.com
Version                       3.x.x
Region                        India (in)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

### Step 6: Copy Your Public URL

Your webhook URL will be:
```
https://abc123.ngrok-free.app/api/subscriptions/webhook
```

⚠️ **Note:** The URL changes every time you restart ngrok (unless you have a paid plan)

### Step 7: Add Webhook in Razorpay Dashboard

1. Go to https://dashboard.razorpay.com/
2. Settings → Webhooks
3. Click "Create Webhook"
4. **Webhook URL:** `https://abc123.ngrok-free.app/api/subscriptions/webhook`
5. **Active Events:** Select all subscription and payment events:
   - ✅ `subscription.activated`
   - ✅ `subscription.charged`
   - ✅ `subscription.cancelled`
   - ✅ `subscription.completed`
   - ✅ `subscription.paused`
   - ✅ `subscription.resumed`
   - ✅ `payment.failed`
6. **Save** and copy the Webhook Secret
7. Update `RAZORPAY_WEBHOOK_SECRET` in `server/.env`

### Step 8: Test Webhooks

1. Make a test payment
2. Check ngrok web interface: http://127.0.0.1:4040
3. You'll see all webhook requests
4. Check your backend logs for webhook processing

---

## 🚀 Solution 2: Using localtunnel (Alternative)

### Step 1: Install localtunnel

```bash
npm install -g localtunnel
```

### Step 2: Start Your Backend

```bash
cd server
npm run dev
```

### Step 3: Start localtunnel

```bash
lt --port 3000 --subdomain wordwise
```

You'll get a URL like:
```
https://wordwise.loca.lt
```

### Step 4: Use in Razorpay

Webhook URL: `https://wordwise.loca.lt/api/subscriptions/webhook`

⚠️ **Note:** First time visitors need to click through a warning page

---

## 🚀 Solution 3: Skip Webhooks for Local Testing

For initial testing, you can skip webhooks and rely on the payment verification endpoint.

### How It Works

1. User completes payment in Razorpay modal
2. Frontend receives payment response
3. Frontend calls `/verify-payment` endpoint
4. Backend verifies signature and creates subscription
5. User gets access immediately

### What You'll Miss

- Automatic subscription updates
- Payment failure notifications
- Subscription cancellation events
- Recurring charge notifications

### When to Use

- ✅ Initial development and testing
- ✅ Testing payment flow
- ✅ Testing UI/UX
- ❌ Production deployment
- ❌ Testing subscription lifecycle

---

## 🚀 Solution 4: Deploy Backend to Cloud (Best for Production)

Deploy your backend to a cloud service with a public URL:

### Option A: Railway

1. Go to https://railway.app/
2. Connect GitHub repository
3. Deploy backend
4. Get public URL: `https://your-app.up.railway.app`
5. Webhook URL: `https://your-app.up.railway.app/api/subscriptions/webhook`

### Option B: Render

1. Go to https://render.com/
2. Create new Web Service
3. Connect repository
4. Deploy backend
5. Get public URL: `https://your-app.onrender.com`
6. Webhook URL: `https://your-app.onrender.com/api/subscriptions/webhook`

### Option C: Heroku

1. Go to https://heroku.com/
2. Create new app
3. Deploy backend
4. Get public URL: `https://your-app.herokuapp.com`
5. Webhook URL: `https://your-app.herokuapp.com/api/subscriptions/webhook`

---

## 🧪 Testing Without Webhooks

### Step 1: Comment Out Webhook Requirement

You can test the payment flow without webhooks by relying on the `verifyPayment` endpoint.

### Step 2: Test Payment Flow

1. Start backend: `cd server && npm run dev`
2. Start frontend: `npm run dev`
3. Go to: http://localhost:5173/subscription.html
4. Click "Get Lifetime Access"
5. Complete payment with test card
6. Payment is verified via `/verify-payment` endpoint
7. Subscription created in database
8. User redirected to success page

### Step 3: Manually Test Webhook Events

Use Razorpay Dashboard to test webhooks:

1. Go to Dashboard → Webhooks
2. Click on your webhook
3. Click "Test Webhook"
4. Select event type
5. Send test event

---

## 📊 Monitoring Webhooks with ngrok

### ngrok Web Interface

Open http://127.0.0.1:4040 to see:

- All incoming webhook requests
- Request headers
- Request body
- Response status
- Response time

### Replay Requests

You can replay webhook requests from the ngrok interface for testing!

---

## ✅ Recommended Approach

### For Development (Local Testing)

1. **Use ngrok** for webhook testing
2. **Start ngrok** when you need to test webhooks
3. **Update webhook URL** in Razorpay Dashboard
4. **Test payment flow** end-to-end

### For Production

1. **Deploy backend** to Railway/Render/Heroku
2. **Use production URL** for webhooks
3. **Set up monitoring** for webhook failures
4. **Enable webhook logs** in Razorpay Dashboard

---

## 🔧 Quick Setup Script

Create a file `start-with-ngrok.sh`:

```bash
#!/bin/bash

# Start backend in background
cd server
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start ngrok
ngrok http 3000

# Cleanup on exit
trap "kill $BACKEND_PID" EXIT
```

Make it executable:
```bash
chmod +x start-with-ngrok.sh
```

Run it:
```bash
./start-with-ngrok.sh
```

---

## 🆘 Troubleshooting

### ngrok URL changes every restart

**Solution:** Get a free static domain from ngrok or use a paid plan

### Webhook signature verification fails

**Solution:** Make sure `RAZORPAY_WEBHOOK_SECRET` matches the one in Razorpay Dashboard

### Webhooks not received

**Solution:** 
- Check ngrok is running
- Verify webhook URL in Razorpay Dashboard
- Check ngrok web interface for requests
- Ensure backend is running

---

## 📞 Next Steps

1. **Install ngrok:** `brew install ngrok`
2. **Start backend:** `cd server && npm run dev`
3. **Start ngrok:** `ngrok http 3000`
4. **Copy public URL** from ngrok output
5. **Add webhook** in Razorpay Dashboard
6. **Test payment** and check ngrok interface

---

**🎉 You're ready to test Razorpay webhooks!**

