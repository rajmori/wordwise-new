# 🧪 Razorpay Test Mode Guide

## 🎯 **Testing Subscription Payments**

This guide explains how to test subscription payments in Razorpay test mode.

---

## ⚙️ **Configuration Updates**

### **Backend Changes:**

**File:** `server/controllers/subscriptionController.js`

Changed `customer_notify` from `1` to `0` to avoid SMS issues in test mode:

```javascript
const subscription = await razorpay.subscriptions.create({
    plan_id: process.env.RAZORPAY_PLAN_ID,
    customer_notify: 0, // Set to 0 for test mode
    quantity: 1,
    total_count: 12,
    notes: {
        userId: user._id.toString(),
        userEmail: user.email
    }
});
```

### **Frontend Changes:**

**File:** `subscription-service.js`

Added notes to Razorpay checkout options for better tracking.

---

## 💳 **Test Cards for Razorpay**

### **Successful Payment:**

| Card Number | CVV | Expiry | Result |
|-------------|-----|--------|--------|
| `4111 1111 1111 1111` | Any 3 digits | Any future date | Success |
| `5555 5555 5555 4444` | Any 3 digits | Any future date | Success |

### **Failed Payment:**

| Card Number | CVV | Expiry | Result |
|-------------|-----|--------|--------|
| `4000 0000 0000 0002` | Any 3 digits | Any future date | Card declined |

### **Other Test Scenarios:**

- **Insufficient Funds:** `4000 0000 0000 9995`
- **Lost Card:** `4000 0000 0000 9987`
- **Stolen Card:** `4000 0000 0000 9979`

---

## 🔄 **Testing Flow**

### **Step 1: Visit Subscription Page**
```
http://localhost:5173/subscription.html
```

### **Step 2: Verify Pricing**
- Hero: "₹25,000/year"
- Section: "₹25,000 per year"
- Card: "Test plan - ₹25,000 /year"

### **Step 3: Click Subscribe**
- Click "Get Lifetime Access" button
- If not logged in, login first
- Razorpay checkout modal opens

### **Step 4: Fill Payment Details**

**Test Card Details:**
- **Card Number:** `4111 1111 1111 1111`
- **Expiry:** Any future date (e.g., `12/25`)
- **CVV:** Any 3 digits (e.g., `123`)
- **Name:** Your name

### **Step 5: Complete Payment**
- Click "Pay Now"
- Payment should succeed
- Redirected to success page

---

## 🐛 **Common Issues & Solutions**

### **Issue 1: "Test cards not accepted"**

**Cause:** Payment link mode doesn't support test cards the same way as direct checkout.

**Solution:** We're using direct Razorpay subscription checkout which supports test cards properly.

### **Issue 2: "SMS verification required"**

**Cause:** `customer_notify: 1` triggers SMS in test mode.

**Solution:** Changed to `customer_notify: 0` in backend.

### **Issue 3: "Payment gateway error"**

**Cause:** Razorpay script not loaded or API keys incorrect.

**Solution:** 
- Check browser console for errors
- Verify Razorpay script is loaded in subscription.html
- Verify API keys in `.env` files

### **Issue 4: "Subscription already exists"**

**Cause:** User already has an active subscription.

**Solution:** 
- Check Razorpay dashboard and cancel existing subscription
- Or test with a different user account

---

## 📊 **Backend Logs**

When testing, watch for these logs:

```
📋 Fetching plan details for: plan_Rt3pLdBd9FLFPT
✅ Plan details fetched: Test plan
✅ Razorpay subscription created: sub_xxx for user user@example.com
✅ Payment URL: https://rzp.io/rzp/xxx for subscription sub_xxx
```

---

## 🔍 **Verify in Razorpay Dashboard**

1. **Login to Razorpay Dashboard:** https://dashboard.razorpay.com/
2. **Go to Subscriptions** section
3. **Check for new subscription** with status "authenticated" or "active"
4. **Verify plan:** Should be "Test plan" (plan_Rt3pLdBd9FLFPT)
5. **Verify amount:** ₹25,000

---

## ✅ **Expected Behavior**

### **In Test Mode:**

1. **Subscription created** with status "created"
2. **Razorpay checkout opens** with subscription details
3. **Test card accepted** (4111 1111 1111 1111)
4. **Payment succeeds** immediately
5. **Subscription status** changes to "authenticated" or "active"
6. **User redirected** to success page
7. **Database updated** with subscription record

---

## 🚀 **Production Mode**

When moving to production:

1. **Update API keys** in `.env` files to live keys
2. **Change `customer_notify`** back to `1` for SMS notifications
3. **Test with real cards** (small amount first)
4. **Verify webhooks** are working
5. **Monitor Razorpay dashboard** for payments

---

## 📝 **Notes**

- ✅ Test mode subscriptions don't charge real money
- ✅ Test cards work only in test mode
- ✅ Subscriptions in test mode can be cancelled anytime
- ✅ Use Razorpay dashboard to manage test subscriptions
- ✅ Webhooks work in test mode too

---

## 🎯 **Summary**

- ✅ Backend configured for test mode (`customer_notify: 0`)
- ✅ Frontend using direct Razorpay checkout
- ✅ Test cards: `4111 1111 1111 1111`
- ✅ Amount: ₹25,000/year
- ✅ Plan: Test plan (plan_Rt3pLdBd9FLFPT)

**Ready to test subscription payments!** 🚀

