import express from 'express';
import authRoutes from './admin/auth.routes.js';
import usersRoutes from './admin/users.routes.js';
import coursesRoutes from './admin/courses.routes.js';
import quizzesRoutes from './admin/quizzes.routes.js';
import subscriptionsRoutes from './admin/subscriptions.routes.js';
import auditRoutes from './admin/audit.routes.js';
import settingsRoutes from './admin/settings.routes.js';

const router = express.Router();

// Correlation ID registration middleware for auditability and observability
router.use((req, res, next) => {
    req.correlationId = req.headers['x-correlation-id'] || `corr-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    res.setHeader('x-correlation-id', req.correlationId);
    next();
});

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/courses', coursesRoutes);
router.use('/quizzes', quizzesRoutes);
router.use('/subscriptions', subscriptionsRoutes);
router.use('/audit', auditRoutes);
router.use('/settings', settingsRoutes);

export default router;
