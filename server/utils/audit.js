/**
 * Log admin mutations to console.
 * Persisting to a database requires an AuditLog mongoose model — add one here when ready.
 */
export async function logAudit(actorId, action, targetType, targetId, details = {}) {
    console.log(JSON.stringify({
        audit: true,
        actorId,
        action,
        targetType,
        targetId,
        correlationId: details.correlationId || null,
        timestamp: new Date().toISOString()
    }));
}
