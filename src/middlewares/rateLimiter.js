const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const { redisClient } = require('../utils/asyncCache');

const LOCAL_IPS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

function shouldSkipRateLimit(req) {
    if (process.env.NODE_ENV === 'test') return true;
    return process.env.SKIP_RATE_LIMIT_FOR_LOCALHOST === 'true' && LOCAL_IPS.has(req.ip);
}

const getStore = (prefix) => {
    if (process.env.NODE_ENV === 'test') return undefined;
    return new RedisStore({ sendCommand: (...args) => redisClient.sendCommand(args), prefix });
};

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10000,
    skip: shouldSkipRateLimit,
    message: { status: 'fail', message: 'Too many requests from this IP. Please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
    store: getStore('rl:global:')
});

const accountCreationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Max 10 accounts per hour per IP
    skip: shouldSkipRateLimit,
    message: { status: 'fail', message: 'Too many accounts created from this IP. Please try again after an hour.' },
    standardHeaders: true,
    legacyHeaders: false,
    store: getStore('rl:acc:')
});

const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 mins
    max: 15, // Max 15 OTP requests per IP per 15 min
    skip: shouldSkipRateLimit,
    message: { status: 'fail', message: 'Too many OTP requests from this IP. Please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
    store: getStore('rl:otp:')
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    skip: shouldSkipRateLimit,
    message: { status: 'fail', message: 'Too many login attempts. Please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
    store: getStore('rl:auth:')
});

const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    skip: shouldSkipRateLimit,
    message: { status: 'fail', message: 'Too many uploads. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    store: getStore('rl:upload:')
});

module.exports = { globalLimiter, authLimiter, uploadLimiter, accountCreationLimiter, otpLimiter };
