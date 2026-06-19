const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { storage: cloudinaryStorage } = require('../config/cloudinaryConfig');
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

const useAzure = !!process.env.AZURE_STORAGE_CONNECTION_STRING;

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const activeStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const safeExt = path.extname(file.originalname).toLowerCase();
        cb(null, 'attachment-' + uniqueSuffix + safeExt);
    }
});

const upload = multer({
    storage: activeStorage,
    fileFilter: fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

exports.uploadFile = upload.single('file');

exports.uploadHandler = catchAsync(async (req, res, next) => {
    if (!req.file) {
        return next(new AppError('No file uploaded', 400));
    }

    console.log(`✅ Upload: ${sanitizeFilename(req.file.originalname)} (${req.file.mimetype}, ${req.file.size || 'N/A'} bytes)`);

    let fileUrl = `/uploads/${req.file.filename}`;

    if (useAzure) {
        const { containerClient } = require('../config/azureConfig');
        
        if (containerClient) {
            try {
                console.log(`☁️ Uploading to Azure Blob Storage...`);
                
                // Ensure container exists
                await containerClient.createIfNotExists({ access: 'blob' });

                const ext = path.extname(req.file.originalname).toLowerCase();
                const blobName = `file_${Date.now()}_${Math.round(Math.random() * 1E9)}${ext}`;
                const blockBlobClient = containerClient.getBlockBlobClient(blobName);

                await blockBlobClient.uploadFile(req.file.path, {
                    blobHTTPHeaders: { blobContentType: req.file.mimetype }
                });

                fileUrl = blockBlobClient.url;
                
                // Delete local temp file
                if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            } catch (error) {
                console.error('Azure upload error:', error);
                if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
                return next(new AppError('Failed to upload file to cloud storage', 500));
            }
        } else {
             console.error('⚠️ Azure is enabled but containerClient failed to initialize.');
        }
    }

    res.status(200).json({
        status: 'success',
        data: {
            url: fileUrl,
            filename: sanitizeFilename(req.file.originalname),
            fileType: req.file.mimetype
        }
    });
});


