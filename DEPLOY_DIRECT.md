# Deploy to Cloudflare Pages (Direct - No GitHub)

Quick guide to deploy WordWise directly to Cloudflare Pages using Wrangler CLI.

---

## Step 1: Install Wrangler

Open PowerShell and run:

```powershell
npm install -g wrangler
```

Wait for installation to complete (~30 seconds).

---

## Step 2: Login to Cloudflare

```powershell
wrangler login
```

This will:
1. Open your browser
2. Ask you to login to Cloudflare
3. Authorize Wrangler
4. Return to terminal when done

---

## Step 3: Update Google OAuth (Critical!)

Before deploying, add production URLs to Google Cloud Console:

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. **APIs & Services** → **Credentials**
3. Click your OAuth Client ID
4. Add these URLs:

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

---

## Step 4: Build Your Project

```powershell
cd "d:\wordwise 2"
npm run build
```

This creates the `dist` folder with your production files.

---

## Step 5: Deploy to Cloudflare

```powershell
wrangler pages deploy dist --project-name=wordwise
```

**First time deployment:**
- Wrangler will create a new project called "wordwise"
- Takes 1-2 minutes
- You'll get a URL: `https://wordwise.pages.dev`

**Subsequent deployments:**
- Just run the same command
- Updates your existing project
- Takes ~30 seconds

---

## Step 6: Verify Deployment

Your site is now live at: **https://wordwise.pages.dev**

Test:
- ✅ Homepage loads
- ✅ Click "Continue with Google" on login page
- ✅ Sign in with Google account
- ✅ Redirected to dashboard
- ✅ User profile displays correctly

---

## Update Your Site

Whenever you make changes:

```powershell
# 1. Build
npm run build

# 2. Deploy
wrangler pages deploy dist --project-name=wordwise
```

That's it! Your changes are live in ~30 seconds.

---

## Custom Domain (Optional)

To use `wordwise.in`:

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. **Workers & Pages** → **wordwise**
3. **Custom domains** → **Set up a custom domain**
4. Enter: `wordwise.in`
5. DNS configured automatically (if domain in Cloudflare)

---

## Troubleshooting

### Error: "Not logged in"
```powershell
wrangler login
```

### Error: "Project already exists"
```powershell
wrangler pages deploy dist --project-name=wordwise
```
(Same command works for updates)

### Error: "Build failed"
```powershell
# Delete dist folder and rebuild
Remove-Item -Recurse -Force dist
npm run build
```

---

## Quick Reference

**Build:** `npm run build`  
**Deploy:** `wrangler pages deploy dist --project-name=wordwise`  
**Your URL:** `https://wordwise.pages.dev`  
**Dashboard:** [dash.cloudflare.com](https://dash.cloudflare.com)

---

## Next Steps

After deployment:
- Test all features in production
- Configure custom domain (optional)
- Set up monitoring/analytics
