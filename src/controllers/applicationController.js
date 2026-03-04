const DriveApplication = require('../models/DriveApplication');
const PlacementDrive = require('../models/PlacementDrive');
const Student = require('../models/Student');
const Company = require('../models/Company');
const Round = require('../models/Round');
const StudentPlacementStatus = require('../models/StudentPlacementStatus');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// Apply to a drive (Student)
exports.applyToDrive = catchAsync(async (req, res, next) => {
    const { driveId } = req.body;
    if (!driveId) return next(new AppError('Drive ID is required', 400));

    // Get student profile
    const student = await Student.findByUserId(req.user._id);
    if (!student) return next(new AppError('Student profile not found. Please complete your profile first.', 400));

    // Get drive
    const drive = await PlacementDrive.findById(driveId);
    if (!drive) return next(new AppError('Placement drive not found', 404));

    // Check minCGPA
    if ((student.cgpa || 0) < drive.minCgpa) {
        return next(new AppError(`Your CGPA (${student.cgpa}) is below the required minimum (${drive.minCgpa}) for this drive.`, 403));
    }

    // Check eligible departments
    if (drive.eligibleDepartments && drive.eligibleDepartments.length > 0) {
        if (!drive.eligibleDepartments.includes(student.department)) {
            return next(new AppError(`Your department (${student.department}) is not eligible for this drive.`, 403));
        }
    }

    // Check if already applied
    const existing = await DriveApplication.findOne({ studentId: student.id, driveId });
    if (existing) {
        if (existing.status === 'WITHDRAWN') {
            // Re-apply
            await DriveApplication.update({ id: existing.id }, { status: 'APPLIED' });
            return res.status(200).json({ status: 'success', message: 'Application re-submitted successfully' });
        }
        return next(new AppError('You have already applied to this drive', 400));
    }

    // Create application
    const application = await DriveApplication.create({
        studentId: student.id,
        driveId,
        companyId: drive.companyId,
        status: 'APPLIED'
    });

    const obj = typeof application.toJSON === 'function' ? application.toJSON() : { ...application };
    obj._id = obj.id;

    res.status(201).json({ status: 'success', data: { application: obj } });
});

// Get my applications (Student)
exports.getMyApplications = catchAsync(async (req, res, next) => {
    const student = await Student.findByUserId(req.user._id);
    if (!student) return next(new AppError('Student profile not found', 404));

    const applications = await DriveApplication.findByStudentId(student.id);

    // Populate drive details manually
    const result = [];
    for (const app of applications) {
        const obj = typeof app.toJSON === 'function' ? app.toJSON() : { ...app };
        obj._id = obj.id;

        try {
            const drive = await PlacementDrive.findById(obj.driveId);
            if (drive) {
                obj.drive = typeof drive.toJSON === 'function' ? drive.toJSON() : { ...drive };
                obj.drive._id = obj.drive.id;
            }
        } catch { } // ignore if drive deleted

        result.push(obj);
    }

    res.status(200).json({ status: 'success', data: { applications: result } });
});

// Withdraw application (Student)
exports.withdrawApplication = catchAsync(async (req, res, next) => {
    const application = await DriveApplication.findById(req.params.id);
    if (!application) return next(new AppError('Application not found', 404));

    const student = await Student.findByUserId(req.user._id);
    if (!student || application.studentId !== student.id) {
        return next(new AppError('Not authorized to withdraw this application', 403));
    }

    await DriveApplication.update({ id: application.id }, { status: 'WITHDRAWN' });

    res.status(200).json({ status: 'success', message: 'Application withdrawn successfully' });
});

// Get applicants for a drive (Admin/Staff/Company)
exports.getDriveApplicants = catchAsync(async (req, res, next) => {
    const { driveId } = req.params;

    const drive = await PlacementDrive.findById(driveId);
    if (!drive) return next(new AppError('Drive not found', 404));

    if (req.user.role === 'COMPANY' && drive.companyId !== req.user.companyId) {
        return next(new AppError('Not authorized to view these applicants', 403));
    }

    const applications = await DriveApplication.findByDriveId(driveId);

    // Populate student details
    const result = [];
    for (const app of applications) {
        // Skip withdrawn usually, or include and let frontend filter
        const obj = typeof app.toJSON === 'function' ? app.toJSON() : { ...app };
        obj._id = obj.id;

        try {
            const student = await Student.findById(obj.studentId);
            if (student) {
                obj.student = {
                    _id: student.id,
                    name: student.name,
                    email: student.email,
                    department: student.department,
                    cgpa: student.cgpa
                };
            }
        } catch { }

        result.push(obj);
    }

    res.status(200).json({ status: 'success', data: { applications: result } });
});

// Update application status (Admin/Staff/Company)
exports.updateApplicationStatus = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body; // 'SHORTLISTED', 'REJECTED'

    if (!['SHORTLISTED', 'REJECTED'].includes(status)) {
        return next(new AppError('Invalid status. Must be SHORTLISTED or REJECTED', 400));
    }

    const application = await DriveApplication.findById(id);
    if (!application) return next(new AppError('Application not found', 404));

    if (req.user.role === 'COMPANY' && application.companyId !== req.user.companyId) {
        return next(new AppError('Not authorized to update this application', 403));
    }

    await DriveApplication.update({ id: application.id }, { status });

    // If shortlisted, automatically add them to the first round of the company's hiring process (StudentPlacementStatus)
    if (status === 'SHORTLISTED') {
        const rounds = await Round.findByCompanyId(application.companyId);
        if (rounds && rounds.length > 0) {
            const firstRound = rounds[0];

            // Check if they are already in the placement pipeline
            const existingPlacement = await StudentPlacementStatus.findOne({
                studentId: application.studentId,
                companyId: application.companyId
            });

            if (!existingPlacement) {
                await StudentPlacementStatus.create({
                    studentId: application.studentId,
                    companyId: application.companyId,
                    roundId: firstRound.id,
                    status: 'PENDING'
                });
            } else if (existingPlacement.status === 'PENDING_APPROVAL') {
                await StudentPlacementStatus.update({ id: existingPlacement.id }, { status: 'PENDING' });
            }
        }
    }

    res.status(200).json({ status: 'success', message: `Application marked as ${status}` });
});
