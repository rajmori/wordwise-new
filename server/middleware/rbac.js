// Role → permission map. Replaces Prisma-based RBAC (no PostgreSQL configured).
const ROLE_PERMISSIONS = {
    super_admin: '*',
    admin: [
        'users:read', 'users:write',
        'courses:read', 'courses:write', 'courses:publish',
        'quizzes:read', 'quizzes:write', 'quizzes:publish',
        'subscriptions:read', 'subscriptions:override',
        'payments:read',
        'audit:read',
        'settings:read'
    ]
};

const hasPermission = (role, permission) => {
    const perms = ROLE_PERMISSIONS[role];
    if (!perms) return false;
    if (perms === '*') return true;
    return perms.includes(permission);
};

/**
 * Enforce a single permission. Requires auth middleware to have set req.user first.
 */
export const checkPermission = (requiredPermission) => {
    return (req, res, next) => {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }

        const roles = req.user.roles || (req.user.role ? [req.user.role] : []);

        if (roles.some(r => hasPermission(r, requiredPermission))) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: `Access denied. [${requiredPermission}] permission required.`
        });
    };
};

/**
 * Allow through if the user holds any of the listed roles.
 */
export const requireAnyRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }

        const roles = req.user.roles || (req.user.role ? [req.user.role] : []);

        if (roles.includes('super_admin') || roles.some(r => allowedRoles.includes(r))) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: 'Access denied. Unauthorized role.'
        });
    };
};
