import prisma from '../config/db.prisma.js';

/**
 * Write a record to the AdminAuditLog table in PostgreSQL
 * @param {string} actorId - ID of the admin user making the mutation
 * @param {string} action - Action descriptor (e.g., 'users:update', 'subscriptions:override')
 * @param {string} targetType - Target resource type (e.g., 'User', 'Subscription', 'Course')
 * @param {string} targetId - ID of the target resource
 * @param {object} details - Optional JSONB payload describing mutations or context metadata
 */
export async function logAudit(actorId, action, targetType, targetId, details = {}) {
    try {
        await prisma.adminAuditLog.create({
            data: {
                actorId,
                action,
                targetType,
                targetId,
                details: details || {}
            }
        });
    } catch (error) {
        // Fallback to warning log if database write fails to prevent operational blockade
        console.error(`🚨 Failed to write admin audit log [${action} on ${targetType}:${targetId}]:`, error.message);
    }
}
