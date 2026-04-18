import express from 'express';
import { body } from 'express-validator';
import { authenticateAdmin } from '../middleware/auth.js';
import { authenticateUser } from '../middleware/userAuth.js';
import { checkSubscriptionAccess } from '../middleware/checkSubscriptionAccess.js';
import {
    getAllCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
    togglePublishStatus,
    getCourseStats,
    getAllPublishedCourses
} from '../controllers/courseController.js';

const router = express.Router();

// Public routes (course list and basic info)
router.get('/stats', getCourseStats);
router.get('/', getAllCourses);

// Public route - Get published courses (no authentication required)
// IMPORTANT: Must be before /:id route to avoid being caught by parameter matcher
router.get('/published', getAllPublishedCourses);

// Protected route - requires active subscription to view full course details with lessons
router.get('/:id', authenticateUser, checkSubscriptionAccess, getCourseById);

// Protected routes (require admin authentication)
router.get('/:id/admin', authenticateAdmin, getCourseById);

router.post(
    '/',
    authenticateAdmin,
    [
        body('title').trim().notEmpty().withMessage('Title is required'),
        body('description').trim().notEmpty().withMessage('Description is required'),
        body('difficultyLevel').isIn(['Beginner', 'Intermediate', 'Advanced']).withMessage('Invalid difficulty level'),
        body('estimatedDuration.value').isInt({ min: 1 }).withMessage('Duration value must be at least 1'),
        body('estimatedDuration.unit').isIn(['days', 'weeks', 'months']).withMessage('Invalid duration unit'),
        body('price').optional().isInt({ min: 0 }).withMessage('Price must be a non-negative integer')
    ],
    createCourse
);

router.put('/:id', authenticateAdmin, updateCourse);
router.delete('/:id', authenticateAdmin, deleteCourse);
router.patch('/:id/publish', authenticateAdmin, togglePublishStatus);

export default router;
