import express from 'express';
import {
    googleSignup,
    googleSignin,
    googleAuth,
    emailPasswordSignup,
    emailPasswordLogin,
    getUserProfile,
    updateUserProfile,
    getSubscriptionBanner
} from '../controllers/userAuthController.js';
import { protect as authenticateUser } from '../middlewares/auth.middleware.js';

import rateLimit from 'express-rate-limit';

const router = express.Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 mins
    max: 10,
    message: { success: false, message: 'Too many login attempts from this IP, please try again after 15 minutes' }
});

/**
 * @route   POST /api/users/auth/signup
 * @desc    Register new user with email/password
 * @access  Public
 */
router.post('/auth/signup', authLimiter, emailPasswordSignup);

/**
 * @route   POST /api/users/auth/login
 * @desc    Login user with email/password
 * @access  Public
 */
router.post('/auth/login', authLimiter, emailPasswordLogin);

/**
 * @route   POST /api/users/auth/google/signup
 * @desc    Register new user with Google OAuth
 * @access  Public
 */
router.post('/auth/google/signup', authLimiter, googleSignup);

/**
 * @route   POST /api/users/auth/google/signin
 * @desc    Sign in existing user with Google OAuth
 * @access  Public
 */
router.post('/auth/google/signin', authLimiter, googleSignin);

/**
 * @route   POST /api/users/auth/google
 * @desc    Authenticate user with Google OAuth (legacy - auto signup/signin)
 * @access  Public
 */
router.post('/auth/google', authLimiter, googleAuth);

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticateUser, getUserProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticateUser, updateUserProfile);

/**
 * @route   GET /api/users/me
 * @desc    Get current user basic info (alias for profile)
 * @access  Private
 */
router.get('/me', authenticateUser, async (req, res) => {
    try {
        const User = (await import('../models/user.model.js')).default;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                picture: user.picture,
                subscription: user.subscription
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user info'
        });
    }
});

/**
 * @route   GET /api/user/subscription-banner
 * @desc    Get subscription expiry banner (shows if expires within 15 days)
 * @access  Private
 */
router.get('/subscription-banner', authenticateUser, getSubscriptionBanner);

export default router;

