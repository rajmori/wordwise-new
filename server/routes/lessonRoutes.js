import express from 'express';
import { body } from 'express-validator';
import { authenticateAdmin } from '../middleware/auth.js';
import { authenticateUser } from '../middleware/userAuth.js';
import { checkSubscriptionAccess } from '../middleware/checkSubscriptionAccess.js';
import {
    getLessonsByCourse,
    getLessonById,
    createLesson,
    updateLesson,
    deleteLesson,
    reorderLessons
} from '../controllers/lessonController.js';

const router = express.Router();

// Protected routes - require active subscription to access lesson content
// Note: Preview lessons (isPreview: true) should be handled in the controller
router.get('/course/:courseId', authenticateUser, checkSubscriptionAccess, getLessonsByCourse);
router.get('/:id', authenticateUser, checkSubscriptionAccess, getLessonById);

// Protected routes (require admin authentication)
router.post(
    '/course/:courseId',
    authenticateAdmin,
    [
        body('moduleId').notEmpty().withMessage('Module ID is required'),
        body('title').trim().notEmpty().withMessage('Title is required'),
        body('contentType').isIn(['text', 'video', 'image', 'interactive', 'mixed']).withMessage('Invalid content type')
    ],
    createLesson
);

router.put('/:id', authenticateAdmin, updateLesson);
router.delete('/:id', authenticateAdmin, deleteLesson);
router.patch('/reorder', authenticateAdmin, reorderLessons);

export default router;
