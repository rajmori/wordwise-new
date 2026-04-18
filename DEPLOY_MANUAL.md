# Manual Cloudflare Deployment - Quick Guide

## 1. Build Your Site

```powershell
cd "d:\wordwise 2"
npm run build
```

## 2. Create ZIP File

```powershell
Compress-Archive -Path "dist\*" -DestinationPath "wordwise-production.zip" -Force
```

## 3. Upload to Cloudflare

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. **Workers & Pages** → **Create application** → **Pages**
3. Click **Upload assets**
4. Project name: `wordwise`
5. Upload `wordwise-production.zip`
6. Click **Deploy site**

## 4. Configure Domain

1. **Custom domains** → **Set up a custom domain**
2. Enter: `wordwise.in`
3. DNS configured automatically

## 5. Test

Visit `https://wordwise.in` and test Google login!

---

## Update Site Later

```powershell
npm run build
Compress-Archive -Path "dist\*" -DestinationPath "wordwise-production.zip" -Force
```

Then upload new ZIP in Cloudflare dashboard.

**Done! 🚀**
