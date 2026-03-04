const express = require('express');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Validate environment variables at startup
const validateEnv = require('./utils/validateEnv');
validateEnv();

// Sanitize FRONTEND_URL (remove trailing slash) to prevent CORS issues
if (process.env.FRONTEND_URL) {
    process.env.FRONTEND_URL = process.env.FRONTEND_URL.replace(/\/$/, '');
}

// Initialize DynamoDB connection (replaces MongoDB)
require('./config/dynamodb');

const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const hpp = require('hpp');

// Security Middleware
const { globalLimiter, authLimiter, uploadLimiter } = require('./middlewares/rateLimiter');
const sanitize = require('./middlewares/sanitize');
const { setCSRFToken, validateCSRF } = require('./middlewares/csrfProtection');

// Error Handling
const AppError = require('./utils/AppError');
const globalErrorHandler = require('./middlewares/errorMiddleware');
const loggerMiddleware = require('./middlewares/loggerMiddleware');

// Route Imports
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

// Start Express App
const app = express();

// ══════════════════════════════════════════════════
// 1) SECURITY MIDDLEWARE
// ══════════════════════════════════════════════════

// Helmet — hardened security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: ["'self'", process.env.FRONTEND_URL, "https://*.amazonaws.com"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
        },
    },
    crossOriginEmbedderPolicy: false, // Allow S3 images
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
    },
}));

// CORS — strict origin control
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
}));

// Rate Limiting — global
app.use('/api', globalLimiter);

// Body parsing with size limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Input sanitization — XSS + injection prevention
app.use(sanitize);

// HTTP Parameter Pollution protection
app.use(hpp());

// CSRF Protection (Double Submit Cookie)
app.use(setCSRFToken);
app.use('/api', validateCSRF);

// Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}
app.use(loggerMiddleware);

// ══════════════════════════════════════════════════
// 2) ROUTES (with targeted rate limiters)
// ══════════════════════════════════════════════════
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

// Static folder for file uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Handle Unhandled Routes
app.use((req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(globalErrorHandler);

// ══════════════════════════════════════════════════
// 3) SERVER START
// ══════════════════════════════════════════════════
if (!process.env.LAMBDA_TASK_ROOT) {
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
        console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
        console.log(`🔒 Security: Helmet, Rate Limiting, Sanitization, HPP — ACTIVE`);
    });

    process.on('uncaughtException', err => {
        console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
        console.log(err.name, err.message);
        const log = `${new Date().toISOString()} - UNCAUGHT EXCEPTION: ${err.name} - ${err.message}\n${err.stack}\n\n`;
        fs.appendFileSync('crash.log', log);
        process.exit(1);
    });

    process.on('unhandledRejection', err => {
        console.log('UNHANDLED REJECTION! 💥 Shutting down...');
        console.log(err.name, err.message);
        const log = `${new Date().toISOString()} - UNHANDLED REJECTION: ${err.name} - ${err.message}\n${err.stack}\n\n`;
        fs.appendFileSync('crash.log', log);
        server.close(() => {
            process.exit(1);
        });
    });
}

module.exports = app;
