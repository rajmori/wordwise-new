# 📋 WordWise Deployment Checklist

Use this checklist to ensure a smooth deployment to production.

---

## 🎯 Pre-Deployment

### Code Preparation
- [ ] All features tested locally
- [ ] No console.log statements in production code (or acceptable)
- [ ] All sensitive data in environment variables
- [ ] `.gitignore` updated (no .env files committed)
- [ ] Build runs successfully: `npm run build`
- [ ] No TypeScript/ESLint errors

### Environment Files
- [ ] `.env.production` configured with production API URL
- [ ] `server/.env` has all required variables
- [ ] GCP service account key file excluded from Git
- [ ] Stripe keys are test/production as needed

---

## 🚀 Backend Deployment (Railway/Render)

### Setup
- [ ] Account created on hosting platform
- [ ] Repository connected (or code uploaded)
- [ ] Build command set: `cd server && npm install`
- [ ] Start command set: `cd server && npm start`

### Environment Variables
- [ ] `PORT` = 3000
- [ ] `NODE_ENV` = production
- [ ] `MONGODB_URI` = (your MongoDB Atlas connection string)
- [ ] `JWT_SECRET` = (strong random string)
- [ ] `GOOGLE_CLIENT_ID` = 740316754976-ovhtoo1nh2ervqc2h9cohqbefe316jsv.apps.googleusercontent.com
- [ ] `GCP_PROJECT_ID` = (your GCP project ID)
- [ ] `GCP_BUCKET_NAME` = wordwise-media
- [ ] `ALLOWED_ORIGINS` = (your Cloudflare Pages URL)
- [ ] `EMAIL_USER` = ifusetech@gmail.com
- [ ] `EMAIL_PASSWORD` = bnshfgsbijnpcfgr
- [ ] `STRIPE_SECRET_KEY` = (your Stripe secret key)
- [ ] `STRIPE_WEBHOOK_SECRET` = (production webhook secret)
- [ ] `STRIPE_ANNUAL_PRICE_ID` = price_1Sf3R26r6KzmSsvAvjKp1dsd
- [ ] `FRONTEND_URL` = (your Cloudflare Pages URL)

### Deployment
- [ ] Deploy backend
- [ ] Backend URL noted: `https://___________________`
- [ ] Health check works: `https://your-backend.com/health`
- [ ] API responds: `https://your-backend.com/api/courses`

---

## 🌐 Frontend Deployment (Cloudflare Pages)

### Repository Setup
- [ ] Code pushed to GitHub
- [ ] Repository is public or Cloudflare has access
- [ ] Main branch is `main` or `master`

### Cloudflare Pages Setup
- [ ] Cloudflare account created
- [ ] New Pages project created
- [ ] Repository connected
- [ ] Build command: `npm run build`
- [ ] Build output directory: `dist`
- [ ] Root directory: `/` (empty)

### Environment Variables
- [ ] `VITE_API_URL` = (your backend URL + /api)
  Example: `https://wordwise-backend.up.railway.app/api`

### Deployment
- [ ] First deployment successful
- [ ] Frontend URL noted: `https://___________________`
- [ ] Site loads correctly
- [ ] No 404 errors on navigation

---

## 🔧 Post-Deployment Configuration

### Update Backend CORS
- [ ] Add Cloudflare Pages URL to `ALLOWED_ORIGINS`
- [ ] Add custom domain to `ALLOWED_ORIGINS` (if applicable)
- [ ] Update `FRONTEND_URL` to Cloudflare Pages URL
- [ ] Redeploy backend

### Google OAuth Configuration
- [ ] Go to: https://console.cloud.google.com/apis/credentials
- [ ] Edit OAuth 2.0 Client ID
- [ ] Add Authorized JavaScript origins:
  - [ ] `https://your-cloudflare-url.pages.dev`
  - [ ] `https://your-custom-domain.com` (if applicable)
- [ ] Add Authorized redirect URIs:
  - [ ] `https://your-cloudflare-url.pages.dev/login.html`
  - [ ] `https://your-cloudflare-url.pages.dev/`
  - [ ] `https://your-custom-domain.com/login.html` (if applicable)
  - [ ] `https://your-custom-domain.com/` (if applicable)
- [ ] Save changes
- [ ] Wait 5 minutes for propagation

### Stripe Webhook Configuration
- [ ] Go to: https://dashboard.stripe.com/webhooks
- [ ] Add new endpoint: `https://your-backend-url.com/api/subscriptions/webhook`
- [ ] Select events:
  - [ ] `checkout.session.completed`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
  - [ ] `invoice.payment_failed`
- [ ] Copy webhook signing secret
- [ ] Update backend env: `STRIPE_WEBHOOK_SECRET`
- [ ] Redeploy backend

### GCP Storage (if using)
- [ ] Service account key uploaded to backend hosting
- [ ] Bucket permissions configured
- [ ] CORS configured on bucket
- [ ] Test image upload

---

## 🧪 Testing Production

### Basic Functionality
- [ ] Homepage loads
- [ ] Navigation works
- [ ] All pages accessible
- [ ] Images load correctly
- [ ] No console errors

### Authentication
- [ ] Google Sign-in works
- [ ] User redirected after login
- [ ] User data saved correctly
- [ ] Logout works

### Subscription Flow
- [ ] Pricing page loads
- [ ] "Get Lifetime Access" button works
- [ ] Redirects to Stripe checkout
- [ ] Test payment completes (use test card: 4242 4242 4242 4242)
- [ ] Redirects to success page
- [ ] Webhook processes payment
- [ ] Subscription created in database
- [ ] User can access courses

### Course Access
- [ ] Courses page loads
- [ ] Course details page works
- [ ] Lessons load correctly
- [ ] Video playback works (if applicable)
- [ ] Subscription check works

### Contact Form
- [ ] Contact form submits
- [ ] Email received at ifusetech@gmail.com
- [ ] Success message shown

### Admin Panel
- [ ] Admin login works
- [ ] Course management works
- [ ] Lesson management works
- [ ] File uploads work

---

## 🎨 Custom Domain (Optional)

### Cloudflare Pages
- [ ] Custom domain added in Pages settings
- [ ] DNS configured (automatic if domain on Cloudflare)
- [ ] SSL certificate issued (automatic)
- [ ] Domain accessible

### Update All Services
- [ ] Backend `ALLOWED_ORIGINS` updated
- [ ] Backend `FRONTEND_URL` updated
- [ ] Google OAuth redirect URIs updated
- [ ] All services redeployed

---

## 📊 Monitoring

### Setup Monitoring
- [ ] Cloudflare Analytics enabled
- [ ] Backend logging configured
- [ ] Error tracking setup (Sentry, etc.)
- [ ] Uptime monitoring (UptimeRobot, etc.)

### Performance
- [ ] Lighthouse score checked
- [ ] Page load times acceptable
- [ ] API response times acceptable
- [ ] CDN caching working

---

## 🔒 Security

### Final Security Checks
- [ ] All API keys in environment variables
- [ ] No sensitive data in Git repository
- [ ] CORS properly configured
- [ ] Rate limiting enabled (recommended)
- [ ] HTTPS enforced everywhere
- [ ] Security headers configured

---

## ✅ Launch Checklist

### Pre-Launch
- [ ] All tests passing
- [ ] All features working
- [ ] Performance optimized
- [ ] SEO configured
- [ ] Analytics setup

### Launch
- [ ] Announce to users
- [ ] Monitor for errors
- [ ] Check analytics
- [ ] Respond to feedback

### Post-Launch
- [ ] Monitor server logs
- [ ] Check error rates
- [ ] Review user feedback
- [ ] Plan updates

---

## 📝 Important URLs

**Production URLs:**
- Frontend: `https://___________________`
- Backend: `https://___________________`
- Admin Panel: `https://___________________/admin`

**Service Dashboards:**
- Cloudflare: https://dash.cloudflare.com/
- Railway/Render: `https://___________________`
- MongoDB Atlas: https://cloud.mongodb.com/
- Stripe: https://dashboard.stripe.com/
- Google Cloud: https://console.cloud.google.com/
- GCP Storage: https://console.cloud.google.com/storage/

---

## 🆘 Troubleshooting

### Common Issues
- **CORS errors**: Check `ALLOWED_ORIGINS` includes frontend URL
- **OAuth errors**: Verify redirect URIs match exactly
- **Webhook errors**: Check webhook secret and endpoint URL
- **Build failures**: Check build logs, verify dependencies
- **404 errors**: Check `_redirects` file, verify routes

### Support Resources
- Cloudflare Docs: https://developers.cloudflare.com/pages/
- Railway Docs: https://docs.railway.app/
- Stripe Docs: https://stripe.com/docs
- MongoDB Docs: https://docs.mongodb.com/

---

## 🎉 Deployment Complete!

Once all items are checked, your WordWise platform is live and ready for users!

**Next Steps:**
1. Monitor for 24 hours
2. Gather user feedback
3. Plan feature updates
4. Scale as needed

---

**Deployed by:** ___________________  
**Date:** ___________________  
**Version:** 1.0.0

