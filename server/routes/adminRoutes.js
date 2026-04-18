import express from 'express';
import { adminLogin, authenticateAdmin } from '../middleware/auth.js';
import Subscription from '../models/Subscription.js';
import User from '../models/user.model.js';
import LoginLog from '../models/LoginLog.js';
import {
    getSubscriptions,
    getSubscriptionById,
    updateSubscription,
    deleteSubscription
} from '../controllers/adminController.js';

import rateLimit from 'express-rate-limit';

const router = express.Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, message: 'Too many login attempts from this IP, please try again after 15 minutes' }
});

// Admin login
router.post('/login', authLimiter, async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email and password are required'
        });
    }

    const result = await adminLogin(email, password);

    if (result.success) {
        res.cookie('token', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000,
            sameSite: 'strict'
        });

        res.json({
            success: true,
            message: 'Login successful',
            token: result.token,
            admin: result.admin
        });
    } else {
        res.status(401).json({
            success: false,
            message: result.message
        });
    }
});

// Get all subscribed users
router.get('/users', authenticateAdmin, async (req, res) => {
    try {
        // Fetch all users
        const dbUsers = await User.find().sort({ createdAt: -1 }).lean();
        
        // Fetch all subscriptions to map them to users
        const subscriptions = await Subscription.find().lean();
        const subMap = {};
        for (const sub of subscriptions) {
            const uid = sub.userId ? sub.userId.toString() : null;
            if (!uid) continue;
            
            // Prioritize active subscriptions or the latest one
            if (!subMap[uid]) {
                subMap[uid] = sub;
            } else {
                if (sub.status === 'active' && subMap[uid].status !== 'active') {
                    subMap[uid] = sub;
                // If both are active or inactive, prefer the one that ends later
                } else if (new Date(sub.currentPeriodEnd) > new Date(subMap[uid].currentPeriodEnd)) {
                    subMap[uid] = sub;
                }
            }
        }

        const users = dbUsers.map(user => {
            const sub = subMap[user._id.toString()];
            
            if (sub) {
                return {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    subscriptionId: sub._id,          // ← needed by frontend edit/delete
                    subscriptionPlan: sub.planName || 'Unknown',
                    subscriptionStartDate: sub.currentPeriodStart,
                    subscriptionEndDate: sub.currentPeriodEnd,
                    status: sub.status === 'active' && new Date(sub.currentPeriodEnd) > new Date() ? 'Active' : 'Inactive',
                    paymentAmount: sub.amount ? sub.amount / 100 : 0,
                    paymentMethod: 'Razorpay',
                    lastPaymentDate: sub.createdAt,
                    createdAt: user.createdAt
                };
            } else {
                // User has no subscription
                return {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    subscriptionId: null,              // ← no subscription
                    subscriptionPlan: 'None',
                    subscriptionStartDate: null,
                    subscriptionEndDate: null,
                    status: 'Inactive',
                    paymentAmount: 0,
                    paymentMethod: 'N/A',
                    lastPaymentDate: null,
                    createdAt: user.createdAt
                };
            }
        });

        res.json({
            success: true,
            users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users'
        });
    }
});

// Get all login logs
router.get('/login-logs', authenticateAdmin, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const page = parseInt(req.query.page) || 1;
        
        const logs = await LoginLog.find()
            .populate('userId', 'name email')
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();
            
        res.json({
            success: true,
            logs,
            page,
            limit
        });
    } catch (error) {
        console.error('Error fetching login logs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch login logs'
        });
    }
});

// ── Subscription Management ───────────────────────────────────────────────────

// List all subscriptions (paginated)
router.get('/subscriptions', authenticateAdmin, getSubscriptions);

// Get a single subscription by ID
router.get('/subscriptions/:id', authenticateAdmin, getSubscriptionById);

// Update a subscription (plan, status, dates, amount)
router.put('/subscriptions/:id', authenticateAdmin, updateSubscription);

// Delete a subscription (and sync user.isSubscribed)
router.delete('/subscriptions/:id', authenticateAdmin, deleteSubscription);

export default router;
