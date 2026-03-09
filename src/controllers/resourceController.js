const PrepResource = require('../models/PrepResource');
const Company = require('../models/Company');
const Round = require('../models/Round');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const auditLogger = require('../utils/auditLogger');

exports.uploadResource = catchAsync(async (req, res, next) => {
    if (req.user.role === 'COMPANY' && req.body.companyId !== req.user.companyId) {
        return next(new AppError('You can only upload resources for your own company.', 403));
    }

    req.body.uploadedBy = req.user._id;
    const resource = await PrepResource.create(req.body);
    
    const obj = typeof resource.toJSON === 'function' ? resource.toJSON() : { ...resource };
    obj._id = resource.id || obj.id;

    // Log the audit action
    await auditLogger.logAction(req, 'CREATE', 'PrepResource', obj._id, `Uploaded resource: ${obj.title}`);

    res.status(201).json({ status: 'success', data: { resource: obj } });
});

exports.getResources = catchAsync(async (req, res, next) => {
    const filter = {};
    if (req.query.companyId) filter.companyId = req.query.companyId;
    if (req.query.roundId) filter.roundId = req.query.roundId;

    const resources = await PrepResource.findByFilter(filter);

    // Manual populate
    const result = [];
    for (const r of resources) {
        const obj = typeof r.toJSON === 'function' ? r.toJSON() : { ...r };
        obj._id = r.id || obj.id;
        
        if (obj.companyId && typeof obj.companyId === 'string') {
            const company = await Company.findById(obj.companyId);
            if (company) obj.companyId = { _id: company.id, name: company.name };
        }
        if (obj.roundId && typeof obj.roundId === 'string') {
            const round = await Round.findById(obj.roundId);
            if (round) obj.roundId = { _id: round.id, roundName: round.roundName };
        }
        result.push(obj);
    }

    res.status(200).json({ status: 'success', results: result.length, data: { resources: result } });
});

const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const s3 = require('../config/s3Config');

exports.deleteResource = catchAsync(async (req, res, next) => {
    const resource = await PrepResource.findById(req.params.id);
    if (!resource) return next(new AppError('No resource found with that ID', 404));

    if (req.user.role === 'COMPANY' && resource.companyId !== req.user.companyId) {
        return next(new AppError('You can only delete resources for your own company.', 403));
    }

    // Attempt to delete from S3 if it's an internal upload
    if (resource.driveLink) {
        try {
            const parsedUrl = new URL(resource.driveLink);
            // Harden S3 hostname check to prevent 'evil-domain.com.amazonaws.com' bypass
            const bucketName = process.env.AWS_S3_BUCKET_NAME;
            const isS3 = parsedUrl.hostname === 's3.amazonaws.com' || 
                         parsedUrl.hostname === `${bucketName}.s3.amazonaws.com` ||
                         /^s3\.[a-z0-9-]+\.amazonaws\.com$/.test(parsedUrl.hostname) ||
                         new RegExp(`^${bucketName}\\.s3\\.[a-z0-9-]+\\.amazonaws\\.com$`).test(parsedUrl.hostname);
            
            const isInternal = parsedUrl.pathname.includes('/attachments/');

            if (isS3 && isInternal) {
                const key = parsedUrl.pathname.substring(1); // Remove leading slash
                await s3.send(new DeleteObjectCommand({
                    Bucket: process.env.AWS_S3_BUCKET_NAME,
                    Key: key
                }));
                console.log(`🗑️ S3 Object Deleted: ${key}`);
            }
        } catch (err) {
            // If it's not a valid URL or S3 deletion fails, we log it and continue
            if (err.code !== 'ERR_INVALID_URL') {
                console.error('⚠️ S3 Cleanup Failed:', err.message);
            }
        }
    }

    // Log BEFORE deletion to ensure we have resource details
    await auditLogger.logAction(req, 'DELETE', 'PrepResource', req.params.id, `Deleted resource: ${resource.title}`);

    await PrepResource.delete(req.params.id);
    res.status(204).json({ status: 'success', data: null });
});
