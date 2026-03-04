/**
 * Input Sanitization Middleware
 * Prevents XSS and NoSQL-style injection attacks by recursively
 * cleaning request body, query params, and URL params.
 */

// Recursively strip dangerous keys and sanitize string values
function sanitizeValue(val) {
    if (typeof val === 'string') {
        // Strip HTML tags to prevent XSS
        return val
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/javascript:/gi, '')
            .replace(/on\w+=/gi, '');
    }
    if (Array.isArray(val)) {
        return val.map(sanitizeValue);
    }
    if (val !== null && typeof val === 'object') {
        return sanitizeObject(val);
    }
    return val;
}

function sanitizeObject(obj) {
    const clean = {};
    for (const key of Object.keys(obj)) {
        // Block keys starting with '$' (NoSQL injection operators like $gt, $ne, $regex)
        if (key.startsWith('$')) {
            continue; // silently drop dangerous keys
        }
        clean[key] = sanitizeValue(obj[key]);
    }
    return clean;
}

function sanitizeMiddleware(req, res, next) {
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
    }
    if (req.query && typeof req.query === 'object') {
        req.query = sanitizeObject(req.query);
    }
    if (req.params && typeof req.params === 'object') {
        req.params = sanitizeObject(req.params);
    }
    next();
}

module.exports = sanitizeMiddleware;
