const express = require('express');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

let server;

function writeCrashLog(prefix, error, onComplete) {
    const log = `${new Date().toISOString()} - ${prefix}: ${error.name} - ${error.message}\n${error.stack || ''}\n\n`;
    fs.appendFile('crash.log', log, (logError) => {
        if (logError) {
            console.error(`Failed to write crash log for ${prefix.toLowerCase()}:`, logError);
        }
        onComplete();
    });
}

process.on('uncaughtException', (error) => {
    console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.log(error.name, error.message);
    writeCrashLog('UNCAUGHT EXCEPTION', error, () => {
        process.exit(1);
    });
});

process.on('unhandledRejection', (error) => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(error.name, error.message);
    writeCrashLog('UNHANDLED REJECTION', error, () => {
        if (server && typeof server.close === 'function') {
            server.close(() => process.exit(1));
        } else {
            process.exit(1);
        }
    });
});

dotenv.config();

const validateEnv = require('./utils/validateEnv');
validateEnv();

if (process.env.FRONTEND_URL) {
    try {
        const parsedUrl = new URL(process.env.FRONTEND_URL);
        process.env.FRONTEND_URL = parsedUrl.origin;
    } catch {
        process.env.FRONTEND_URL = process.env.FRONTEND_URL.replace(/\/$/, '');
    }
}

require('./config/dynamodb');

const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const hpp = require('hpp');

const { globalLimiter, authLimiter, uploadLimiter } = require('./middlewares/rateLimiter');
const sanitize = require('./middlewares/sanitize');
const { setCSRFToken, validateCSRF } = require('./middlewares/csrfProtection');

const AppError = require('./utils/AppError');
const globalErrorHandler = require('./middlewares/errorMiddleware');
const loggerMiddleware = require('./middlewares/loggerMiddleware');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const studentRoutes = require('./routes/studentRoutes');
const companyRoutes = require('./routes/companyRoutes');
const placementRoutes = require('./routes/placementRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const messageRoutes = require('./routes/messageRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const placementDriveRoutes = require('./routes/placementDriveRoutes');
const offerLetterRoutes = require('./routes/offerLetterRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const challengeRoutes = require('./routes/challengeRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

app.get('/api/healthz', (req, res) => {
    res.status(200).json({ status: 'success', uptime: process.uptime() });
});

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
            connectSrc: ["'self'", process.env.FRONTEND_URL, 'https://*.amazonaws.com'],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
        },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
}));

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    exposedHeaders: ['X-CSRF-Token'],
}));

app.use('/api', globalLimiter);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(sanitize);
app.use(hpp());
app.use(setCSRFToken);
app.use('/api', validateCSRF);

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}
app.use(loggerMiddleware);

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/placement', placementRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/upload', uploadLimiter, uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/drives', placementDriveRoutes);
app.use('/api/offers', offerLetterRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api', (req, res) => {
    res.status(200).json({ status: 'success', message: 'HireHub API is running smoothly' });
});

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use((req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

if (!process.env.LAMBDA_TASK_ROOT) {
    const PORT = process.env.PORT || 5000;
    server = app.listen(PORT, () => {
        console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
        console.log('🔒 Security: Helmet, Rate Limiting, Sanitization, HPP — ACTIVE');
    });

    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;
    server.requestTimeout = 15000;
}

module.exports = app;
