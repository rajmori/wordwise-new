# WordWise Course Management System

A comprehensive course management system for the WordWise admin panel with MongoDB integration and GCP bucket storage for media files.

## 🚀 Features

### Course Management
- ✅ Create, edit, and delete courses
- ✅ Publish/unpublish courses
- ✅ Course difficulty levels (Beginner, Intermediate, Advanced)
- ✅ Learning outcomes and target audience
- ✅ Course statistics and analytics

### Lesson Management
- ✅ Organize lessons into modules
- ✅ Multiple content types (text, video, image, interactive, mixed)
- ✅ Interactive examples (fill-in-blank, sentence builder, multiple choice)
- ✅ Tag lessons with topics, roots, and parts of speech
- ✅ Drag-and-drop lesson reordering

### Media Upload
- ✅ Image upload to GCP bucket
- ✅ Video upload with progress tracking
- ✅ Automatic file optimization
- ✅ Secure file storage

### Admin Features
- ✅ User management dashboard
- ✅ Course management dashboard
- ✅ Real-time statistics
- ✅ Search and filter functionality
- ✅ Responsive design

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Google Cloud Platform account (optional, for media uploads)

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd wordwise-2
```

### 2. Install Frontend Dependencies
```bash
npm install
```

### 3. Install Backend Dependencies
```bash
cd server
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the `server` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/wordwise
# For MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/wordwise

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# GCP Storage (Optional)
GCP_PROJECT_ID=your-gcp-project-id
GCP_BUCKET_NAME=wordwise-media
GCP_KEYFILE_PATH=./gcp-service-account-key.json

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 5. Set Up MongoDB

**Option A: Local MongoDB**
```bash
# Install MongoDB
# Windows: Download from https://www.mongodb.com/try/download/community
# Mac: brew install mongodb-community
# Linux: sudo apt-get install mongodb

# Start MongoDB
mongod
```

**Option B: MongoDB Atlas (Cloud)**
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`

### 6. Set Up GCP Storage (Optional)

If you want to enable media uploads:

1. Create a GCP project at https://console.cloud.google.com
2. Enable Cloud Storage API
3. Create a storage bucket
4. Create a service account with Storage Admin role
5. Download JSON key file
6. Place key file in `server/` directory
7. Update GCP variables in `.env`

**Note:** The system will work without GCP configured, but media upload features will be disabled.

## 🚀 Running the Application

### Start Backend Server
```bash
cd server
npm run dev
```

The backend will run on `http://localhost:5000`

### Start Frontend Development Server
```bash
# In the root directory
npm run dev
```

The frontend will run on `http://localhost:5173`

## 📱 Usage

### Admin Login
1. Navigate to `http://localhost:5173/admin/login.html`
2. Use default credentials:
   - Email: `admin@wordwise.com`
   - Password: `admin123`

### Creating a Course

1. Go to **Course Management** from the admin dashboard
2. Click **Create Course**
3. Fill in course details:
   - Title, description
   - Difficulty level
   - Estimated duration
   - Learning outcomes
   - Target audience
4. Add modules and lessons
5. Upload media (images/videos)
6. Add interactive examples
7. Save as draft or publish

### Managing Lessons

1. Within a course, click **Add Module**
2. Name the module (e.g., "Week 1")
3. Click **Add Lesson** within the module
4. Choose content type:
   - **Text**: Rich text content
   - **Video**: Upload video files
   - **Image**: Upload images
   - **Interactive**: Add fill-in-blank, sentence builder exercises
   - **Mixed**: Combine multiple types
5. Add tags for topics, roots, parts of speech
6. Save lesson

## 🏗️ Project Structure

```
wordwise-2/
├── admin/                      # Admin panel frontend
│   ├── courses.html           # Course management dashboard
│   ├── course-editor.html     # Course creation/editing
│   ├── dashboard.html         # User management dashboard
│   ├── login.html             # Admin login
│   ├── course-management.js   # Course management logic
│   ├── course-editor.js       # Course editor logic
│   ├── admin.js               # Admin dashboard logic
│   └── admin-style.css        # Admin panel styles
├── server/                     # Backend API
│   ├── config/                # Configuration files
│   │   ├── database.js        # MongoDB connection
│   │   └── gcp.js             # GCP Storage config
│   ├── models/                # MongoDB models
│   │   ├── Course.js          # Course schema
│   │   └── Lesson.js          # Lesson schema
│   ├── controllers/           # Business logic
│   │   ├── courseController.js
│   │   ├── lessonController.js
│   │   └── uploadController.js
│   ├── routes/                # API routes
│   │   ├── authRoutes.js
│   │   ├── courseRoutes.js
│   │   ├── lessonRoutes.js
│   │   └── uploadRoutes.js
│   ├── middleware/            # Express middleware
│   │   ├── auth.js            # Authentication
│   │   └── upload.js          # File upload handling
│   ├── utils/                 # Utility functions
│   │   └── gcp-storage.js     # GCP upload/delete
│   ├── server.js              # Main server file
│   └── package.json           # Backend dependencies
├── config.js                  # Frontend configuration
├── package.json               # Frontend dependencies
└── README.md                  # This file
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login

### Courses
- `GET /api/courses` - List all courses
- `GET /api/courses/:id` - Get single course
- `POST /api/courses` - Create course
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course
- `PATCH /api/courses/:id/publish` - Toggle publish status
- `GET /api/courses/stats` - Get statistics

### Lessons
- `GET /api/lessons/course/:courseId` - Get lessons for course
- `GET /api/lessons/:id` - Get single lesson
- `POST /api/lessons/course/:courseId` - Create lesson
- `PUT /api/lessons/:id` - Update lesson
- `DELETE /api/lessons/:id` - Delete lesson
- `PATCH /api/lessons/reorder` - Reorder lessons

### Uploads
- `POST /api/upload/image` - Upload image
- `POST /api/upload/video` - Upload video
- `DELETE /api/upload` - Delete file

## 🎨 Features in Detail

### Interactive Examples

Create engaging learning experiences:

**Fill in the Blank**
```
Question: "The _____ of the argument was compelling."
Answer: "crux"
```

**Sentence Builder**
```
Words: ["The", "student", "studied", "diligently"]
Correct order: The student studied diligently
```

**Multiple Choice**
```
Question: "What does 'benevolent' mean?"
Options: ["Kind", "Angry", "Sad", "Happy"]
Answer: "Kind"
```

### Tagging System

Organize lessons with tags:
- **Topics**: vocabulary, grammar, reading
- **Roots**: Latin, Greek, Sanskrit
- **Parts of Speech**: noun, verb, adjective, etc.

## 🔒 Security

- JWT-based authentication
- Admin-only routes protected
- Input validation on all endpoints
- Secure file upload handling
- CORS configuration

## 🚧 Troubleshooting

### Backend won't start
- Check if MongoDB is running
- Verify `.env` configuration
- Check port 5000 is not in use

### Frontend can't connect to backend
- Ensure backend is running on port 5000
- Check CORS configuration
- Verify API_BASE_URL in `config.js`

### Media uploads failing
- GCP credentials may not be configured
- Check GCP bucket permissions
- Verify service account has Storage Admin role
- System works without GCP (uploads disabled)

### MongoDB connection error
- Verify MongoDB is running
- Check connection string in `.env`
- For Atlas: check network access settings

## 📝 Development

### Running Tests
```bash
cd server
npm test
```

### Building for Production
```bash
# Frontend
npm run build

# Backend
cd server
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 🙋 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the server README in `server/README.md`
3. Open an issue on GitHub

## 🎯 Roadmap

- [ ] Course preview for students
- [ ] Progress tracking
- [ ] Quiz functionality
- [ ] Certificate generation
- [ ] Email notifications
- [ ] Advanced analytics
- [ ] Bulk import/export
- [ ] Multi-language support

---

**Built with ❤️ for WordWise**