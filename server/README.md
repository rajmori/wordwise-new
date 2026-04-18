# WordWise Backend Server Setup

## Quick Start

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and update the values:
```bash
cp .env.example .env
```

**Required Configuration:**
- `MONGODB_URI`: Your MongoDB connection string
  - Local: `mongodb://localhost:27017/wordwise`
  - Atlas: `mongodb+srv://username:password@cluster.mongodb.net/wordwise`
- `JWT_SECRET`: A secure random string for JWT tokens

**Optional (for media uploads):**
- `GCP_PROJECT_ID`: Your Google Cloud Project ID
- `GCP_BUCKET_NAME`: Your GCP Storage bucket name
- `GCP_KEYFILE_PATH`: Path to your service account JSON key file

### 3. Start MongoDB (if using local)
```bash
# Windows
mongod

# Mac/Linux
sudo systemctl start mongod
```

### 4. Start the Server
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login

### Courses
- `GET /api/courses` - Get all courses (with pagination, search, filters)
- `GET /api/courses/:id` - Get single course
- `POST /api/courses` - Create course (admin only)
- `PUT /api/courses/:id` - Update course (admin only)
- `DELETE /api/courses/:id` - Delete course (admin only)
- `PATCH /api/courses/:id/publish` - Toggle publish status (admin only)
- `GET /api/courses/stats` - Get course statistics

### Lessons
- `GET /api/lessons/course/:courseId` - Get lessons for a course
- `GET /api/lessons/:id` - Get single lesson
- `POST /api/lessons/course/:courseId` - Create lesson (admin only)
- `PUT /api/lessons/:id` - Update lesson (admin only)
- `DELETE /api/lessons/:id` - Delete lesson (admin only)
- `PATCH /api/lessons/reorder` - Reorder lessons (admin only)

### Uploads
- `POST /api/upload/image` - Upload image (admin only)
- `POST /api/upload/video` - Upload video (admin only)
- `DELETE /api/upload` - Delete file (admin only)

## Default Admin Credentials
- Email: `admin@wordwise.com`
- Password: `admin123`

**⚠️ Change these in production!**

## GCP Storage Setup (Optional)

If you want to enable media uploads:

1. Create a GCP project
2. Enable Cloud Storage API
3. Create a storage bucket
4. Create a service account with Storage Admin role
5. Download the JSON key file
6. Place it in the server directory
7. Update `.env` with GCP configuration

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check your connection string
- Verify network access (for Atlas)

### GCP Upload Error
- The server will work without GCP configured
- Media upload features will be disabled
- Configure GCP credentials to enable uploads
