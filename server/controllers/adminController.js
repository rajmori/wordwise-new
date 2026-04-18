import Subscription from '../models/Subscription.js';
import User from '../models/user.model.js';

/**
 * Get all subscriptions (with user info populated)
 * GET /api/admin/subscriptions
 */
export const getSubscriptions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const skip = (page - 1) * limit;

        const [subscriptions, total] = await Promise.all([
            Subscription.find()
                .populate('userId', 'name email isSubscribed')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Subscription.countDocuments()
        ]);

        res.json({
            success: true,
            subscriptions,
            total,
            page,
            limit
        });
    } catch (error) {
        console.error('❌ Admin getSubscriptions error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch subscriptions' });
    }
};

/**
 * Get a single subscription by its _id
 * GET /api/admin/subscriptions/:id
 */
export const getSubscriptionById = async (req, res) => {
    try {
        const subscription = await Subscription.findById(req.params.id)
            .populate('userId', 'name email')
            .lean();

        if (!subscription) {
            return res.status(404).json({ success: false, message: 'Subscription not found' });
        }

        res.json({ success: true, subscription });
    } catch (error) {
        console.error('❌ Admin getSubscriptionById error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch subscription' });
    }
};

/**
 * Update a subscription
 * PUT /api/admin/subscriptions/:id
 *
 * Editable fields:
 *   planName, status, currentPeriodStart, currentPeriodEnd, amount, cancelAtPeriodEnd
 */
export const updateSubscription = async (req, res) => {
    try {
        const { planName, status, currentPeriodStart, currentPeriodEnd, amount, cancelAtPeriodEnd } = req.body;

        // Validate status if provided
        const validStatuses = ['active', 'canceled', 'cancelled', 'past_due', 'expired'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        const subscription = await Subscription.findById(req.params.id);
        if (!subscription) {
            return res.status(404).json({ success: false, message: 'Subscription not found' });
        }

        // Apply changes only for fields that were sent
        if (planName !== undefined) subscription.planName = planName;
        if (status !== undefined) subscription.status = status;
        if (currentPeriodStart !== undefined) subscription.currentPeriodStart = new Date(currentPeriodStart);
        if (currentPeriodEnd !== undefined) subscription.currentPeriodEnd = new Date(currentPeriodEnd);
        if (amount !== undefined) subscription.amount = Number(amount);
        if (cancelAtPeriodEnd !== undefined) subscription.cancelAtPeriodEnd = Boolean(cancelAtPeriodEnd);

        await subscription.save();

        // Sync the user's isSubscribed flag based on the updated status
        const isActiveNow = subscription.status === 'active' && subscription.currentPeriodEnd > new Date();
        await User.findByIdAndUpdate(subscription.userId, { isSubscribed: isActiveNow });

        const updated = await Subscription.findById(req.params.id)
            .populate('userId', 'name email')
            .lean();

        res.json({
            success: true,
            message: 'Subscription updated successfully',
            subscription: updated
        });
    } catch (error) {
        console.error('❌ Admin updateSubscription error:', error);
        res.status(500).json({ success: false, message: 'Failed to update subscription' });
    }
};

/**
 * Delete a subscription
 * DELETE /api/admin/subscriptions/:id
 *
 * After deletion, syncs user.isSubscribed based on remaining active subscriptions.
 */
export const deleteSubscription = async (req, res) => {
    try {
        const subscription = await Subscription.findById(req.params.id);
        if (!subscription) {
            return res.status(404).json({ success: false, message: 'Subscription not found' });
        }

        const userId = subscription.userId;

        await Subscription.findByIdAndDelete(req.params.id);

        // Check if user still has any active subscription after deletion
        const remainingActive = await Subscription.findOne({
            userId,
            status: 'active',
            currentPeriodEnd: { $gt: new Date() }
        });

        await User.findByIdAndUpdate(userId, { isSubscribed: !!remainingActive });

        res.json({
            success: true,
            message: 'Subscription deleted successfully'
        });
    } catch (error) {
        console.error('❌ Admin deleteSubscription error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete subscription' });
    }
};
