/**
 * CSRF Protection Middleware
 * 
 * Since we moved JWT to HttpOnly cookies, we need CSRF protection
 * to prevent cross-site request forgery attacks.
 * 
 * Uses the Double Submit Cookie pattern:
 * - Server sets a random CSRF token in a readable cookie (not HttpOnly)
 * - Frontend reads it and sends it as a header on every mutating request
 * - Server validates they match
 */
const crypto = require('crypto');
const AppError = require('../utils/AppError');

// Generate or refresh CSRF token
function setCSRFToken(req, res, next) {
    // Only set if not already present
    if (!req.cookies.csrfToken) {
        const token = crypto.randomBytes(32).toString('hex');
        res.cookie('csrfToken', token, {
            httpOnly: false,     // Frontend must be able to read this
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Must be 'none' for cross-domain Vercel <-> Render

            maxAge: 24 * 60 * 60 * 1000, // 1 day
            path: '/',
        });
    }
    next();
}

// Validate CSRF token on state-changing requests
function validateCSRF(req, res, next) {
    // Skip safe methods (GET, HEAD, OPTIONS)
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    // Skip auth routes (login/register don't have cookies yet, refresh/logout are automatic)
    const skipPaths = ['/auth/login', '/auth/register', '/auth/refresh-token', '/auth/logout', '/auth/send-phone-otp', '/auth/verify-phone-otp'];
    if (skipPaths.some(p => req.path.startsWith(p) || req.originalUrl.includes(p))) {
        return next();
    }

    const cookieToken = req.cookies.csrfToken;
    const headerToken = req.headers['x-csrf-token'];

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        return next(new AppError('Invalid CSRF token. Please refresh and try again.', 403));
    }

    next();
}

module.exports = { setCSRFToken, validateCSRF };
