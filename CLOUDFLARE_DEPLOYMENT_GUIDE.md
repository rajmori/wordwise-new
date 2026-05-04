# 🚀 Cloudflare Pages Deployment Guide - WordWise

This guide will help you deploy the WordWise frontend to Cloudflare Pages and the backend to a hosting service.

---

## 📋 Prerequisites

- Cloudflare account (free tier works)
- GitHub account
- Backend hosting (Railway, Render, or similar)
- Domain name (optional, Cloudflare provides free subdomain)

---

## 🎯 Deployment Strategy

**Frontend (Cloudflare Pages):**
- Static files (HTML, CSS, JS)
- Fast global CDN
- Free SSL certificate
- Automatic deployments from Git

**Backend (Railway/Render/etc):**
- Node.js Express server
- MongoDB Atlas (already configured)
- Stripe webhooks
- Environment variables

---

## 📦 Part 1: Deploy Backend First

### Option A: Deploy to Railway (Recommended)

1. **Go to Railway:** https://railway.app/
2. **Sign up/Login** with GitHub
3. **Create New Project** → Deploy from GitHub repo
4. **Select your repository** (or create new one)
5. **Add backend folder** as service

**Environment Variables to Add:**
```env
PORT=3000
NODE_ENV=production
MONGODB_URI=mongodb+srv://wordwiseaadmin:OOnSDZZFiemYc12l@wordwise.odvkecn.mongodb.net/?appName=wordwise
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
GOOGLE_CLIENT_ID=287458285838-c1noct3nue62klke4gjv0svhqa725l8p.apps.googleusercontent.com
GCP_PROJECT_ID=wordwise-v2
GCP_BUCKET_NAME=wordwise-media
ALLOWED_ORIGINS=https://your-cloudflare-domain.pages.dev,https://your-custom-domain.com
EMAIL_USER=ifusetech@gmail.com
EMAIL_PASSWORD=bnshfgsbijnpcfgr
STRIPE_SECRET_KEY=sk_test_51SZSNE6r6KzmSsvABcG8huaT6pThcLk6N7SqNRTajFjZwnaAo8quMF7OGZrERHy0kTksiqOrmgcaEm8u7kqhuqfv00L1NWlWEn
STRIPE_WEBHOOK_SECRET=whsec_YOUR_PRODUCTION_WEBHOOK_SECRET
STRIPE_ANNUAL_PRICE_ID=price_1Sf3R26r6KzmSsvAvjKp1dsd
FRONTEND_URL=https://your-cloudflare-domain.pages.dev
```

6. **Deploy** and note your backend URL (e.g., `https://wordwise-backend.up.railway.app`)

### Option B: Deploy to Render

1. **Go to Render:** https://render.com/
2. **Sign up/Login** with GitHub
3. **New Web Service** → Connect repository
4. **Configure:**
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && npm start`
   - Add all environment variables above

---

## 📦 Part 2: Deploy Frontend to Cloudflare Pages

### Step 1: Prepare Repository

1. **Initialize Git** (if not already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit - WordWise platform"
   ```

2. **Create GitHub Repository:**
   - Go to https://github.com/new
   - Create repository named `wordwise`
   - Push your code:
     ```bash
     git remote add origin https://github.com/YOUR_USERNAME/wordwise.git
     git branch -M main
     git push -u origin main
     ```

### Step 2: Deploy to Cloudflare Pages

1. **Go to Cloudflare Dashboard:** https://dash.cloudflare.com/
2. **Navigate to:** Workers & Pages → Create application → Pages → Connect to Git
3. **Select your repository:** `wordwise`
4. **Configure build settings:**
   - **Project name:** `wordwise`
   - **Production branch:** `main`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `/` (leave empty)

5. **Environment Variables:**
   Click "Add variable" and add:
   ```
   VITE_API_URL=https://your-backend-url.up.railway.app/api
   ```
   Replace with your actual backend URL from Part 1.

6. **Click "Save and Deploy"**

### Step 3: Wait for Deployment

- First build takes 2-5 minutes
- You'll get a URL like: `https://wordwise-abc.pages.dev`
- Cloudflare provides free SSL automatically

---

## 🔧 Part 3: Update Configuration

### Update Backend CORS

1. **Go to your backend hosting** (Railway/Render)
2. **Update environment variable:**
   ```env
   ALLOWED_ORIGINS=https://wordwise-abc.pages.dev,https://your-custom-domain.com
   FRONTEND_URL=https://wordwise-abc.pages.dev
   ```
3. **Redeploy backend**

### Update Google OAuth

1. **Go to:** https://console.cloud.google.com/apis/credentials
2. **Edit OAuth 2.0 Client ID**
3. **Add Authorized JavaScript origins:**
   ```
   https://wordwise-abc.pages.dev
   https://your-custom-domain.com
   ```
4. **Add Authorized redirect URIs:**
   ```
   https://wordwise-abc.pages.dev/login.html
   https://wordwise-abc.pages.dev/
   https://your-custom-domain.com/login.html
   https://your-custom-domain.com/
   ```
5. **Save**

### Update Stripe Webhooks

1. **Go to:** https://dashboard.stripe.com/webhooks
2. **Add endpoint:**
   ```
   https://your-backend-url.up.railway.app/api/subscriptions/webhook
   ```
3. **Select events:**
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. **Copy webhook signing secret**
5. **Update backend env variable:**
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_NEW_SECRET
   ```

---

## 🎨 Part 4: Custom Domain (Optional)

### Add Custom Domain to Cloudflare Pages

1. **In Cloudflare Pages project** → Custom domains
2. **Add domain:** `wordwise.com` or `app.wordwise.com`
3. **Follow DNS instructions** (automatic if domain is on Cloudflare)
4. **Wait for SSL certificate** (automatic, takes 5-10 minutes)

### Update All URLs

After adding custom domain, update:
- Backend `ALLOWED_ORIGINS` and `FRONTEND_URL`
- Google OAuth redirect URIs
- Stripe webhook URLs

---

## ✅ Deployment Checklist

- [ ] Backend deployed and running
- [ ] Backend URL noted
- [ ] Frontend deployed to Cloudflare Pages
- [ ] Frontend URL noted
- [ ] Backend CORS updated with frontend URL
- [ ] Google OAuth updated with frontend URL
- [ ] Stripe webhook updated with backend URL
- [ ] Test login with Google
- [ ] Test subscription payment
- [ ] Test course access
- [ ] Custom domain added (optional)

---

## 🧪 Testing Production

1. **Visit your Cloudflare Pages URL**
2. **Test Google Sign-in**
3. **Test Subscription Flow:**
   - Go to pricing page
   - Click "Get Lifetime Access"
   - Complete payment with test card
   - Verify redirect to success page
   - Check dashboard for course access

---

## 🔍 Troubleshooting

### CORS Errors
- Check `ALLOWED_ORIGINS` in backend includes your Cloudflare URL
- Ensure no trailing slashes in URLs

### Google OAuth Errors
- Verify redirect URIs in Google Console match exactly
- Check JavaScript origins are added
- Wait 5 minutes after changes

### Stripe Webhook Errors
- Verify webhook endpoint URL is correct
- Check webhook signing secret matches
- Ensure backend is publicly accessible

### Build Failures
- Check build logs in Cloudflare Pages
- Verify `npm run build` works locally
- Ensure all dependencies are in `package.json`

---

## 📞 Support

If you encounter issues:
1. Check Cloudflare Pages build logs
2. Check backend logs (Railway/Render)
3. Check browser console for errors
4. Verify all environment variables are set

---

## 🎉 Success!

Once deployed, your WordWise platform will be:
- ✅ Live on Cloudflare's global CDN
- ✅ Secured with free SSL
- ✅ Auto-deployed on every Git push
- ✅ Blazing fast worldwide
- ✅ Production-ready

**Your URLs:**
- Frontend: `https://wordwise-abc.pages.dev`
- Backend: `https://wordwise-backend.up.railway.app`
- Custom Domain: `https://wordwise.com` (if configured)

---

**Need help?** Contact support or check the documentation!

