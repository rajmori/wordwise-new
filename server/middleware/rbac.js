import prisma from '../config/db.prisma.js';

/**
 * Enforce RBAC permissions on routes using PostgreSQL mapping
 * @param {string} requiredPermission - Permission string (e.g. 'users:create')
 */
export const checkPermission = (requiredPermission) => {
    return async (req, res, next) => {
        try {
            // Assumes req.user is set by auth middleware (which decodes JWT)
            if (!req.user || !req.user.id) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required. No user context found.'
                });
            }

            const userId = req.user.id;

            // Fetch user roles and their associated permissions
            const userRoles = await prisma.userRole.findMany({
                where: { userId },
                include: {
                    role: {
                        include: {
                            permissions: {
                                include: {
                                    permission: true
                                }
                            }
                        }
                    }
                }
            });

            // super_admin gets automatic bypass for all checks
            const isSuperAdmin = userRoles.some(ur => ur.role.name === 'super_admin');
            if (isSuperAdmin) {
                return next();
            }

            // Extract all permissions mapped to the user's roles
            const permissions = userRoles.flatMap(ur => 
                ur.role.permissions.map(rp => rp.permission.name)
            );

            if (permissions.includes(requiredPermission)) {
                return next();
            }

            return res.status(403).json({
                success: false,
                message: `Access denied. Insufficient permissions: [${requiredPermission}] is required.`
            });
        } catch (error) {
            console.error('RBAC Middleware Error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal authorization validation error.'
            });
        }
    };
};

/**
 * Helper to check if user has any of the allowed roles directly
 * @param {string[]} allowedRoles - Array of roles
 */
export const requireAnyRole = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.user.id) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const userRoles = await prisma.userRole.findMany({
                where: { userId: req.user.id },
                include: { role: true }
            });

            const roles = userRoles.map(ur => ur.role.name);
            
            // super_admin always allowed
            if (roles.includes('super_admin') || roles.some(r => allowedRoles.includes(r))) {
                return next();
            }

            return res.status(403).json({
                success: false,
                message: 'Access denied. Unauthorized role.'
            });
        } catch (error) {
            console.error('RBAC Role Check Error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal authorization validation error.'
            });
        }
    };
};
