const Student = require('../models/Student');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.searchStudents = catchAsync(async (req, res, next) => {
    const { query } = req.query;
    if (!query) {
        return res.status(200).json({ status: 'success', results: 0, data: { students: [] } });
    }

    const students = await Student.searchByName(query);
    const result = students.map(s => {
        const obj = typeof s.toJSON === 'function' ? s.toJSON() : { ...s };
        obj._id = obj.id;
        return obj;
    });

    res.status(200).json({
        status: 'success',
        results: result.length,
        data: { students: result }
    });
});

exports.completeProfile = catchAsync(async (req, res, next) => {
    const student = await Student.findByUserId(req.user._id);

    if (!student) {
        return next(new AppError('Student profile not found', 404));
    }

    const updates = {};
    if (req.body.phone) updates.phone = req.body.phone;
    if (req.body.department) updates.department = req.body.department;
    if (req.body.batchYear) updates.batchYear = req.body.batchYear;
    if (req.body.cgpa) updates.cgpa = req.body.cgpa;

    await Student.update({ id: student.id }, updates);
    const updated = await Student.findById(student.id);
    const obj = typeof updated.toJSON === 'function' ? updated.toJSON() : { ...updated };
    obj._id = obj.id;

    res.status(200).json({
        status: 'success',
        data: { student: obj }
    });
});

exports.getMyProfile = catchAsync(async (req, res, next) => {
    let student = await Student.findByUserId(req.user._id);

    // If profile doesn't exist, create a skeleton one from User data
    // This prevents "Failed to load profile" errors for new students
    if (!student) {
        console.log(`Creating skeleton profile for student user: ${req.user._id}`);
        try {
            student = await Student.create({
                userId: req.user._id,
                name: req.user.fullName,
                email: req.user.email,
                phone: req.user.phoneNumber || '9999999999', // Placeholder if missing
                department: req.user.department || 'General',
                batchYear: parseInt(req.user.batchYear) || new Date().getFullYear(),
                cgpa: parseFloat(req.user.cgpa) || 0.0,
                skills: [],
                education: [],
                experience: [],
                projects: [],
                socialLinks: {}
            });
        } catch (err) {
            console.error("Failed to create skeleton profile:", err);
            return next(new AppError('Failed to initialize student profile', 500));
        }
    }

    const obj = typeof student.toJSON === 'function' ? student.toJSON() : { ...student };
    obj._id = obj.id;

    res.status(200).json({
        status: 'success',
        data: { student: obj }
    });
});

exports.createStudent = catchAsync(async (req, res, next) => {
    const existingStudent = await Student.findByUserId(req.user._id);
    if (existingStudent) {
        return next(new AppError('Student profile already exists for this user', 400));
    }

    req.body.userId = req.user._id;
    const student = await Student.create(req.body);
    const obj = typeof student.toJSON === 'function' ? student.toJSON() : { ...student };
    obj._id = obj.id;

    res.status(201).json({
        status: 'success',
        data: { student: obj }
    });
});

exports.getAllStudents = catchAsync(async (req, res, next) => {
    console.log("GET /students called by:", req.user.role, req.user._id);
    const students = await Student.findAll();

    // Parallel populate: fetch all user details at once
    const User = require('../models/User');
    const result = await Promise.all(students.map(async (s) => {
        const obj = typeof s.toJSON === 'function' ? s.toJSON() : { ...s };
        obj._id = obj.id;
        if (obj.userId) {
            const user = await User.findById(obj.userId);
            if (user) {
                obj.userId = { _id: user.id, fullName: user.fullName, email: user.email };
            }
        }
        return obj;
    }));

    res.status(200).json({
        status: 'success',
        results: result.length,
        data: { students: result }
    });
});

exports.getStudent = catchAsync(async (req, res, next) => {
    const student = await Student.findById(req.params.id);

    if (!student) {
        return next(new AppError('No student found with that ID', 404));
    }

    const User = require('../models/User');
    const obj = typeof student.toJSON === 'function' ? student.toJSON() : { ...student };
    obj._id = obj.id;
    if (obj.userId) {
        const user = await User.findById(obj.userId);
        if (user) {
            obj.userId = { _id: user.id, fullName: user.fullName, email: user.email };
        }
    }

    res.status(200).json({
        status: 'success',
        data: { student: obj }
    });
});

exports.updateStudent = catchAsync(async (req, res, next) => {
    const existing = await Student.findById(req.params.id);
    if (!existing) {
        return next(new AppError('No student found with that ID', 404));
    }

    // Students can only update their own record
    if (req.user.role === 'STUDENT' && existing.userId !== req.user._id) {
        return next(new AppError('You can only update your own profile', 403));
    }

    // Students can only update safe fields
    if (req.user.role === 'STUDENT') {
        const allowedFields = ['resumeLink', 'socialLinks', 'skills', 'education', 'experience', 'projects', 'bio', 'languages', 'certifications'];
        const filtered = {};
        Object.keys(req.body).forEach(key => {
            if (allowedFields.includes(key)) filtered[key] = req.body[key];
        });
        req.body = filtered;
    }

    await Student.update({ id: req.params.id }, req.body);
    const student = await Student.findById(req.params.id);
    const obj = typeof student.toJSON === 'function' ? student.toJSON() : { ...student };
    obj._id = obj.id;

    res.status(200).json({
        status: 'success',
        data: { student: obj }
    });
});

exports.deleteStudent = catchAsync(async (req, res, next) => {
    const student = await Student.findById(req.params.id);
    if (!student) {
        return next(new AppError('No student found with that ID', 404));
    }

    await Student.delete({ id: req.params.id });

    res.status(204).json({
        status: 'success',
        data: null
    });
});

exports.getMyStatus = catchAsync(async (req, res, next) => {
    const StudentPlacementStatus = require('../models/StudentPlacementStatus');
    const Company = require('../models/Company');
    const Round = require('../models/Round');

    const statuses = await StudentPlacementStatus.findByStudentId(req.user._id);

    // Parallel populate
    const result = await Promise.all(statuses.map(async (s) => {
        const obj = typeof s.toJSON === 'function' ? s.toJSON() : { ...s };
        obj._id = obj.id;

        const [company, round] = await Promise.all([
            obj.companyId ? Company.findById(obj.companyId) : Promise.resolve(null),
            obj.roundId ? Round.findById(obj.roundId) : Promise.resolve(null)
        ]);

        if (company) obj.companyId = { _id: company.id, name: company.name };
        if (round) obj.roundId = { _id: round.id, roundType: round.roundType, roundName: round.roundName };

        return obj;
    }));

    res.status(200).json({
        status: 'success',
        results: result.length,
        data: { statuses: result }
    });
});

exports.getMyChildStatus = catchAsync(async (req, res, next) => {
    const StudentPlacementStatus = require('../models/StudentPlacementStatus');
    const Company = require('../models/Company');
    const Round = require('../models/Round');

    if (req.user.role !== 'PARENT') {
        return next(new AppError('Only parents can access this route', 403));
    }

    if (!req.user.linkedStudentId) {
        return next(new AppError('No student linked to this parent account', 404));
    }

    const student = await Student.findById(req.user.linkedStudentId);
    if (!student) {
        return next(new AppError('Linked student profile not found', 404));
    }

    const statuses = await StudentPlacementStatus.findByStudentId(student.id);

    const result = await Promise.all(statuses.map(async (s) => {
        const obj = typeof s.toJSON === 'function' ? s.toJSON() : { ...s };
        obj._id = obj.id;

        const [company, round] = await Promise.all([
            obj.companyId ? Company.findById(obj.companyId) : Promise.resolve(null),
            obj.roundId ? Round.findById(obj.roundId) : Promise.resolve(null)
        ]);

        if (company) obj.companyId = { _id: company.id, name: company.name };
        if (round) obj.roundId = { _id: round.id, roundType: round.roundType, roundName: round.roundName };

        return obj;
    }));

    res.status(200).json({
        status: 'success',
        results: result.length,
        data: { statuses: result, studentName: student.name }
    });
});
