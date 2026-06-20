import express from 'express';
import prisma from '../../../config/db.prisma.js';
import { checkPermission } from '../../../middleware/rbac.js';

const router = express.Router();

/**
 * GET / - Get paginated admin audit logs (mutation logs)
 */
router.get('/', checkPermission('audit:read'), async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const action = req.query.action;
    const targetType = req.query.targetType;

    const skip = (page - 1) * limit;

    try {
        const whereClause = {
            AND: [
                search ? {
                    actor: {
                        OR: [
                            { name: { contains: search, mode: 'insensitive' } },
                            { email: { contains: search, mode: 'insensitive' } }
                        ]
                    }
                } : {},
                action ? { action } : {},
                targetType ? { targetType } : {}
            ]
        };

        const [logs, totalCount] = await prisma.$transaction([
            prisma.adminAuditLog.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy: { timestamp: 'desc' },
                include: {
                    actor: { select: { name: true, email: true } }
                }
            }),
            prisma.adminAuditLog.count({ where: whereClause })
        ]);

        res.json({
            success: true,
            logs,
            pagination: {
                total: totalCount,
                page,
                limit,
                pages: Math.ceil(totalCount / limit)
            }
        });
    } catch (error) {
        console.error('Fetch audit logs error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
    }
});

/**
 * GET /logins - Get paginated system login histories (restricted to authorized admins)
 */
router.get('/logins', checkPermission('audit:read'), async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const skip = (page - 1) * limit;

    try {
        const whereClause = {
            AND: [
                search ? {
                    user: {
                        OR: [
                            { name: { contains: search, mode: 'insensitive' } },
                            { email: { contains: search, mode: 'insensitive' } }
                        ]
                    }
                } : {}
            ]
        };

        const [logins, totalCount] = await prisma.$transaction([
            prisma.loginLog.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy: { timestamp: 'desc' },
                include: {
                    user: { select: { name: true, email: true } }
                }
            }),
            prisma.loginLog.count({ where: whereClause })
        ]);

        res.json({
            success: true,
            logins,
            pagination: {
                total: totalCount,
                page,
                limit,
                pages: Math.ceil(totalCount / limit)
            }
        });
    } catch (error) {
        console.error('Fetch login logs error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch login logs' });
    }
});

export default router;
