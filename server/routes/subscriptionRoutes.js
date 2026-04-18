import express from 'express';
import { protect as authenticateUser } from '../middlewares/auth.middleware.js';
import { authenticateAdmin } from '../middleware/auth.js';
import {
    getPlanDetails,
    createPaymentLink,
    createSubscription,
    confirmPaymentLink,
    confirmPayment,
    verifyPayment,
    cancelSubscription,
    getUserSubscription,
    getAllSubscriptions
} from '../controllers/subscriptionController.js';

const router = express.Router();

// Note: Webhook route is registered directly in server.js with express.raw() middleware
// This is required for Razorpay signature verification

// Public routes (no authentication required)
router.get('/plan-details', getPlanDetails);

// Customer routes (require user authentication)
// Payment Link routes (for one-time payment)
router.post('/create-payment-link', authenticateUser, createPaymentLink);
router.post('/confirm-payment-link', authenticateUser, confirmPaymentLink);

// Subscription routes (for recurring payment)
router.post('/create-subscription', authenticateUser, createSubscription);
router.post('/confirm-payment', authenticateUser, confirmPayment);
router.post('/verify-payment', authenticateUser, verifyPayment);

// Common routes
router.get('/my-subscription', authenticateUser, getUserSubscription);

// Admin routes (require admin authentication)
router.get('/admin/subscriptions', authenticateAdmin, getAllSubscriptions);
router.post('/admin/:subscriptionId/cancel', authenticateAdmin, cancelSubscription);

export default router;

