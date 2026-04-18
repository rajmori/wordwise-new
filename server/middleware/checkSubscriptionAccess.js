import Subscription from '../models/Subscription.js';

/**
 * Middleware to check if user has active subscription
 * Must be used AFTER authenticateUser middleware
 * 
 * Usage:
 * router.get('/courses/:id/content', authenticateUser, checkSubscriptionAccess, getCourseContent);
 */
export const checkSubscriptionAccess = async (req, res, next) => {
    try {
        // User should already be authenticated by authenticateUser middleware
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const userId = req.user.id;
        const courseId = req.params.id; // If accessing a specific course

        // 1. Check if user has purchased this specific course
        if (courseId && req.user.enrolledCourses && req.user.enrolledCourses.some(e => e.courseId && e.courseId.toString() === courseId)) {
            console.log(`✅ User has purchased course ${courseId}, granting access.`);
            req.courseAccessType = 'purchase';
            return next();
        }

        // 2. Check active subscription for user
        const subscription = await Subscription.findOne({
            userId: userId,
            status: 'active',
            currentPeriodEnd: { $gt: new Date() }
        });

        if (!subscription) {
            return res.status(403).json({
                success: false,
                message: 'Active subscription or course purchase required to access this content.',
                requiresSubscription: true
            });
        }

        // Attach subscription info to request for use in route handlers
        req.subscription = {
            id: subscription._id,
            planName: subscription.planName,
            currentPeriodEnd: subscription.currentPeriodEnd
        };

        next();

    } catch (error) {
        console.error('❌ Subscription Access Check Error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to verify subscription access'
        });
    }
};

