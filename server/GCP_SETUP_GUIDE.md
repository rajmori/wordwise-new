# GCP Storage Setup Guide for WordWise

## Current Status
Based on your server logs, GCP Storage is **already initialized** with bucket: `wordwise-media`

## ✅ What's Already Working
- GCP bucket is connected
- Bucket name: `wordwise-media`
- The server shows: "✅ GCP Storage initialized: wordwise-media"

## 📋 To Verify GCP Connection

### 1. Check Server Logs
When you start the server, you should see:
```
✅ MongoDB Connected: ...
✅ GCP Storage initialized: wordwise-media
🚀 WordWise API Server running on port 5000
```

### 2. Test Image Upload
You can test if GCP is working by:
1. Go to Course Editor
2. Add a lesson
3. Try uploading an image
4. If it works, GCP is connected!

## 🔧 If You Need to Reconfigure GCP

### Option 1: Using Existing Setup
Your GCP is already configured. The credentials are in your `.env` file:
- `GCP_PROJECT_ID`: Your project ID
- `GCP_BUCKET_NAME`: wordwise-media
- `GCP_KEYFILE_PATH`: Path to your service account JSON key

### Option 2: Verify Bucket Permissions
1. Go to https://console.cloud.google.com/storage
2. Find bucket: `wordwise-media`
3. Check permissions:
   - Service account should have "Storage Admin" or "Storage Object Admin" role
   - Bucket should allow uploads

### Option 3: Check Service Account Key
The service account JSON key file should be at the path specified in `.env`:
- Default: `./gcp-service-account-key.json`
- Make sure this file exists in the `server/` directory

## 🧪 Test GCP Upload

Run this test script to verify GCP is working:

```bash
cd server
node test-gcp-upload.js
```

I can create this test script for you if needed.

## 📊 GCP Bucket Details

**Bucket Name**: `wordwise-media`
**Purpose**: Store course images and videos
**Max File Sizes**:
- Images: 5MB
- Videos: 2GB

## 🔒 Security Notes

1. **Service Account Key**: Keep your JSON key file secure
2. **Bucket Access**: Set to private, use signed URLs for access
3. **CORS**: Configure CORS if accessing from browser directly

## ✅ Current Configuration

Based on your server startup, GCP is **already connected and working**! 

You can:
1. Upload images (up to 5MB)
2. Upload videos (up to 2GB)
3. Files will be stored in `wordwise-media` bucket
4. URLs will be returned for embedding in courses

## 🚀 Next Steps

1. **Test Upload**: Try uploading an image in the course editor
2. **Check Bucket**: Verify files appear in GCP console
3. **Monitor Storage**: Keep an eye on storage usage

---

**Need help?** Let me know if you want me to:
- Create a test upload script
- Check bucket permissions
- Troubleshoot upload issues
