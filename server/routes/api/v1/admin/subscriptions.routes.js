import express from 'express';
import prisma from '../../../config/db.prisma.js';
import { checkPermission } from '../../../middleware/rbac.js';
import { logAudit } from '../../../utils/audit.js';

const router = express.Router();

/**
 * GET / - List subscriptions with user and plan details (paginated)
 */
router.get('/', checkPermission('subscriptions:read'), async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    try {
        const [subscriptions, totalCount] = await prisma.$transaction([
            prisma.subscription.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { name: true, email: true } },
                    plan: true
                }
            }),
            prisma.subscription.count()
        ]);

        res.json({
            success: true,
            subscriptions,
            pagination: {
                total: totalCount,
                page,
                limit,
                pages: Math.ceil(totalCount / limit)
            }
        });
    } catch (error) {
        console.error('Fetch subscriptions error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch subscriptions' });
    }
});

/**
 * POST /override - Force/override user subscription manually (admin override)
 */
router.post('/override', checkPermission('subscriptions:override'), async (req, res) => {
    const { userId, planId, status, durationMonths, amount } = req.body;
    if (!userId || !planId || !status) {
        return res.status(400).json({ success: false, message: 'userId, planId, and status are required' });
    }

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
        if (!plan) {
            return res.status(404).json({ success: false, message: 'Plan not found' });
        }

        const start = new Date();
        const end = new Date();
        end.setMonth(end.getMonth() + (durationMonths ? parseInt(durationMonths) : 12));

        // Create or update subscription record inside a transaction block
        const subscription = await prisma.$transaction(async (tx) => {
            const existingSub = await tx.subscription.findFirst({
                where: { userId }
            });

            let sub;
            if (existingSub) {
                sub = await tx.subscription.update({
                    where: { id: existingSub.id },
                    data: {
                        planId,
                        status,
                        amount: amount ? parseInt(amount) : plan.amount,
                        currentPeriodStart: start,
                        currentPeriodEnd: end,
                        provider: 'override_admin',
                        cancelAtPeriodEnd: false
                    }
                });
            } else {
                sub = await tx.subscription.create({
                    data: {
                        userId,
                        planId,
                        status,
                        amount: amount ? parseInt(amount) : plan.amount,
                        currentPeriodStart: start,
                        currentPeriodEnd: end,
                        provider: 'override_admin',
                        cancelAtPeriodEnd: false
                    }
                });
            }

            // Sync user.isSubscribed flag to match status
            await tx.user.update({
                where: { id: userId },
                data: { isSubscribed: status === 'active' }
            });

            return sub;
        });

        // Audit log records the override details
        await logAudit(
            req.user.id,
            'subscriptions:override',
            'Subscription',
            subscription.id,
            {
                correlationId: req.correlationId,
                userId,
                planId,
                status,
                amount: amount || plan.amount
            }
        );

        res.json({
            success: true,
            message: 'Manual subscription override applied successfully',
            subscription
        });
    } catch (error) {
        console.error('Subscription override error:', error);
        res.status(500).json({ success: false, message: 'Failed to apply subscription override' });
    }
});

/**
 * GET /payments - List payments for general ledger tracking (paginated)
 */
router.get('/payments', checkPermission('payments:read'), async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    try {
        const [payments, totalCount] = await prisma.$transaction([
            prisma.payment.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { name: true, email: true } }
                }
            }),
            prisma.payment.count()
        ]);

        res.json({
            success: true,
            payments,
            pagination: {
                total: totalCount,
                page,
                limit,
                pages: Math.ceil(totalCount / limit)
            }
        });
    } catch (error) {
        console.error('Fetch payments error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch payments' });
    }
});

export default router;
