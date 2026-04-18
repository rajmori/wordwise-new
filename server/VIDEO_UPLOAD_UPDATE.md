# Video Upload Size Increased to 2GB

## Changes Made

### 1. Backend - Upload Middleware
**File**: `server/middleware/upload.js`
- Updated file size limit from 100MB to **2GB (2048MB)**
- New limit: `2048 * 1024 * 1024` bytes

### 2. Backend - Error Messages
**File**: `server/server.js`
- Updated error message to reflect new limits:
  - "File size too large. Maximum size is 2GB for videos and 5MB for images."

### 3. Frontend - UI Text
**File**: `admin/course-editor.html`
- Updated upload placeholder text from "Max 100MB" to **"Max 2GB"**

### 4. Environment Configuration
**File**: `server/.env.example`
- Updated `MAX_VIDEO_SIZE` from `104857600` (100MB) to **`2147483648` (2GB)**

## File Size Limits

| File Type | Maximum Size | Bytes |
|-----------|--------------|-------|
| Images    | 5MB          | 5,242,880 |
| Videos    | **2GB**      | **2,147,483,648** |

## Important Notes

### For Production Use:
1. **GCP Bucket Storage**: Ensure your GCP bucket has sufficient storage quota
2. **Network Bandwidth**: Large file uploads require stable internet connection
3. **Upload Timeout**: Consider increasing server timeout for large files
4. **Client-Side**: Browser upload progress bar will show upload status

### Testing Large Uploads:
- Test with files up to 2GB to ensure smooth upload
- Monitor GCP storage costs for large media files
- Consider implementing video compression on client-side for better performance

### Optional Optimizations:
1. **Chunked Uploads**: For files > 500MB, consider implementing chunked uploads
2. **Video Transcoding**: Compress videos server-side after upload
3. **CDN**: Use GCP CDN for faster video delivery
4. **Streaming**: Implement adaptive bitrate streaming for large videos

## No Server Restart Needed

The changes are in the code files. To apply them:
1. **Restart the backend server** (Ctrl+C and run `npm run dev` again)
2. **Refresh the frontend** in your browser

## Verification

To test the new limit:
1. Go to Course Editor
2. Add a lesson with video content
3. Try uploading a video file (up to 2GB)
4. Upload progress will show
5. File will be uploaded to GCP bucket

---

**✅ Video upload limit successfully increased from 100MB to 2GB!**
