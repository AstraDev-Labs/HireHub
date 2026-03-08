const rateLimit = require('express-rate-limit');

// Global API limiter: Adjusted for high throughput stress testing
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10000, // Raised from 100 to handle ab stress tests (5000+ requests)
    message: {
        status: 'fail',
        message: 'Too many requests from this IP. Please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Auth limiter: 50 login attempts per 15 minutes per IP
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: {
        status: 'fail',
        message: 'Too many login attempts. Please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Upload limiter: 20 uploads per 15 minutes per IP
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
        status: 'fail',
        message: 'Too many uploads. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { globalLimiter, authLimiter, uploadLimiter };
