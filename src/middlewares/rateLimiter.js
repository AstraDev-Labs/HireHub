const rateLimit = require('express-rate-limit');

const LOCAL_IPS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

function shouldSkipRateLimit(req) {
    return process.env.SKIP_RATE_LIMIT_FOR_LOCALHOST === 'true' && LOCAL_IPS.has(req.ip);
}

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10000,
    skip: shouldSkipRateLimit,
    message: {
        status: 'fail',
        message: 'Too many requests from this IP. Please try again after 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    skip: shouldSkipRateLimit,
    message: {
        status: 'fail',
        message: 'Too many login attempts. Please try again after 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    skip: shouldSkipRateLimit,
    message: {
        status: 'fail',
        message: 'Too many uploads. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { globalLimiter, authLimiter, uploadLimiter };
