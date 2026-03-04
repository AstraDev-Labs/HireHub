const Log = require('../models/Log');

const loggerMiddleware = async (req, res, next) => {
    const startTime = Date.now();

    res.on('finish', async () => {
        try {
            await Log.create({
                userId: req.user ? req.user._id || req.user.id : 'ANONYMOUS',
                action: `${req.method} ${req.originalUrl}`,
                route: req.route ? req.route.path : req.originalUrl,
                method: req.method,
                ipAddress: req.ip,
                statusCode: res.statusCode,
                metadata: {
                    userAgent: req.get('user-agent'),
                    duration: `${Date.now() - startTime}ms`
                }
            });
        } catch (err) {
            console.error('Logging failed:', err.message);
        }
    });

    next();
};

module.exports = loggerMiddleware;
