const Company = require('../models/Company');
const Round = require('../models/Round');
const User = require('../models/User');
const StudentPlacementStatus = require('../models/StudentPlacementStatus');
const Student = require('../models/Student');
const Message = require('../models/Message');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { getOrSetCached, clearCachedValue, clearCacheByPrefix } = require('../utils/asyncCache');

function invalidateCompanyCache(companyId) {
    clearCachedValue('companies:all');
    clearCacheByPrefix('dashboard:admin:stats');

    if (companyId) {
        clearCachedValue(`companies:${companyId}`);
        clearCachedValue(`companies:${companyId}:rounds`);
        clearCachedValue(`dashboard:company:${companyId}`);
    }
}

exports.createCompany = catchAsync(async (req, res, next) => {
    if (req.body.jobRoles && !Array.isArray(req.body.jobRoles)) {
        req.body.jobRoles = [req.body.jobRoles];
    }
    if (req.body.jobRole && !req.body.jobRoles) {
        req.body.jobRoles = [req.body.jobRole];
    }
    if (req.body.location && !Array.isArray(req.body.location)) {
        req.body.location = [req.body.location];
    }

    if (req.body.minCgpa !== undefined && (parseFloat(req.body.minCgpa) < 0 || parseFloat(req.body.minCgpa) > 10)) {
        return next(new AppError('Minimum CGPA must be between 0 and 10.', 400));
    }

    const newCompany = await Company.create(req.body);
    invalidateCompanyCache(newCompany.id);

    const obj = typeof newCompany.toJSON === 'function' ? newCompany.toJSON() : { ...newCompany };
    obj._id = obj.id;

    res.status(201).json({ status: 'success', data: { company: obj } });
});

exports.getAllCompanies = catchAsync(async (req, res) => {
    const result = await getOrSetCached('companies:all', 60000, async () => {
        const companies = await Company.findAll();
        return companies.map((company) => {
            const obj = typeof company.toJSON === 'function' ? company.toJSON() : { ...company };
            obj._id = obj.id;
            return obj;
        });
    });

    res.set('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=120');
    res.status(200).json({ status: 'success', results: result.length, data: { companies: result } });
});

exports.updateCompany = catchAsync(async (req, res, next) => {
    if (req.body.jobRole && !req.body.jobRoles) req.body.jobRoles = [req.body.jobRole];
    if (req.body.location && !Array.isArray(req.body.location)) req.body.location = [req.body.location];

    if (req.body.minCgpa !== undefined && (parseFloat(req.body.minCgpa) < 0 || parseFloat(req.body.minCgpa) > 10)) {
        return next(new AppError('Minimum CGPA must be between 0 and 10.', 400));
    }

    const existing = await Company.findById(req.params.id);
    if (!existing) return next(new AppError('No company found with that ID', 404));

    await Company.update({ id: req.params.id }, req.body);
    invalidateCompanyCache(req.params.id);

    const company = await Company.findById(req.params.id);
    const obj = typeof company.toJSON === 'function' ? company.toJSON() : { ...company };
    obj._id = obj.id;

    res.status(200).json({ status: 'success', data: { company: obj } });
});

exports.getCompany = catchAsync(async (req, res, next) => {
    const company = await getOrSetCached(`companies:${req.params.id}`, 60000, async () => Company.findById(req.params.id));
    if (!company) return next(new AppError('No company found with that ID', 404));

    const obj = typeof company.toJSON === 'function' ? company.toJSON() : { ...company };
    obj._id = obj.id;

    res.set('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=120');
    res.status(200).json({ status: 'success', data: { company: obj } });
});

exports.getMyCompany = catchAsync(async (req, res, next) => {
    if (!req.user.companyId) return next(new AppError('You are not linked to any company.', 400));

    const company = await getOrSetCached(`companies:${req.user.companyId}`, 30000, async () => Company.findById(req.user.companyId));
    const obj = typeof company.toJSON === 'function' ? company.toJSON() : { ...company };
    obj._id = obj.id;

    res.status(200).json({ status: 'success', data: { company: obj } });
});

exports.updateCompanyProfile = catchAsync(async (req, res, next) => {
    if (!req.user.companyId) return next(new AppError('You are not linked to any company.', 400));
    if (req.body.location && !Array.isArray(req.body.location)) req.body.location = [req.body.location];

    if (req.body.minCgpa !== undefined && (parseFloat(req.body.minCgpa) < 0 || parseFloat(req.body.minCgpa) > 10)) {
        return next(new AppError('Minimum CGPA must be between 0 and 10.', 400));
    }

    await Company.update({ id: req.user.companyId }, req.body);
    invalidateCompanyCache(req.user.companyId);

    const updatedCompany = await Company.findById(req.user.companyId);
    const obj = typeof updatedCompany.toJSON === 'function' ? updatedCompany.toJSON() : { ...updatedCompany };
    obj._id = obj.id;

    res.status(200).json({ status: 'success', data: { company: obj } });
});

exports.createRound = catchAsync(async (req, res, next) => {
    let companyId = req.user.companyId;

    if (!companyId && (req.user.role === 'ADMIN' || req.user.role === 'STAFF')) {
        companyId = req.body.companyId;
    }

    if (!companyId) return next(new AppError('Company ID required to create a round.', 400));

    const newRound = await Round.create({ ...req.body, companyId });
    invalidateCompanyCache(companyId);

    const obj = typeof newRound.toJSON === 'function' ? newRound.toJSON() : { ...newRound };
    obj._id = obj.id;

    res.status(201).json({ status: 'success', data: { round: obj } });
});

exports.getRounds = catchAsync(async (req, res, next) => {
    const companyId = req.params.companyId || req.user.companyId;
    if (!companyId) return next(new AppError('Company ID required to fetch rounds.', 400));

    const result = await getOrSetCached(`companies:${companyId}:rounds`, 30000, async () => {
        const rounds = await Round.findByCompanyId(companyId);
        return rounds.map((round) => {
            const obj = typeof round.toJSON === 'function' ? round.toJSON() : { ...round };
            obj._id = obj.id;
            return obj;
        });
    });

    if (req.params.companyId) {
        res.set('Cache-Control', 'public, max-age=15, s-maxage=30, stale-while-revalidate=60');
    }

    res.status(200).json({ status: 'success', results: result.length, data: { rounds: result } });
});

exports.updateRound = catchAsync(async (req, res, next) => {
    const round = await Round.findById(req.params.id);
    if (!round) return next(new AppError('No round found with that ID', 404));

    if (round.companyId !== req.user.companyId && req.user.role !== 'ADMIN' && req.user.role !== 'STAFF') {
        return next(new AppError('You do not have permission to update this round', 403));
    }

    await Round.update({ id: req.params.id }, req.body);
    invalidateCompanyCache(round.companyId);

    const updated = await Round.findById(req.params.id);
    const obj = typeof updated.toJSON === 'function' ? updated.toJSON() : { ...updated };
    obj._id = obj.id;

    res.status(200).json({ status: 'success', data: { round: obj } });
});

exports.deleteRound = catchAsync(async (req, res, next) => {
    const round = await Round.findById(req.params.id);
    if (!round) return next(new AppError('No round found with that ID', 404));

    if (round.companyId !== req.user.companyId && req.user.role !== 'ADMIN' && req.user.role !== 'STAFF') {
        return next(new AppError('Permission denied to delete this round', 403));
    }

    await Round.delete({ id: req.params.id });
    invalidateCompanyCache(round.companyId);

    res.status(204).json({ status: 'success', data: null });
});

exports.evaluateCandidates = catchAsync(async (req, res, next) => {
    const { studentIds, roundId, action, nextRoundId } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return next(new AppError('Please select at least one student.', 400));
    }

    const round = await Round.findById(roundId);
    if (!round) return next(new AppError('Round not found', 404));

    if (round.companyId !== req.user.companyId && req.user.role !== 'ADMIN' && req.user.role !== 'STAFF') {
        return next(new AppError('Permission denied for this evaluation', 403));
    }

    const company = await Company.findById(round.companyId);
    const results = [];

    await Promise.all(studentIds.map(async (studentId) => {
        const studentDoc = await Student.findById(studentId);
        if (!studentDoc) return;

        const studentUser = await User.findById(studentDoc.userId);
        if (!studentUser) return;

        let emailSubject = '';
        let emailMessage = '';

        if (action === 'PROMOTE') {
            const nextRound = await Round.findById(nextRoundId);
            if (!nextRound) return;

            const existing = await StudentPlacementStatus.findOne({ studentId: studentDoc.id, roundId, companyId: req.user.companyId });
            if (existing) {
                await StudentPlacementStatus.update({ id: existing.id }, { status: 'CLEARED' });
            }
            await StudentPlacementStatus.create({
                studentId: studentDoc.id,
                companyId: req.user.companyId,
                roundId: nextRoundId,
                status: 'PENDING',
            });

            emailSubject = `Congratulations! You have been promoted to ${nextRound.roundType}`;
            emailMessage = `Dear ${studentUser.fullName},\n\nYou have successfully cleared ${round.roundType} and are promoted to ${nextRound.roundType}.\n\nCheck your dashboard for details.\n\nBest,\n${company.name}`;
        } else if (action === 'REJECT') {
            const existing = await StudentPlacementStatus.findOne({ studentId: studentDoc.id, roundId, companyId: req.user.companyId });
            if (existing) {
                await StudentPlacementStatus.update({ id: existing.id }, { status: 'REJECTED' });
            }
            emailSubject = `Update on your application at ${company.name}`;
            emailMessage = `Dear ${studentUser.fullName},\n\nThank you for your interest in ${company.name}. We regret to inform you that you have not cleared ${round.roundType}.\n\nWe wish you the best for your future endeavors.\n\nBest,\n${company.name}`;
        } else if (action === 'OFFER') {
            const existing = await StudentPlacementStatus.findOne({ studentId: studentDoc.id, roundId, companyId: req.user.companyId });
            if (existing) {
                await StudentPlacementStatus.update({ id: existing.id }, { status: 'PLACED' });
            }
            await Student.update({ id: studentDoc.id }, { placementStatus: 'PLACED' });
            emailSubject = `Congratulations! Job Offer from ${company.name}`;
            emailMessage = `Dear ${studentUser.fullName},\n\nWe are thrilled to offer you the position at ${company.name}!\n\nYou have successfully cleared all rounds.\n\nBest,\n${company.name} HR Team`;
        }

        try {
            await Message.create({
                senderId: req.user._id,
                senderName: company.name,
                senderRole: 'COMPANY',
                receiverId: studentUser.id,
                subject: emailSubject,
                content: emailMessage,
                type: 'SYSTEM',
            });

            const parentUsers = await User.findAll({ role: 'PARENT', linkedStudentId: studentDoc.id });
            await Promise.all(parentUsers.map((parentUser) => Message.create({
                senderId: req.user._id,
                senderName: company.name,
                senderRole: 'COMPANY',
                receiverId: parentUser.id,
                subject: emailSubject,
                content: `Update regarding your child ${studentUser.fullName}:\n\n${emailMessage}`,
                type: 'SYSTEM',
            })));
        } catch (error) {
            console.error(`Failed to send message to ${studentUser.email}`);
        }

        results.push(studentId);
    }));

    invalidateCompanyCache(round.companyId);
    res.status(200).json({ status: 'success', processed: results.length, message: `Successfully processed ${results.length} students.` });
});

exports.getRoundStudents = catchAsync(async (req, res, next) => {
    const { roundId } = req.params;

    const round = await Round.findById(roundId);
    if (!round || round.companyId !== req.user.companyId) {
        return next(new AppError('Round not found or permission denied', 404));
    }

    let placements = await StudentPlacementStatus.findByFilter({ roundId, companyId: req.user.companyId });

    if (req.user.role === 'COMPANY') {
        placements = placements.filter((placement) => placement.status !== 'PENDING_APPROVAL');
    }

    const studentIds = placements.map((placement) => placement.studentId);
    const studentsRes = await Promise.all(studentIds.map((studentId) => Student.findById(studentId)));
    const students = studentsRes.filter((student) => student !== null);

    const results = students.map((student) => {
        const status = placements.find((placement) => placement.studentId === student.id);
        return {
            _id: student.id,
            userId: student.userId,
            fullName: student.name,
            email: student.email,
            department: student.department,
            cgpa: student.cgpa,
            placementStatus: status.status,
            placementId: status.id,
        };
    });

    res.status(200).json({ status: 'success', results: results.length, data: { students: results } });
});

exports.sendAnnouncement = catchAsync(async (req, res, next) => {
    const { subject, message, roundId } = req.body;
    const companyId = req.user.companyId;

    if (!companyId) return next(new AppError('Company context required', 400));

    const company = await Company.findById(companyId);
    if (!company) return next(new AppError('Company not found', 404));

    const filter = { companyId };
    if (roundId) filter.roundId = roundId;

    const placements = await StudentPlacementStatus.findByFilter(filter);
    const approvedPlacements = placements.filter((placement) => placement.status !== 'PENDING_APPROVAL');
    const uniqueStudentIds = [...new Set(approvedPlacements.map((placement) => placement.studentId))];

    const studentRecords = await Promise.all(uniqueStudentIds.map((studentId) => Student.findById(studentId)));
    const validStudents = studentRecords.filter((student) => student !== null);
    const studentUsers = await Promise.all(validStudents.map((student) => User.findById(student.userId)));
    const students = studentUsers.filter((user) => user !== null);

    if (students.length === 0) {
        return res.status(200).json({ status: 'success', message: 'No students found to notify.' });
    }

    await Promise.all(students.map((student) => Message.create({
        senderId: req.user._id,
        senderName: company.name,
        senderRole: 'COMPANY',
        receiverId: student.id,
        subject: `[${company.name}] ${subject}`,
        content: message,
        type: 'DIRECT',
    })));

    invalidateCompanyCache(companyId);
    res.status(200).json({ status: 'success', message: `Announcement sent to ${students.length} students.` });
});

exports.applyToCompany = catchAsync(async (req, res, next) => {
    const companyId = req.params.id;

    if (req.user.approvalStatus !== 'APPROVED') {
        return next(new AppError('Your registration has not been approved yet. Please wait for Admin/Staff approval before applying to companies.', 403));
    }

    const student = await Student.findByUserId(req.user._id);
    if (!student) return next(new AppError('Student profile not found. Please complete your profile.', 400));

    const company = await Company.findById(companyId);
    if (!company) return next(new AppError('Company not found', 404));

    if (company.hiringStatus !== 'OPEN') return next(new AppError('This company is not currently hiring.', 400));

    if ((student.cgpa || 0) < company.minCgpa) {
        return next(new AppError(`Your CGPA (${student.cgpa}) does not meet the minimum requirement (${company.minCgpa}) for this company.`, 400));
    }

    const rounds = await Round.findByCompanyId(companyId);
    if (rounds.length === 0) return next(new AppError('No selection rounds defined for this company yet.', 400));

    const existingApplication = await StudentPlacementStatus.findOne({ studentId: student.id, companyId });
    if (existingApplication) return next(new AppError('You have already applied to this company.', 400));

    await StudentPlacementStatus.create({
        studentId: student.id,
        companyId,
        roundId: rounds[0].id,
        status: 'PENDING_APPROVAL',
    });

    invalidateCompanyCache(companyId);
    clearCachedValue(`dashboard:student:${req.user._id}`);
    res.status(201).json({ status: 'success', message: 'Application submitted successfully!' });
});
