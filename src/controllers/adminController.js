const AuditLog = require('../models/AuditLog');
const catchAsync = require('../utils/catchAsync');

exports.getAuditLogs = catchAsync(async (req, res, next) => {
    // Only ADMINs should access all logs
    // Filter can include actorRole, action, resource
    const logs = await AuditLog.findAll(req.query);

    // Sort by timestamp descending (newest first)
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(200).json({
        status: 'success',
        results: logs.length,
        data: { logs }
    });
});
