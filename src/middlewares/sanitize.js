const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Configure DOMPurify to be strict
const PURIFY_CONFIG = {
    ALLOWED_TAGS: [], // Strip all HTML tags by default
    ALLOWED_ATTR: [],
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM_IMPORT: false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'base'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus']
};

// Recursively strip dangerous keys and sanitize string values
function sanitizeValue(val) {
    if (typeof val === 'string') {
        // Use DOMPurify for robust sanitization
        return DOMPurify.sanitize(val, PURIFY_CONFIG);
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

        // Whitelist fields that need to retain raw characters like < and >
        if (['code', 'stdin', 'testCases', 'codeSnippets', 'constraints'].includes(key)) {
            // Keep NoSQL key sanitization but skip the HTML entity escaping
            if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                clean[key] = sanitizeObject(obj[key]); // Still protect nested objects from NoSQL injections
            } else {
                clean[key] = obj[key];
            }
            continue;
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
