# WordWise Backend - Railway Deployment Guide

## Quick Deploy

### Step 1: Push to GitHub

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Prepare for Railway deployment"

# Create GitHub repo and push
git remote add origin https://github.com/your-username/wordwise.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Railway

1. Go to https://railway.app
2. Click **Start a New Project**
3. Choose **Deploy from GitHub repo**
4. Select your `wordwise` repository
5. Click **Deploy Now**

### Step 3: Configure Environment Variables

In Railway dashboard, add these variables:

```env
PORT=5000
NODE_ENV=production

# MongoDB Atlas
MONGODB_URI=mongodb+srv://rajrapidops_db_user:ozi8To2fUr2SgQtF@wordwise.odvkecn.mongodb.net/

# JWT Secret (generate a new one for production)
JWT_SECRET=your-production-secret-key-change-this

# GCP Storage
GCP_PROJECT_ID=wordwise-v2
GCP_BUCKET_NAME=wordwise-media
GCP_KEYFILE_PATH=./gcp-service-account-key.json

# CORS (update with your Cloudflare Pages URL)
ALLOWED_ORIGINS=https://wordwise.pages.dev,https://wordwise.in

# File Upload Limits
MAX_IMAGE_SIZE=5242880
MAX_VIDEO_SIZE=2147483648
```

### Step 4: Add GCP Service Account Key

Railway doesn't support file uploads directly, so we need to encode the key:

**Option A: Base64 Encode (Recommended)**
```bash
# On Windows PowerShell
$content = Get-Content "server/gcp-service-account-key.json" -Raw
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($content))

# Copy the output and add as environment variable:
GCP_SERVICE_ACCOUNT_BASE64=<paste-base64-here>
```

Then update `server/config/gcp.js` to decode it.

**Option B: Inline JSON**
Copy the entire JSON content and add as:
```
GCP_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

---

## Detailed Steps

### 1. Prepare Repository

```bash
cd "d:\wordwise 2"

# Make sure .gitignore is set up
# Add to .gitignore if not already:
echo "node_modules/" >> .gitignore
echo ".env" >> .gitignore
echo "server/.env" >> .gitignore
echo "server/gcp-service-account-key.json" >> .gitignore

# Commit changes
git add .
git commit -m "Add deployment configuration"
git push
```

### 2. Railway Project Setup

1. **Create Project**
   - Go to railway.app
   - New Project → Deploy from GitHub
   - Authorize GitHub access
   - Select repository

2. **Configure Root Directory**
   - Railway auto-detects `server` folder
   - If not, set Root Directory: `server`

3. **Set Start Command**
   - Railway uses `npm start` by default
   - Or specify: `node server.js`

### 3. Environment Variables

Add all variables from Step 3 above in:
**Railway Dashboard → Variables → New Variable**

### 4. Deploy

Railway will automatically deploy when you push to GitHub.

To manually trigger:
- Go to Deployments
- Click **Deploy**

---

## GCP Service Account Setup

Since Railway doesn't support file uploads, update `server/config/gcp.js`:

```javascript
import { Storage } from '@google-cloud/storage';
import dotenv from 'dotenv';

dotenv.config();

let storage;

export const initGCPStorage = () => {
    try {
        // Check if running in production with base64 encoded key
        if (process.env.GCP_SERVICE_ACCOUNT_BASE64) {
            const credentials = JSON.parse(
                Buffer.from(process.env.GCP_SERVICE_ACCOUNT_BASE64, 'base64').toString()
            );
            
            storage = new Storage({
                projectId: process.env.GCP_PROJECT_ID,
                credentials
            });
        } else {
            // Local development with key file
            storage = new Storage({
                projectId: process.env.GCP_PROJECT_ID,
                keyFilename: process.env.GCP_KEYFILE_PATH
            });
        }

        console.log(`✅ GCP Storage initialized: ${process.env.GCP_BUCKET_NAME}`);
    } catch (error) {
        console.warn('⚠️  GCP Storage not configured:', error.message);
    }
};

export const getStorage = () => storage;
export const getBucket = () => storage?.bucket(process.env.GCP_BUCKET_NAME);
```

---

## Verification

After deployment:

1. **Check Deployment Logs**
   - Railway Dashboard → Deployments → View Logs
   - Look for: ✅ MongoDB Connected
   - Look for: ✅ GCP Storage initialized

2. **Test API**
   ```bash
   # Get your Railway URL (e.g., wordwise-production.up.railway.app)
   curl https://your-app.up.railway.app/health
   
   # Should return:
   # {"success":true,"message":"WordWise API Server is running"}
   ```

3. **Test MongoDB Connection**
   - Check logs for MongoDB connection success
   - Test creating a course via API

---

## Get Railway URL

After deployment, Railway provides a URL like:
```
https://wordwise-production.up.railway.app
```

Copy this URL and update your frontend `.env.production`:
```env
VITE_API_URL=https://wordwise-production.up.railway.app/api
```

Then redeploy frontend to Cloudflare Pages.

---

## Custom Domain (Optional)

1. Go to Railway → Settings → Domains
2. Click **Generate Domain** or **Custom Domain**
3. Add your domain (e.g., `api.wordwise.in`)
4. Update DNS records as instructed
5. Update CORS and frontend API URL

---

## Troubleshooting

### Deployment Fails
- Check build logs in Railway
- Verify `package.json` has correct scripts
- Ensure all dependencies are in `package.json`

### MongoDB Connection Error
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas network access (allow all IPs: 0.0.0.0/0)
- Check database user permissions

### GCP Upload Fails
- Verify `GCP_SERVICE_ACCOUNT_BASE64` is set
- Check bucket exists and permissions
- Verify project ID is correct

---

## Monitoring

Railway provides:
- **Logs**: Real-time application logs
- **Metrics**: CPU, Memory, Network usage
- **Deployments**: History of all deployments

Access at: https://railway.app/dashboard

---

## Costs

Railway Free Tier:
- 500 hours/month
- $5 credit/month
- Enough for development and small production apps

Upgrade if needed: $5/month for more resources

---

## Next Steps

1. ✅ Deploy backend to Railway
2. ✅ Get Railway URL
3. ✅ Update frontend with Railway URL
4. ✅ Redeploy frontend
5. ✅ Test full integration
