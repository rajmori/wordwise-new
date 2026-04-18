# 🎯 Annual Subscription Flow with Plan ID

## ✅ **Implementation Complete!**

The system now creates **yearly Razorpay subscriptions** using the plan ID when users successfully complete payment.

---

## 📋 **Configuration**

### **Plan Details:**
- **Plan ID:** `plan_Rt3pLdBd9FLFPT`
- **Plan Name:** Test plan
- **Amount:** ₹250.00 (25,000 paise)
- **Period:** Yearly (1 year)
- **Interval:** 1

### **Environment Variable:**
```env
RAZORPAY_PLAN_ID=plan_Rt3pLdBd9FLFPT
```

---

## 🔄 **Complete Payment Flow**

### **1. User Initiates Payment**
- User clicks "Get Lifetime Access" on subscription page
- Frontend calls: `POST /api/subscriptions/create-payment-link`
- Backend creates a Razorpay payment link
- User is redirected to Razorpay payment page

### **2. User Completes Payment**
- User enters payment details (test card: `4111 1111 1111 1111`)
- Razorpay processes the payment
- User is redirected to: `/subscription/success?razorpay_payment_link_id=xxx&razorpay_payment_id=xxx`

### **3. Payment Confirmation (Frontend)**
- Success page automatically calls: `POST /api/subscriptions/confirm-payment-link`
- Sends payment details to backend

### **4. Subscription Creation (Backend)**

The backend performs the following steps:

#### **Step 4.1: Verify Payment**
```javascript
// Fetch payment details from Razorpay
const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);

// Verify payment status is 'captured' or 'authorized'
if (paymentDetails.status !== 'captured' && paymentDetails.status !== 'authorized') {
    return error;
}
```

#### **Step 4.2: Create/Get Razorpay Customer**
```javascript
// Create customer if doesn't exist
if (!user.razorpayCustomerId) {
    const customer = await razorpay.customers.create({
        name: user.name,
        email: user.email,
        contact: user.phone || ''
    });
    user.razorpayCustomerId = customer.id;
}
```

#### **Step 4.3: Create Razorpay Subscription**
```javascript
// Create subscription with the plan
const razorpaySubscription = await razorpay.subscriptions.create({
    plan_id: process.env.RAZORPAY_PLAN_ID, // plan_Rt3pLdBd9FLFPT
    customer_id: customerId,
    quantity: 1,
    total_count: 1, // One-time yearly subscription
    start_at: Math.floor(currentPeriodStart.getTime() / 1000),
    notes: {
        userId: user._id.toString(),
        userEmail: user.email,
        paymentLinkId: razorpay_payment_link_id,
        paymentId: razorpay_payment_id
    }
});
```

#### **Step 4.4: Save Subscription to Database**
```javascript
// Calculate 1-year period
const currentPeriodStart = new Date();
const currentPeriodEnd = new Date(currentPeriodStart);
currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);

// Create subscription record
const subscription = new Subscription({
    userId: user._id,
    razorpaySubscriptionId: razorpaySubscription.id, // Actual Razorpay subscription ID
    razorpayCustomerId: customerId,
    razorpayPaymentId: razorpay_payment_id,
    planName: 'WordWise Vocabulary Course - Annual Access',
    amount: paymentDetails.amount,
    currency: 'INR',
    status: 'active',
    currentPeriodStart: currentPeriodStart,
    currentPeriodEnd: currentPeriodEnd,
    cancelAtPeriodEnd: false
});

await subscription.save();
```

#### **Step 4.5: Update User Status**
```javascript
// Mark user as subscribed
user.isSubscribed = true;
await user.save();
```

### **5. Webhook Handling (Backup)**

If the frontend confirmation fails, Razorpay sends a webhook:

- **Event:** `payment_link.paid`
- **Handler:** `handlePaymentLinkPaid()`
- **Action:** Creates the same subscription structure as above

---

## 🧪 **Testing the Flow**

### **Test Steps:**

1. **Start servers:**
   ```bash
   # Backend (already running on port 3000)
   cd server && npm run dev
   
   # Frontend (already running on port 5173)
   npm run dev
   ```

2. **Login to the application:**
   - Go to: http://localhost:5173/login.html
   - Login with Google OAuth or email/password

3. **Navigate to subscription page:**
   - Go to: http://localhost:5173/subscription.html
   - Click "Get Lifetime Access"

4. **Complete payment:**
   - Use test card: `4111 1111 1111 1111`
   - CVV: `123`
   - Expiry: `12/25`
   - Name: Any name

5. **Verify subscription created:**
   - Check backend logs for:
     ```
     ✅ Created Razorpay customer: cust_xxx
     ✅ Created Razorpay subscription: sub_xxx
     ✅ Subscription created from payment link: pay_xxx
     📋 Razorpay Subscription ID: sub_xxx
     📋 Plan ID: plan_Rt3pLdBd9FLFPT
     📅 Subscription period: 2025-12-18... to 2026-12-18...
     ```

6. **Verify in Razorpay Dashboard:**
   - Go to: https://dashboard.razorpay.com/app/subscriptions
   - Find subscription with ID from logs
   - Verify plan ID is `plan_Rt3pLdBd9FLFPT`

---

## 📊 **Database Structure**

### **Subscription Document:**
```javascript
{
    _id: ObjectId("..."),
    userId: ObjectId("..."),
    razorpaySubscriptionId: "sub_xxx", // Actual Razorpay subscription ID
    razorpayCustomerId: "cust_xxx",
    razorpayPaymentId: "pay_xxx",
    planName: "WordWise Vocabulary Course - Annual Access",
    amount: 25000,
    currency: "INR",
    status: "active",
    currentPeriodStart: ISODate("2025-12-18T..."),
    currentPeriodEnd: ISODate("2026-12-18T..."), // 1 year later
    cancelAtPeriodEnd: false,
    createdAt: ISODate("2025-12-18T..."),
    updatedAt: ISODate("2025-12-18T...")
}
```

### **User Document:**
```javascript
{
    _id: ObjectId("..."),
    email: "user@example.com",
    name: "User Name",
    razorpayCustomerId: "cust_xxx", // Razorpay customer ID
    isSubscribed: true, // Updated to true
    ...
}
```

---

## ✅ **Success Indicators**

When payment is successful, you should see:

1. ✅ **Razorpay customer created** (if new user)
2. ✅ **Razorpay subscription created** with plan ID
3. ✅ **Database subscription record created**
4. ✅ **User marked as subscribed** (`isSubscribed: true`)
5. ✅ **User redirected to dashboard**
6. ✅ **User can access course content**

---

## 🔧 **Troubleshooting**

### **If Razorpay subscription creation fails:**
- The system will still create a database subscription record
- User will still be marked as subscribed
- Check logs for error details

### **If payment confirmation fails:**
- Razorpay webhook will handle it automatically
- Check webhook logs in Razorpay dashboard

---

## 🚀 **Ready to Test!**

Your system is now configured to create yearly subscriptions using the plan ID `plan_Rt3pLdBd9FLFPT` whenever a user successfully completes payment!

