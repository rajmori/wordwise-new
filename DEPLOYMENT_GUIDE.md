# WordWise - Complete Deployment Guide

## 🚀 Quick Start

### Prerequisites
- ✅ Code built successfully (`npm run build`)
- ✅ GitHub account
- ✅ Cloudflare account
- ✅ Railway account (or Render)

---

## Step-by-Step Deployment

### Part 1: Prepare GCP Service Account for Production

1. **Encode your service account key**:
   ```powershell
   # In PowerShell
   cd "d:\wordwise 2\server"
   $content = Get-Content "gcp-service-account-key.json" -Raw
   $base64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($content))
   $base64 | Set-Clipboard
   # The base64 string is now in your clipboard
   ```

2. **Save this base64 string** - you'll need it for Railway environment variables

---

### Part 2: Deploy Backend to Railway

#### 1. Push Code to GitHub

```bash
cd "d:\wordwise 2"

# Initialize git (if not already done)
git init

# Add all files
git add .
git commit -m "Deploy to Railway and Cloudflare"

# Create GitHub repo at https://github.com/new
# Then push:
git remote add origin https://github.com/YOUR_USERNAME/wordwise.git
git branch -M main
git push -u origin main
```

#### 2. Deploy on Railway

1. Go to https://railway.app
2. Click **"Start a New Project"**
3. Choose **"Deploy from GitHub repo"**
4. Select your `wordwise` repository
5. Railway will auto-detect the `server` folder
6. Click **"Deploy"**

#### 3. Add Environment Variables

In Railway dashboard, go to **Variables** and add:

```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://rajrapidops_db_user:ozi8To2fUr2SgQtF@wordwise.odvkecn.mongodb.net/
JWT_SECRET=change-this-to-a-secure-random-string-for-production
GCP_PROJECT_ID=wordwise-v2
GCP_BUCKET_NAME=wordwise-media
GCP_SERVICE_ACCOUNT_BASE64=<paste-the-base64-string-from-step-1>
ALLOWED_ORIGINS=https://wordwise.pages.dev,https://wordwise.in
MAX_IMAGE_SIZE=5242880
MAX_VIDEO_SIZE=2147483648
```

#### 4. Get Your Railway URL

After deployment, Railway will provide a URL like:
```
https://wordwise-production.up.railway.app
```

**Copy this URL** - you'll need it for the frontend!

---

### Part 3: Deploy Frontend to Cloudflare Pages

#### Option A: Using Wrangler CLI (Recommended)

```bash
# Install Wrangler globally
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
cd "d:\wordwise 2"
npx wrangler pages deploy dist --project-name=wordwise
```

#### Option B: Using Cloudflare Dashboard

1. Go to https://dash.cloudflare.com
2. Navigate to **Pages**
3. Click **"Create a project"**
4. Choose **"Upload assets"**
5. Upload the `dist` folder
6. Project name: `wordwise`
7. Click **"Deploy site"**

#### Add Environment Variable

In Cloudflare Pages:
1. Go to **Settings** → **Environment variables**
2. Add variable:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://your-railway-url.up.railway.app/api`
   - (Replace with your actual Railway URL from Part 2, Step 4)
3. Click **"Save"**
4. **Redeploy** the site

---

### Part 4: Verify Deployment

#### 1. Test Backend
```bash
# Replace with your Railway URL
curl https://your-railway-url.up.railway.app/health

# Should return:
# {"success":true,"message":"WordWise API Server is running"}
```

#### 2. Test Frontend
1. Go to your Cloudflare Pages URL (e.g., `https://wordwise.pages.dev`)
2. Navigate to `/admin/login.html`
3. Login with:
   - Email: `admin@wordwise.com`
   - Password: `admin123`
4. Try creating a course
5. Try uploading an image

---

## 🎯 Your Deployed URLs

After deployment, you'll have:

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | `https://wordwise.pages.dev` | Main site & admin UI |
| Backend API | `https://your-app.up.railway.app` | API server |
| MongoDB | `mongodb+srv://...` | Database |
| GCP Storage | `wordwise-media` bucket | Media files |

---

## 🔧 Troubleshooting

### Backend Issues

**MongoDB Connection Failed**
- Check `MONGODB_URI` in Railway variables
- Verify MongoDB Atlas allows all IPs (0.0.0.0/0)
- Check database user permissions

**GCP Upload Failed**
- Verify `GCP_SERVICE_ACCOUNT_BASE64` is set correctly
- Check bucket exists and has correct permissions
- Verify `GCP_PROJECT_ID` matches your project

**CORS Errors**
- Update `ALLOWED_ORIGINS` to include your Cloudflare Pages URL
- Redeploy backend after changing

### Frontend Issues

**API Calls Failing**
- Verify `VITE_API_URL` is set in Cloudflare Pages
- Check it points to your Railway URL with `/api` suffix
- Check browser console for CORS errors

**Assets Not Loading**
- Clear browser cache
- Check Cloudflare Pages deployment logs
- Verify all files uploaded correctly

---

## 🔄 Redeployment

### Update Frontend
```bash
npm run build
npx wrangler pages deploy dist --project-name=wordwise
```

### Update Backend
```bash
git add .
git commit -m "Update backend"
git push
# Railway auto-deploys on push
```

---

## 💰 Cost Breakdown

| Service | Free Tier | Cost |
|---------|-----------|------|
| Cloudflare Pages | Unlimited | **Free** |
| Railway | 500 hrs/month | **Free** (or $5/month) |
| MongoDB Atlas | 512MB | **Free** |
| GCP Storage | 5GB | ~$0.10/month |
| **Total** | | **~$0-5/month** |

---

## 🎨 Custom Domain (Optional)

### Frontend Domain (e.g., wordwise.in)
1. In Cloudflare Pages → Custom domains
2. Add your domain
3. Update DNS records as instructed

### Backend Domain (e.g., api.wordwise.in)
1. In Railway → Settings → Domains
2. Add custom domain
3. Update DNS records
4. Update `VITE_API_URL` and `ALLOWED_ORIGINS`

---

## ✅ Deployment Checklist

- [ ] Backend deployed to Railway
- [ ] Environment variables set on Railway
- [ ] Railway URL obtained
- [ ] Frontend built (`npm run build`)
- [ ] Frontend deployed to Cloudflare Pages
- [ ] `VITE_API_URL` set on Cloudflare Pages
- [ ] Admin login works
- [ ] Course creation works
- [ ] Media upload works
- [ ] MongoDB saving data
- [ ] GCP storage working

---

## 📞 Support

If you encounter issues:
1. Check Railway deployment logs
2. Check Cloudflare Pages deployment logs
3. Check browser console for errors
4. Verify all environment variables are set correctly

---

## 🎉 Success!

Your WordWise course management system is now live!

- **Admin Panel**: `https://wordwise.pages.dev/admin/login.html`
- **API**: `https://your-app.up.railway.app`
- **Database**: MongoDB Atlas (cloud)
- **Storage**: GCP Cloud Storage

You can now manage courses from anywhere in the world! 🌍
