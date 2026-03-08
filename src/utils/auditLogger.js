const AuditLog = require('../models/AuditLog');

/**
 * Log an administrative action to the AuditLog collection.
 * @param {Object} req - Express request object (used to extract user info)
 * @param {String} action - 'CREATE', 'UPDATE', or 'DELETE'
 * @param {String} resource - 'Challenge', 'Drive', 'Interview', etc.
 * @param {String} resourceId - Unique ID of the affected resource
 * @param {String} details - Human-readable description of the change
 */
exports.logAction = async (req, action, resource, resourceId, details) => {
    try {
        if (!req.user) return; // Only log authenticated actions

        // Extract actor details from req.user
        const actorId = req.user._id || req.user.id;
        const actorName = req.user.fullName || req.user.username || 'Unknown Actor';
        const actorRole = req.user.role;

        // Ensure we only log actions from non-STUDENT roles
        if (['ADMIN', 'STAFF', 'COMPANY'].includes(actorRole)) {
            await AuditLog.create({
                actorId,
                actorName,
                actorRole,
                action,
                resource,
                resourceId,
                details
            });
        }
    } catch (err) {
        console.error('Audit Logging failed:', err.message);
    }
};
