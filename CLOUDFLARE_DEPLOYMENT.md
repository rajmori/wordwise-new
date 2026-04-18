# Cloudflare Pages Deployment Guide

Complete guide to deploy WordWise to Cloudflare Pages with Google OAuth authentication.

---

## Prerequisites

- ✅ Google Cloud OAuth credentials configured
- ✅ GitHub account
- ✅ Cloudflare account (free tier works)
- ✅ Code pushed to GitHub repository

---

## Step 1: Update Google OAuth for Production

### Add Production URLs to Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Add the following URLs:

**Authorized JavaScript origins:**
```
https://wordwise.pages.dev
https://wordwise.in
```

**Authorized redirect URIs:**
```
https://wordwise.pages.dev/login.html
https://wordwise.pages.dev/dashboard.html
https://wordwise.in/login.html
https://wordwise.in/dashboard.html
```

5. Click **Save**

> [!IMPORTANT]
> Without these URLs, Google OAuth will not work in production!

---

## Step 2: Push Code to GitHub

If you haven't already:

```bash
git add .
git commit -m "Add Cloudflare deployment configuration"
git push origin main
```

---

## Step 3: Deploy to Cloudflare Pages

### Option A: Via Cloudflare Dashboard (Recommended)

1. **Login to Cloudflare**
   - Go to [dash.cloudflare.com](https://dash.cloudflare.com)
   - Sign in or create account

2. **Create New Pages Project**
   - Click **Workers & Pages** in sidebar
   - Click **Create application**
   - Select **Pages** tab
   - Click **Connect to Git**

3. **Connect GitHub Repository**
   - Authorize Cloudflare to access GitHub
   - Select your WordWise repository
   - Click **Begin setup**

4. **Configure Build Settings**
   ```
   Project name: wordwise
   Production branch: main
   Build command: npm run build
   Build output directory: dist
   ```

5. **Environment Variables** (Optional)
   - Skip for now, none needed

6. **Deploy**
   - Click **Save and Deploy**
   - Wait for build to complete (2-3 minutes)

7. **Your Site is Live!**
   - URL: `https://wordwise.pages.dev`

---

### Option B: Via Wrangler CLI

```bash
# Install Wrangler globally
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Build your project
npm run build

# Deploy to Cloudflare Pages
wrangler pages deploy dist --project-name=wordwise
```

---

## Step 4: Configure Custom Domain (Optional)

### Add wordwise.in Domain

1. **In Cloudflare Pages Dashboard**
   - Go to your project
   - Click **Custom domains** tab
   - Click **Set up a custom domain**

2. **Enter Domain**
   - Enter: `wordwise.in`
   - Click **Continue**

3. **DNS Configuration**
   - If domain is already in Cloudflare:
     - DNS records are added automatically
   - If domain is elsewhere:
     - Add CNAME record: `wordwise.in` → `wordwise.pages.dev`

4. **Wait for SSL**
   - SSL certificate provisioning takes 5-15 minutes
   - Status will show "Active" when ready

---

## Step 5: Verify Deployment

### Test Checklist

- [ ] **Homepage loads:** `https://wordwise.pages.dev`
- [ ] **All pages accessible:**
  - `/subscription.html`
  - `/contact.html`
  - `/login.html`
  - `/dashboard.html`
  - `/my-course.html`
  - `/admin/login.html`

- [ ] **Google OAuth works:**
  - Click "Continue with Google"
  - Sign in with Google account
  - Redirected to dashboard
  - User profile displays correctly

- [ ] **Protected routes work:**
  - Access dashboard without login → redirects to login
  - Login → can access dashboard
  - Logout → redirected to login

- [ ] **Mobile responsive:**
  - Test on mobile device
  - All features work

---

## Troubleshooting

### Issue: Google OAuth doesn't work

**Error:** "redirect_uri_mismatch"

**Solution:**
1. Check Google Cloud Console redirect URIs
2. Ensure exact match with production URL
3. Include `/login.html` and `/dashboard.html`
4. Wait 5 minutes for changes to propagate

---

### Issue: Pages not loading

**Error:** 404 or blank page

**Solution:**
1. Check build output in Cloudflare dashboard
2. Verify `dist` folder contains all HTML files
3. Check `_redirects` file is in dist folder
4. Redeploy: **Deployments** → **Retry deployment**

---

### Issue: Assets not loading

**Error:** CSS/JS files 404

**Solution:**
1. Check asset paths in HTML files
2. Ensure paths start with `/` (absolute)
3. Verify build output includes assets folder
4. Clear browser cache

---

### Issue: Custom domain not working

**Error:** DNS_PROBE_FINISHED_NXDOMAIN

**Solution:**
1. Verify DNS records are correct
2. Wait for DNS propagation (up to 24 hours)
3. Check domain nameservers point to Cloudflare
4. Use [dnschecker.org](https://dnschecker.org) to verify

---

## Automatic Deployments

Cloudflare Pages automatically deploys when you push to GitHub:

1. **Push code to GitHub:**
   ```bash
   git add .
   git commit -m "Update feature"
   git push origin main
   ```

2. **Automatic build starts**
   - Cloudflare detects push
   - Runs `npm run build`
   - Deploys to production

3. **View deployment**
   - Check dashboard for build status
   - Usually takes 2-3 minutes

---

## Preview Deployments

Every pull request gets a preview URL:

1. Create a branch and make changes
2. Push to GitHub
3. Create pull request
4. Cloudflare creates preview deployment
5. Test changes at preview URL
6. Merge when ready

---

## Performance Optimization

Your site is already optimized with:

- ✅ **Minification:** JavaScript and CSS minified
- ✅ **CDN:** Cloudflare's global CDN
- ✅ **HTTPS:** Automatic SSL certificate
- ✅ **Caching:** Aggressive caching for static assets
- ✅ **Compression:** Brotli and Gzip compression

**Expected Performance:**
- Lighthouse Score: 90+
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s

---

## Security Features

Cloudflare Pages provides:

- ✅ **DDoS Protection**
- ✅ **SSL/TLS Encryption**
- ✅ **Security Headers** (via `_headers` file)
- ✅ **Bot Protection**
- ✅ **Rate Limiting**

---

## Monitoring & Analytics

### Enable Web Analytics

1. Go to Cloudflare dashboard
2. Click **Web Analytics**
3. Add your site
4. Copy tracking code
5. Add to your HTML files

### View Deployment Logs

1. Go to Pages project
2. Click **Deployments**
3. Click on any deployment
4. View build logs and errors

---

## Rollback

If something goes wrong:

1. Go to **Deployments** tab
2. Find previous working deployment
3. Click **⋯** (three dots)
4. Click **Rollback to this deployment**
5. Confirm rollback

---

## Environment Variables (Future)

When you add a backend:

1. Go to **Settings** → **Environment variables**
2. Add variables:
   ```
   API_URL=https://api.wordwise.in
   DATABASE_URL=your_database_url
   ```
3. Redeploy for changes to take effect

---

## Cost

Cloudflare Pages is **FREE** for:
- Unlimited sites
- Unlimited requests
- Unlimited bandwidth
- 500 builds per month
- 1 concurrent build

**Paid plans** ($20/month):
- 5,000 builds per month
- 5 concurrent builds
- Advanced features

---

## Next Steps

After deployment:

- [ ] Test all functionality in production
- [ ] Set up monitoring/analytics
- [ ] Configure custom domain
- [ ] Update README with production URL
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Add backend API (if needed)
- [ ] Configure email service
- [ ] Set up database

---

## Support

- **Cloudflare Docs:** [developers.cloudflare.com/pages](https://developers.cloudflare.com/pages)
- **Community:** [community.cloudflare.com](https://community.cloudflare.com)
- **Status:** [cloudflarestatus.com](https://cloudflarestatus.com)

---

## Quick Reference

**Production URL:** `https://wordwise.pages.dev`  
**Custom Domain:** `https://wordwise.in`  
**Dashboard:** [dash.cloudflare.com](https://dash.cloudflare.com)

**Build Command:** `npm run build`  
**Output Directory:** `dist`  
**Node Version:** Auto-detected from package.json
