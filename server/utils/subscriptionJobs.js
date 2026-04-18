import Subscription from '../models/Subscription.js';

/**
 * Check for subscriptions expiring in 15 days
 * This function can be called manually or scheduled with a cron job
 * 
 * Usage:
 * import { checkSubscriptionExpiryJob } from './utils/subscriptionJobs.js';
 * const expiringUsers = await checkSubscriptionExpiryJob();
 * 
 * @returns {Promise<Array>} Array of user IDs with expiring subscriptions
 */
export const checkSubscriptionExpiryJob = async () => {
    try {
        const now = new Date();
        const fifteenDaysFromNow = new Date();
        fifteenDaysFromNow.setDate(fifteenDaysFromNow.getDate() + 15);

        console.log(`🔍 Checking for subscriptions expiring between ${now.toISOString()} and ${fifteenDaysFromNow.toISOString()}`);

        // Find subscriptions expiring in the next 15 days
        const expiringSubscriptions = await Subscription.find({
            status: 'active',
            currentPeriodEnd: {
                $gte: now,
                $lte: fifteenDaysFromNow
            }
        }).populate('userId', 'email name');

        if (expiringSubscriptions.length === 0) {
            console.log('✅ No subscriptions expiring in the next 15 days');
            return [];
        }

        console.log(`⚠️ Found ${expiringSubscriptions.length} subscription(s) expiring in the next 15 days:`);

        const userIds = [];

        for (const subscription of expiringSubscriptions) {
            const daysUntilExpiry = Math.ceil(
                (subscription.currentPeriodEnd - now) / (1000 * 60 * 60 * 24)
            );

            console.log(
                `⚠️ Subscription expiring in ${daysUntilExpiry} days: ` +
                `User ${subscription.userId.email} (${subscription.userId.name}), ` +
                `Expires: ${subscription.currentPeriodEnd.toISOString()}, ` +
                `Plan: ${subscription.planName}`
            );

            userIds.push(subscription.userId._id);
        }

        return userIds;

    } catch (error) {
        console.error('❌ Subscription Expiry Check Error:', error);
        throw error;
    }
};

/**
 * Get subscription statistics
 * Useful for admin dashboard
 * 
 * @returns {Promise<Object>} Subscription statistics
 */
export const getSubscriptionStats = async () => {
    try {
        const now = new Date();

        const stats = {
            total: await Subscription.countDocuments(),
            active: await Subscription.countDocuments({
                status: 'active',
                currentPeriodEnd: { $gt: now }
            }),
            canceled: await Subscription.countDocuments({
                status: 'canceled'
            }),
            pastDue: await Subscription.countDocuments({
                status: 'past_due'
            }),
            expiringSoon: await Subscription.countDocuments({
                status: 'active',
                currentPeriodEnd: {
                    $gte: now,
                    $lte: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000)
                }
            })
        };

        console.log('📊 Subscription Statistics:', stats);

        return stats;

    } catch (error) {
        console.error('❌ Get Subscription Stats Error:', error);
        throw error;
    }
};

