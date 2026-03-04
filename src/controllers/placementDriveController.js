const PlacementDrive = require('../models/PlacementDrive');
const Company = require('../models/Company');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// Get all drives (sorted by date)
exports.getAllDrives = catchAsync(async (req, res) => {
    const drives = await PlacementDrive.findAll();
    const sorted = drives.sort((a, b) => new Date(a.date) - new Date(b.date));

    const result = sorted.map(d => {
        const obj = typeof d.toJSON === 'function' ? d.toJSON() : { ...d };
        obj._id = obj.id;
        return obj;
    });

    res.status(200).json({ status: 'success', data: { drives: result } });
});

// Create drive (Admin/Staff/Company)
exports.createDrive = catchAsync(async (req, res, next) => {
    let { companyId, title, description, date, time, venue, driveType, eligibleDepartments, minCgpa } = req.body;

    if (req.user.role === 'COMPANY') {
        companyId = req.user.companyId;
    }

    if (!companyId || !title || !date) {
        return next(new AppError('Company, title, and date are required', 400));
    }

    const company = await Company.findById(companyId);
    if (!company) return next(new AppError('Company not found', 404));

    const drive = await PlacementDrive.create({
        companyId,
        companyName: company.name,
        title,
        description,
        date,
        time,
        venue,
        driveType: driveType || 'ON_CAMPUS',
        eligibleDepartments: eligibleDepartments || [],
        minCgpa: minCgpa || 0,
        createdBy: req.user._id
    });

    // Notify all students about the new drive
    const User = require('../models/User');
    const Notification = require('../models/Notification');
    const students = await User.scan('role').eq('STUDENT').exec();
    if (students && students.length > 0) {
        const notifications = students.map(student => ({
            userId: student.id,
            type: 'ROUND_ANNOUNCEMENT',
            title: 'New Placement Drive Scheduled',
            message: `${company.name} has scheduled a new placement drive: ${title} on ${new Date(date).toLocaleDateString()}.`,
            link: '/calendar'
        }));
        await Notification.createBulk(notifications);
    }

    const obj = typeof drive.toJSON === 'function' ? drive.toJSON() : { ...drive };
    obj._id = obj.id;

    res.status(201).json({ status: 'success', data: { drive: obj } });
});

// Update drive
exports.updateDrive = catchAsync(async (req, res, next) => {
    const drive = await PlacementDrive.findById(req.params.id);
    if (!drive) return next(new AppError('Drive not found', 404));

    if (req.user.role === 'COMPANY' && drive.companyId !== req.user.companyId) {
        return next(new AppError('Not authorized to update this drive', 403));
    }

    const allowed = ['title', 'description', 'date', 'time', 'venue', 'driveType', 'eligibleDepartments', 'minCgpa', 'status'];
    const updates = {};
    for (const key of allowed) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    await PlacementDrive.update({ id: drive.id }, updates);
    const updated = await PlacementDrive.findById(drive.id);
    const obj = typeof updated.toJSON === 'function' ? updated.toJSON() : { ...updated };
    obj._id = obj.id;

    res.status(200).json({ status: 'success', data: { drive: obj } });
});

// Delete drive
exports.deleteDrive = catchAsync(async (req, res, next) => {
    const drive = await PlacementDrive.findById(req.params.id);
    if (!drive) return next(new AppError('Drive not found', 404));

    if (req.user.role === 'COMPANY' && drive.companyId !== req.user.companyId) {
        return next(new AppError('Not authorized to delete this drive', 403));
    }

    await PlacementDrive.delete({ id: drive.id });
    res.status(200).json({ status: 'success', message: 'Drive deleted' });
});
