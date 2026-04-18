# WordWise - Cloudflare Pages Deployment Guide

## Quick Deploy

### Step 1: Build the Project
```bash
npm run build
```

### Step 2: Deploy to Cloudflare Pages

#### Option A: Wrangler CLI (Recommended)
```bash
# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
npx wrangler pages deploy dist --project-name=wordwise
```

#### Option B: Cloudflare Dashboard
1. Go to https://dash.cloudflare.com
2. Navigate to **Pages**
3. Click **Create a project**
4. Choose **Upload assets**
5. Upload the `dist` folder
6. Project name: `wordwise`

### Step 3: Configure Environment Variables

In Cloudflare Pages settings, add:
```
VITE_API_URL=https://your-backend-url.up.railway.app/api
```

Replace `your-backend-url` with your actual Railway backend URL.

---

## Detailed Steps

### 1. Prepare for Deployment

Make sure you have:
- ✅ Built the project (`npm run build`)
- ✅ `dist` folder exists
- ✅ Backend deployed and URL ready

### 2. Deploy via Wrangler

```bash
# First time setup
npm install -g wrangler
wrangler login

# Deploy
cd "d:\wordwise 2"
npx wrangler pages deploy dist --project-name=wordwise

# You'll see output like:
# ✨ Success! Uploaded 45 files
# ✨ Deployment complete!
# 🌎 https://wordwise.pages.dev
```

### 3. Set Environment Variables

```bash
# Via CLI
wrangler pages secret put VITE_API_URL

# Or via Dashboard:
# 1. Go to Pages > wordwise > Settings > Environment variables
# 2. Add: VITE_API_URL = https://your-backend.up.railway.app/api
# 3. Save and redeploy
```

### 4. Custom Domain (Optional)

1. Go to Pages > wordwise > Custom domains
2. Click **Set up a custom domain**
3. Enter your domain (e.g., `wordwise.in`)
4. Follow DNS configuration instructions

---

## Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Assets Not Loading
- Check `vite.config.js` base path
- Verify all paths are relative
- Check browser console for errors

### API Calls Failing
- Verify `VITE_API_URL` is set correctly
- Check CORS settings on backend
- Verify backend is running

---

## Verification

After deployment, test:
1. ✅ Site loads at `https://wordwise.pages.dev`
2. ✅ Admin login page accessible
3. ✅ Can login with credentials
4. ✅ Can access course management
5. ✅ API calls work (check Network tab)

---

## Redeploy

To update your site:
```bash
npm run build
npx wrangler pages deploy dist --project-name=wordwise
```

---

## URLs

- **Production**: https://wordwise.pages.dev
- **Custom Domain**: https://wordwise.in (if configured)
- **Dashboard**: https://dash.cloudflare.com

---

## Next Steps

1. Deploy backend to Railway
2. Update `VITE_API_URL` with Railway URL
3. Test full integration
4. Configure custom domain (optional)
