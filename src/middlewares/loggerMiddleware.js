const Log = require('../models/Log');

const queue = [];
const MAX_BATCH_SIZE = 25;
const MAX_QUEUE_SIZE = 5000;
const FLUSH_INTERVAL_MS = 1000;
const READ_SAMPLE_RATE = Number(process.env.LOG_READ_SAMPLE_RATE || (process.env.NODE_ENV === 'production' ? '0.002' : '0'));
const SKIP_ROUTES = new Set(['/api', '/api/healthz']);
let flushPromise = null;

function shouldLogRequest(req, res) {
    if (SKIP_ROUTES.has(req.path)) {
        return false;
    }

    if (res.statusCode >= 500) {
        return true;
    }

    if (req.method !== 'GET') {
        return true;
    }

    return Math.random() < READ_SAMPLE_RATE;
}

async function flushLogs() {
    if (flushPromise || queue.length === 0) {
        return flushPromise;
    }

    const batch = queue.splice(0, MAX_BATCH_SIZE);
    flushPromise = Log.batchPut(batch)
        .catch((error) => {
            console.error('Logging failed:', error.message);
        })
        .finally(() => {
            flushPromise = null;
            if (queue.length > 0) {
                setImmediate(() => {
                    flushLogs().catch(() => {});
                });
            }
        });

    return flushPromise;
}

setInterval(() => {
    flushLogs().catch(() => {});
}, FLUSH_INTERVAL_MS).unref();

const loggerMiddleware = (req, res, next) => {
    const startTime = Date.now();

    res.on('finish', () => {
        if (!shouldLogRequest(req, res)) {
            return;
        }

        if (queue.length >= MAX_QUEUE_SIZE) {
            queue.shift();
        }

        queue.push({
            userId: req.user ? req.user._id || req.user.id : 'ANONYMOUS',
            action: `${req.method} ${req.originalUrl}`,
            route: req.route ? String(req.route.path) : req.originalUrl,
            method: req.method,
            ipAddress: req.ip,
            statusCode: res.statusCode,
            metadata: {
                userAgent: req.get('user-agent'),
                duration: `${Date.now() - startTime}ms`,
            },
        });

        if (queue.length >= MAX_BATCH_SIZE) {
            setImmediate(() => {
                flushLogs().catch(() => {});
            });
        }
    });

    next();
};

module.exports = loggerMiddleware;

