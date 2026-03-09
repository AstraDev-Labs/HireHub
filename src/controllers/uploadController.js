const multer = require('multer');
const path = require('path');
const fs = require('fs');
const multerS3 = require('multer-s3');
const s3 = require('../config/s3Config');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// Allowed MIME types and their expected extensions
const ALLOWED_TYPES = {
    'application/pdf': ['.pdf'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'text/plain': ['.txt'],
    'text/csv': ['.csv'],
    'video/mp4': ['.mp4'],
    'video/webm': ['.webm'],
};

// Sanitize filename: strip path traversal, special chars
function sanitizeFilename(originalName) {
    return originalName
        .replace(/[^a-zA-Z0-9._-]/g, '_')  // Replace special chars with underscore
        .replace(/\.{2,}/g, '.')             // Remove consecutive dots (path traversal)
        .replace(/^\.+/, '')                 // Remove leading dots
        .substring(0, 100);                  // Limit length
}

// File filter — validates MIME type and extension match
function fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;

    if (!ALLOWED_TYPES[mime]) {
        return cb(new AppError(`File type "${mime}" is not allowed. Allowed: PDF, images, documents, videos.`, 400), false);
    }

    if (!ALLOWED_TYPES[mime].includes(ext)) {
        return cb(new AppError(`File extension "${ext}" doesn't match its content type "${mime}". Possible tampered file.`, 400), false);
    }

    cb(null, true);
}

let storage;
const useS3 = process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_S3_BUCKET_NAME;

if (useS3) {
    console.log('📦 Using AWS S3 for file storage. Target Bucket:', process.env.AWS_S3_BUCKET_NAME);
    storage = multerS3({
        s3: s3,
        bucket: process.env.AWS_S3_BUCKET_NAME,
        acl: 'public-read',
        contentType: function (req, file, cb) {
            cb(null, file.mimetype);
        },
        contentDisposition: 'inline',
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const safeExt = path.extname(file.originalname).toLowerCase();
            cb(null, 'attachments/' + uniqueSuffix + safeExt);
        }
    });
} else {
    console.log('📁 Using Local Disk Storage for file storage');
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, uploadsDir);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const safeExt = path.extname(file.originalname).toLowerCase();
            cb(null, 'attachment-' + uniqueSuffix + safeExt);
        }
    });
}

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

exports.uploadFile = upload.single('file');

exports.uploadHandler = catchAsync(async (req, res, next) => {
    if (!req.file) {
        return next(new AppError('No file uploaded', 400));
    }

    console.log(`✅ Upload: ${sanitizeFilename(req.file.originalname)} (${req.file.mimetype}, ${req.file.size} bytes)`);

    const fileUrl = req.file.location || `/uploads/${req.file.filename}`;

    res.status(200).json({
        status: 'success',
        data: {
            url: fileUrl,
            filename: sanitizeFilename(req.file.originalname),
            fileType: req.file.mimetype
        }
    });
});

