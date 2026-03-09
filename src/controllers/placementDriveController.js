const PlacementDrive = require('../models/PlacementDrive');
const Company = require('../models/Company');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { logAction } = require('../utils/auditLogger');

// Get all drives (sorted by date)
exports.getAllDrives = catchAsync(async (req, res) => {
    const drives = await PlacementDrive.findAll();

    // Auto-delete expired drives
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const validDrives = [];
    for (const drive of drives) {
        if (new Date(drive.date) < today) {
            // Expired, delete it
            await PlacementDrive.delete({ id: drive.id });
        } else {
            validDrives.push(drive);
        }
    }

    const sorted = validDrives.sort((a, b) => new Date(a.date) - new Date(b.date));

    const result = sorted.map(d => {
        const obj = typeof d.toJSON === 'function' ? d.toJSON() : { ...d };
        obj._id = obj.id;
        return obj;
    });

    res.status(200).json({ status: 'success', data: { drives: result } });
});

// Get single drive
exports.getDrive = catchAsync(async (req, res, next) => {
    const drive = await PlacementDrive.findById(req.params.id);
    if (!drive) return next(new AppError('Drive not found', 404));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(drive.date) < today) {
        await PlacementDrive.delete({ id: drive.id });
        return next(new AppError('Drive has expired and has been deleted', 404));
    }

    const obj = typeof drive.toJSON === 'function' ? drive.toJSON() : { ...drive };
    obj._id = obj.id;

    res.status(200).json({ status: 'success', data: { drive: obj } });
});

// Create drive (Admin/Staff/Company)
exports.createDrive = catchAsync(async (req, res, next) => {
    let { companyId, title, description, date, time, venue, driveType, eligibleDepartments, minCgpa } = req.body;

    if (minCgpa !== undefined && (parseFloat(minCgpa) < 0 || parseFloat(minCgpa) > 10)) {
        return next(new AppError('Min CGPA must be between 0 and 10.', 400));
    }

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

    // Audit Logging
    await logAction(req, 'CREATE', 'Drive', drive.id, `Created placement drive: ${title} for ${company.name}`);

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

    if (updates.minCgpa !== undefined && (parseFloat(updates.minCgpa) < 0 || parseFloat(updates.minCgpa) > 10)) {
        return next(new AppError('Min CGPA must be between 0 and 10.', 400));
    }

    await PlacementDrive.update({ id: drive.id }, updates);
    const updated = await PlacementDrive.findById(drive.id);

    // Audit Logging
    await logAction(req, 'UPDATE', 'Drive', drive.id, `Updated placement drive: ${updated.title}`);

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

    // Audit Logging
    await logAction(req, 'DELETE', 'Drive', drive.id, `Deleted placement drive: ${drive.title}`);

    res.status(200).json({ status: 'success', message: 'Drive deleted' });
});

