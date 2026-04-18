import express from 'express';
import { authenticateUser } from '../middleware/userAuth.js';
import {
    createCourseOrder,
    verifyCoursePayment,
    getMyPurchases
} from '../controllers/courseOrderController.js';

const router = express.Router();

// All routes require authentication
router.post('/create', authenticateUser, createCourseOrder);
router.post('/verify', authenticateUser, verifyCoursePayment);
router.get('/my-purchases', authenticateUser, getMyPurchases);

export default router;
