const PrepResource = require('../models/PrepResource');
const Company = require('../models/Company');
const Round = require('../models/Round');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.uploadResource = catchAsync(async (req, res, next) => {
    if (req.user.role === 'COMPANY' && req.body.companyId !== req.user.companyId) {
        return next(new AppError('You can only upload resources for your own company.', 403));
    }

    req.body.uploadedBy = req.user._id;
    const resource = await PrepResource.create(req.body);
    const obj = typeof resource.toJSON === 'function' ? resource.toJSON() : { ...resource };
    obj._id = obj.id;

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
        obj._id = obj.id;
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

exports.deleteResource = catchAsync(async (req, res, next) => {
    const resource = await PrepResource.findById(req.params.id);
    if (!resource) return next(new AppError('No resource found with that ID', 404));

    if (req.user.role === 'COMPANY' && resource.companyId !== req.user.companyId) {
        return next(new AppError('You can only delete resources for your own company.', 403));
    }

    await PrepResource.delete(req.params.id);
    res.status(204).json({ status: 'success', data: null });
});
