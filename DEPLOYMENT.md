# Deploy WordWise to Cloudflare Pages

Your site is ready for deployment! The production build is in the `dist` folder.

## Option 1: Deploy via Cloudflare Dashboard (Easiest - Recommended)

### Step 1: Create a Cloudflare Account
1. Go to https://dash.cloudflare.com/sign-up
2. Create a free account if you don't have one

### Step 2: Deploy via Drag & Drop
1. Go to https://dash.cloudflare.com/
2. Click on **"Workers & Pages"** in the left sidebar
3. Click **"Create application"** → **"Pages"** → **"Upload assets"**
4. Give your project a name (e.g., `wordwise`)
5. **Drag and drop the entire `dist` folder** or click to browse
6. Click **"Deploy site"**

✅ **Done!** Your site will be live at `https://wordwise-xxx.pages.dev`

---

## Option 2: Deploy via Wrangler CLI (Advanced)

If you want to use the command line:

### Step 1: Install Wrangler
```powershell
npm install -g wrangler
```

### Step 2: Login to Cloudflare
```powershell
wrangler login
```

### Step 3: Deploy
```powershell
wrangler pages deploy dist --project-name=wordwise
```

---

## Option 3: Connect to GitHub (Automatic Deployments)

### Step 1: Push to GitHub
1. Create a new repository on GitHub
2. Run these commands:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### Step 2: Connect to Cloudflare Pages
1. Go to https://dash.cloudflare.com/
2. Click **"Workers & Pages"** → **"Create application"** → **"Pages"** → **"Connect to Git"**
3. Select your GitHub repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. Click **"Save and Deploy"**

✅ **Automatic deployments** on every push to main branch!

---

## Your Build Output

All files are ready in the `dist` folder:
- ✅ index.html (Home page)
- ✅ subscription.html (Pricing - ₹25,000 one-time)
- ✅ contact.html (Contact form)
- ✅ dashboard.html (User dashboard)
- ✅ login.html (Authentication)
- ✅ my-course.html (Video course with GCP bucket integration)
- ✅ admin/login.html (Admin login)
- ✅ admin/dashboard.html (Admin dashboard)
- ✅ assets/ (CSS & JS)

## Custom Domain (Optional)

After deployment, you can add a custom domain:
1. Go to your Pages project in Cloudflare dashboard
2. Click **"Custom domains"**
3. Add your domain (e.g., `wordwise.com`)
4. Follow the DNS setup instructions

---

## Recommended: Option 1 (Drag & Drop)
The easiest way is to use the Cloudflare dashboard and drag & drop your `dist` folder!
