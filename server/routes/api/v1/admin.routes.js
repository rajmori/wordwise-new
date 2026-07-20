import express from 'express';
import jwt from 'jsonwebtoken';
import authRoutes from './admin/auth.routes.js';
import usersRoutes from './admin/users.routes.js';
import coursesRoutes from './admin/courses.routes.js';
import quizzesRoutes from './admin/quizzes.routes.js';
import subscriptionsRoutes from './admin/subscriptions.routes.js';
import auditRoutes from './admin/audit.routes.js';
import settingsRoutes from './admin/settings.routes.js';

const router = express.Router();

// Correlation ID for tracing
router.use((req, res, next) => {
    req.correlationId = req.headers['x-correlation-id'] || `corr-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    res.setHeader('x-correlation-id', req.correlationId);
    next();
});

// Public routes — no auth required
router.use('/auth', authRoutes);

// JWT verification middleware for all routes below
router.use((req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error('JWT_SECRET not configured');
        const decoded = jwt.verify(token, secret);
        req.user = {
            id: decoded.id,
            email: decoded.email,
            name: decoded.name,
            role: decoded.role,
            roles: decoded.roles || (decoded.role ? [decoded.role] : [])
        };
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token. Please log in again.' });
    }
});

// Protected routes
router.use('/users', usersRoutes);
router.use('/courses', coursesRoutes);
router.use('/quizzes', quizzesRoutes);
router.use('/subscriptions', subscriptionsRoutes);
router.use('/audit', auditRoutes);
router.use('/settings', settingsRoutes);

export default router;
