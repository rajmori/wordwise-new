# 🧪 Test Razorpay Payment - Ready to Go!

## ✅ Everything is Running!

- ✅ **Backend:** Running on http://localhost:3000
- ✅ **Frontend:** Running on http://localhost:4173
- ✅ **Razorpay:** Configured with your credentials
- ✅ **Plan ID:** plan_RsdYhbrvjlypbO
- ✅ **Subscription Page:** Already open in your browser!

---

## 🎯 Test Payment Flow

### Step 1: Login (If Not Already Logged In)

If you see a login button, click it and login with Google.

### Step 2: Click "Get Lifetime Access" Button

On the subscription page, click the **"Get Lifetime Access"** button.

### Step 3: Razorpay Modal Opens

You should see a Razorpay payment modal with:
- Plan name: Your plan name
- Amount: Your plan amount
- Payment options

### Step 4: Enter Test Card Details

Use these **test card details** (Razorpay test mode):

**Card Number:** `4111 1111 1111 1111`
**CVV:** `123` (or any 3 digits)
**Expiry:** `12/25` (or any future date)
**Cardholder Name:** Any name

### Step 5: Complete Payment

Click **"Pay"** button in the Razorpay modal.

### Step 6: Success!

You should be redirected to the success page showing:
- ✅ Payment successful message
- ✅ Subscription details
- ✅ Auto-redirect to dashboard in 5 seconds

---

## 🔍 What to Check

### 1. Browser Console

Open browser console (F12) and look for:
```
🔄 Creating Razorpay subscription...
✅ Subscription created, opening Razorpay payment...
✅ Payment successful
```

### 2. Backend Logs

Check the terminal running the backend for:
```
✅ Subscription created successfully
✅ Payment verified successfully
```

### 3. Database

After successful payment, check MongoDB for the subscription:
```javascript
db.subscriptions.find().pretty()
```

You should see:
```javascript
{
  razorpaySubscriptionId: "sub_xxxxx",
  razorpayCustomerId: "cust_xxxxx",
  razorpayPaymentId: "pay_xxxxx",
  status: "active",
  planName: "...",
  currentPeriodEnd: ISODate("..."),
  ...
}
```

---

## 🧪 Test Scenarios

### Test 1: Successful Payment ✅
- **Card:** `4111 1111 1111 1111`
- **Expected:** Payment succeeds, subscription created, redirected to success page

### Test 2: Failed Payment ❌
- **Card:** `4000 0000 0000 0002`
- **Expected:** Payment fails, error message shown

### Test 3: Cancel Payment 🚫
- Click the **X** button or press **Escape** in Razorpay modal
- **Expected:** Redirected to cancel page

### Test 4: Already Subscribed 🔄
- Try subscribing again with the same user
- **Expected:** Error message "You already have an active subscription"

---

## 🐛 Troubleshooting

### Razorpay Modal Doesn't Open

**Check:**
- Browser console for errors
- Razorpay script is loaded (check Network tab)
- `VITE_RAZORPAY_KEY_ID` is set correctly

**Solution:**
- Refresh the page
- Clear browser cache
- Check `.env.production` file

### "Failed to create subscription" Error

**Check:**
- Backend logs for errors
- `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are correct
- `RAZORPAY_PLAN_ID` is correct
- MongoDB is connected

**Solution:**
- Verify credentials in `server/.env`
- Restart backend server

### Payment Verification Failed

**Check:**
- Backend logs for signature verification errors
- `RAZORPAY_KEY_SECRET` is correct

**Solution:**
- Double-check the Key Secret in `server/.env`
- Restart backend server

### Not Redirected to Success Page

**Check:**
- Browser console for errors
- Network tab for `/verify-payment` request

**Solution:**
- Check backend logs
- Verify payment verification endpoint is working

---

## 📊 Expected Flow

1. **User clicks "Get Lifetime Access"**
   - Button shows loading state
   - Frontend calls `/create-subscription`

2. **Backend creates subscription**
   - Razorpay API creates subscription
   - Returns subscription ID

3. **Razorpay modal opens**
   - Shows payment form
   - User enters card details

4. **Payment processed**
   - Razorpay processes payment
   - Returns payment response

5. **Payment verified**
   - Frontend calls `/verify-payment`
   - Backend verifies signature
   - Creates subscription in database

6. **Success page**
   - User redirected to success page
   - Shows confirmation
   - Auto-redirects to dashboard

---

## 🎉 After Successful Test

Once payment is successful:

1. **Check Dashboard**
   - Go to http://localhost:4173/dashboard.html
   - Should show "Active" subscription status

2. **Check Razorpay Dashboard**
   - Go to https://dashboard.razorpay.com/
   - Check Subscriptions → All Subscriptions
   - You should see your test subscription

3. **Check MongoDB**
   - Verify subscription document is created
   - Check user document has `razorpayCustomerId`

---

## 🔔 About Webhooks

**Note:** We're testing **without webhooks** right now.

**What works:**
- ✅ Payment collection
- ✅ Subscription creation
- ✅ Immediate access

**What doesn't work (yet):**
- ❌ Automatic subscription updates
- ❌ Recurring charge notifications
- ❌ Payment failure notifications

**To enable webhooks:**
- See `WEBHOOK_TESTING_GUIDE.md`
- Use ngrok for local testing
- Or deploy backend to cloud

---

## 🚀 Next Steps After Testing

1. **Test all scenarios** (success, failure, cancel)
2. **Verify database** entries
3. **Test course access** with active subscription
4. **Set up webhooks** (optional for now)
5. **Deploy to production** when ready

---

## 📞 URLs

- **Subscription Page:** http://localhost:4173/subscription.html
- **Dashboard:** http://localhost:4173/dashboard.html
- **Success Page:** http://localhost:4173/subscription/success
- **Cancel Page:** http://localhost:4173/subscription/cancel
- **Razorpay Dashboard:** https://dashboard.razorpay.com/

---

## 🎯 Test Card Details (Quick Reference)

**Success:**
```
Card: 4111 1111 1111 1111
CVV: 123
Expiry: 12/25
Name: Test User
```

**Failure:**
```
Card: 4000 0000 0000 0002
CVV: 123
Expiry: 12/25
Name: Test User
```

---

**🎉 Ready to test! The subscription page is already open in your browser!**

**Just click "Get Lifetime Access" and use the test card details above!** 🚀

