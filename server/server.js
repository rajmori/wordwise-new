import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { initS3 } from './config/s3.js';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';

// Import routes
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/adminRoutes.js';
import profileRoutes from './routes/profile.routes.js';
import courseRoutes from './routes/courseRoutes.js';
import lessonRoutes from './routes/lessonRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import userRoutes from './routes/userRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import courseOrderRoutes from './routes/courseOrderRoutes.js';
import flashCardRoutes from './routes/flashCardRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import adminV1Routes from './routes/api/v1/admin.routes.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
        // Allow localhost in development
        if (process.env.NODE_ENV === 'development' || origin.includes('localhost') || origin.includes('127.0.0.1')) {
            return callback(null, true);
        }

        if (allowedOrigins.indexOf(origin) === -1) {
            // For now, allow all in dev mode to prevent blocking
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true
}));

app.use(cookieParser());

// IMPORTANT: Razorpay webhook route needs raw body for signature verification
// Register webhook route BEFORE express.json() middleware
import { handleWebhook } from './controllers/subscriptionController.js';
app.post('/api/subscriptions/webhook', express.json({ verify: (req, res, buf) => { req.rawBody = buf.toString(); } }), handleWebhook);

// Then add JSON parsing middleware for all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'WordWise API Server is running',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/v1/admin', adminV1Routes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/course-orders', courseOrderRoutes);
app.use('/api/flash-cards', flashCardRoutes);
app.use('/api/quizzes', quizRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);

    // Multer file upload errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            message: 'File size too large. Maximum size is 100MB for videos, 20MB for documents, and 5MB for images.'
        });
    }

    if (err.message && err.message.includes('Only')) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Initialize database and start server
const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();

        // Initialize AWS S3 (optional - will log warning if not configured)
        initS3();

        // Start server
        app.listen(PORT, () => {
            console.log(`\n🚀 WordWise API Server running on port ${PORT}`);
            console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 Health check: http://localhost:${PORT}/health\n`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

export default app;
