import express from 'express';
import mongoose from 'mongoose';
import User from '../../../../models/user.model.js';
import { checkPermission } from '../../../../middleware/rbac.js';
import { logAudit } from '../../../../utils/audit.js';

const router = express.Router();

/**
 * GET / - Paginated user list with search, status, and plan filters
 */
router.get('/', checkPermission('users:read'), async (req, res) => {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 10);
    const skip  = (page - 1) * limit;

    const search = req.query.search || '';
    const status = req.query.status;           // 'active' | 'inactive'
    const plan   = req.query.plan || '';       // subscription plan name substring

    try {
        const filter = {};

        if (search) {
            filter.$or = [
                { name:  { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        if (status === 'active')   filter.isActive = true;
        if (status === 'inactive') filter.isActive = false;

        if (plan) {
            filter['subscription.plan'] = { $regex: plan, $options: 'i' };
        }

        const [users, totalCount] = await Promise.all([
            User.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select('-password')
                .lean(),
            User.countDocuments(filter)
        ]);

        res.json({
            success: true,
            users: users.map(u => ({
                id: u._id,
                name: u.name,
                email: u.email,
                isActive: u.isActive,
                isSubscribed: u.isSubscribed,
                subscriptionPlan: u.subscription?.plan || 'free',
                subscriptionStatus: u.subscription?.status || 'inactive',
                subscriptionEndDate: u.subscription?.endDate || null,
                lastLogin: u.lastLogin,
                createdAt: u.createdAt
            })),
            pagination: {
                total: totalCount,
                page,
                limit,
                pages: Math.ceil(totalCount / limit)
            }
        });
    } catch (error) {
        console.error('Fetch users error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
});

/**
 * GET /:id - View full user detail
 */
router.get('/:id', checkPermission('users:read'), async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }

        const user = await User.findById(req.params.id)
            .select('-password')
            .populate('enrolledCourses.courseId', 'title')
            .lean();

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone || null,
                picture: user.picture || null,
                isActive: user.isActive,
                isSubscribed: user.isSubscribed,
                emailVerified: user.emailVerified,
                subscription: user.subscription,
                enrolledCourses: user.enrolledCourses,
                preferences: user.preferences,
                lastLogin: user.lastLogin,
                loginCount: user.loginCount,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });
    } catch (error) {
        console.error('Fetch user detail error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * POST / - Create a new user account
 */
router.post('/', checkPermission('users:write'), async (req, res) => {
    const { name, email, isActive, subscription } = req.body;

    if (!name || !email) {
        return res.status(400).json({ success: false, message: 'name and email are required' });
    }

    try {
        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(409).json({ success: false, message: 'A user with this email already exists' });
        }

        const user = await User.create({
            name,
            email: email.toLowerCase(),
            isActive: typeof isActive === 'boolean' ? isActive : true,
            subscription: subscription || undefined
        });

        await logAudit(req.user.id, 'users:create', 'User', user._id.toString(), {
            correlationId: req.correlationId,
            email: user.email
        });

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isActive: user.isActive,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ success: false, message: 'Failed to create user' });
    }
});

/**
 * PUT /:id - Update user profile and/or status
 */
router.put('/:id', checkPermission('users:write'), async (req, res) => {
    const { name, email, isActive, phone, subscription } = req.body;

    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }

        const existing = await User.findById(req.params.id).lean();
        if (!existing) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Build update object — only include provided fields
        const updates = {};
        if (name  !== undefined) updates.name    = name;
        if (phone !== undefined) updates.phone   = phone;
        if (email !== undefined) updates.email   = email.toLowerCase();
        if (typeof isActive === 'boolean') updates.isActive = isActive;
        if (subscription !== undefined)    updates.subscription = { ...existing.subscription, ...subscription };
        updates.updatedAt = new Date();

        const updated = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true, runValidators: true, select: '-password' }
        ).lean();

        await logAudit(req.user.id, 'users:update', 'User', req.params.id, {
            correlationId: req.correlationId,
            old: { name: existing.name, email: existing.email, isActive: existing.isActive },
            new: { name: updated.name, email: updated.email, isActive: updated.isActive }
        });

        res.json({
            success: true,
            message: 'User updated successfully',
            user: {
                id: updated._id,
                name: updated.name,
                email: updated.email,
                phone: updated.phone,
                isActive: updated.isActive,
                isSubscribed: updated.isSubscribed,
                subscription: updated.subscription,
                updatedAt: updated.updatedAt
            }
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ success: false, message: 'Failed to update user' });
    }
});

/**
 * PATCH /:id/status - Activate or deactivate a user account
 */
router.patch('/:id/status', checkPermission('users:write'), async (req, res) => {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
        return res.status(400).json({ success: false, message: 'isActive (boolean) is required' });
    }

    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: { isActive, updatedAt: new Date() } },
            { new: true, select: '-password' }
        ).lean();

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        await logAudit(req.user.id, 'users:status_change', 'User', req.params.id, {
            correlationId: req.correlationId,
            isActive
        });

        res.json({
            success: true,
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
            user: { id: user._id, isActive: user.isActive }
        });
    } catch (error) {
        console.error('Status update error:', error);
        res.status(500).json({ success: false, message: 'Failed to update user status' });
    }
});

export default router;
