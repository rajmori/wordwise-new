import express from 'express';
import prisma from '../../../../config/db.prisma.js';
import { checkPermission } from '../../../../middleware/rbac.js';
import { logAudit } from '../../../../utils/audit.js';

const router = express.Router();

/**
 * GET / - Get paginated users list with search & filter parameters
 */
router.get('/', checkPermission('users:read'), async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status; // 'active', 'inactive'
    const plan = req.query.plan; // e.g. 'Annual Plan'

    const skip = (page - 1) * limit;

    try {
        const whereClause = {
            AND: [
                search ? {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { email: { contains: search, mode: 'insensitive' } }
                    ]
                } : {},
                status ? { isActive: status === 'active' } : {},
                plan ? {
                    subscriptions: {
                        some: {
                            plan: { name: { contains: plan, mode: 'insensitive' } },
                            status: 'active'
                        }
                    }
                } : {}
            ]
        };

        const [users, totalCount] = await prisma.$transaction([
            prisma.user.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    userRoles: {
                        include: { role: true }
                    },
                    subscriptions: {
                        where: { status: 'active' },
                        include: { plan: true }
                    }
                }
            }),
            prisma.user.count({ where: whereClause })
        ]);

        res.json({
            success: true,
            users: users.map(user => {
                const activeSub = user.subscriptions[0] || null;
                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    isActive: user.isActive,
                    lastLogin: user.lastLogin,
                    roles: user.userRoles.map(ur => ur.role.name),
                    subscriptionPlan: activeSub ? activeSub.plan.name : 'None',
                    subscriptionEndDate: activeSub ? activeSub.currentPeriodEnd : null,
                    createdAt: user.createdAt
                };
            }),
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
 * GET /:id - View user detail
 */
router.get('/:id', checkPermission('users:read'), async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            include: {
                userRoles: {
                    include: { role: true }
                },
                subscriptions: {
                    include: { plan: true }
                },
                loginLogs: {
                    take: 10,
                    orderBy: { timestamp: 'desc' }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                isActive: user.isActive,
                lastLogin: user.lastLogin,
                roles: user.userRoles.map(ur => ur.role.name),
                subscriptions: user.subscriptions,
                loginLogs: user.loginLogs,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Fetch user detail error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * PUT /:id - Update user basic profile & status
 */
router.put('/:id', checkPermission('users:write'), async (req, res) => {
    const { name, email, isActive } = req.body;
    
    try {
        const existingUser = await prisma.user.findUnique({
            where: { id: req.params.id }
        });

        if (!existingUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const updatedUser = await prisma.user.update({
            where: { id: req.params.id },
            data: {
                name: name || undefined,
                email: email ? email.toLowerCase() : undefined,
                isActive: typeof isActive === 'boolean' ? isActive : undefined
            }
        });

        // Audit log records details of the mutation
        await logAudit(
            req.user.id, 
            'users:update', 
            'User', 
            updatedUser.id, 
            { 
                correlationId: req.correlationId,
                old: { name: existingUser.name, email: existingUser.email, isActive: existingUser.isActive },
                new: { name: updatedUser.name, email: updatedUser.email, isActive: updatedUser.isActive }
            }
        );

        res.json({
            success: true,
            message: 'User account details updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ success: false, message: 'Failed to update user' });
    }
});

/**
 * POST /:id/roles - Assign a role to user
 */
router.post('/:id/roles', checkPermission('users:write'), async (req, res) => {
    const { roleId } = req.body;

    try {
        const role = await prisma.role.findUnique({ where: { id: roleId } });
        if (!role) {
            return res.status(400).json({ success: false, message: 'Role not found' });
        }

        const userRole = await prisma.userRole.create({
            data: {
                userId: req.params.id,
                roleId: roleId,
                assignedBy: req.user.id
            }
        });

        await logAudit(
            req.user.id,
            'users:role_assign',
            'User',
            req.params.id,
            { correlationId: req.correlationId, roleId, roleName: role.name }
        );

        res.json({ success: true, message: 'Role assigned successfully', userRole });
    } catch (error) {
        console.error('Role assignment error:', error);
        res.status(500).json({ success: false, message: 'Failed to assign role' });
    }
});

/**
 * DELETE /:id/roles/:roleId - Remove role from user
 */
router.delete('/:id/roles/:roleId', checkPermission('users:write'), async (req, res) => {
    try {
        const userRole = await prisma.userRole.delete({
            where: {
                userId_roleId: {
                    userId: req.params.id,
                    roleId: req.params.roleId
                }
            },
            include: { role: true }
        });

        await logAudit(
            req.user.id,
            'users:role_remove',
            'User',
            req.params.id,
            { correlationId: req.correlationId, roleId: req.params.roleId, roleName: userRole.role.name }
        );

        res.json({ success: true, message: 'Role removed successfully' });
    } catch (error) {
        console.error('Role removal error:', error);
        res.status(500).json({ success: false, message: 'Failed to remove role' });
    }
});

export default router;
