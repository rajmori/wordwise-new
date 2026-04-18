# 📋 Create Razorpay Subscription Plan

## Quick Steps

I've opened the Razorpay Dashboard for you. Follow these steps:

---

## 1. Create Plan in Dashboard

You should see the **Subscriptions → Plans** page.

### Click "Create Plan" Button

Fill in the following details:

**Plan Details:**
- **Plan Name:** `WordWise Annual Pro`
- **Description:** `Annual subscription to WordWise Pro Course Series`

**Billing Details:**
- **Billing Interval:** `Yearly` (or `Monthly` if you prefer)
- **Billing Cycle:** `1`
- **Billing Amount:** `799900` (₹7,999.00 in paise)
  - Note: Razorpay uses paise (1 rupee = 100 paise)
  - For ₹7,999 → Enter `799900`
  - For ₹9,999 → Enter `999900`
  - For ₹4,999 → Enter `499900`
- **Currency:** `INR`

**Additional Settings:**
- **Setup Fee:** `0` (optional)
- **Trial Period:** `0` days (optional)
- **Total Count:** Leave empty (unlimited billing cycles)

### Click "Create Plan"

---

## 2. Copy Plan ID

After creating the plan, you'll see the plan details page.

**Copy the Plan ID** - it looks like:
```
plan_xxxxxxxxxxxxx
```

Example: `plan_NP9xhJKLqQdVJz`

---

## 3. Update Environment Variable

Once you have the Plan ID, come back and tell me the Plan ID, and I'll update the `.env` file for you.

Or you can update it manually:

**Edit `server/.env`:**
```env
RAZORPAY_PLAN_ID=plan_xxxxxxxxxxxxx
```

Replace `plan_xxxxxxxxxxxxx` with your actual Plan ID.

---

## 💡 Pricing Recommendations

### For Indian Market:

- **Budget:** ₹2,999 - ₹4,999/year
- **Standard:** ₹5,999 - ₹7,999/year
- **Premium:** ₹9,999 - ₹14,999/year

### Current Setup:

I recommend **₹7,999/year** (₹666/month) which is:
- Affordable for students
- Good value for quality courses
- Competitive in Indian market

---

## 🔄 Alternative: Create Plan via API

If you prefer to create the plan programmatically:

```bash
curl -X POST https://api.razorpay.com/v1/plans \
  -u rzp_test_RsdXGjEEEbh4JQ:TAZtzXfBlPK36bX7XaKYR3fJ \
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

This will return the Plan ID in the response.

---

## ✅ Next Steps

After creating the plan:

1. **Copy the Plan ID**
2. **Tell me the Plan ID** or update `server/.env`
3. **Start testing** the payment flow!

---

**Once you have the Plan ID, we can start testing immediately!** 🚀

