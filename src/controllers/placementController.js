const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const StudentPlacementStatus = require('../models/StudentPlacementStatus');
const Student = require('../models/Student');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const Company = require('../models/Company');
const Round = require('../models/Round');
const Message = require('../models/Message');

// --- Application Approval ---

exports.getAllApplications = catchAsync(async (req, res, next) => {
    try {
        const filter = {};
        if (req.query.status) filter.status = req.query.status;
        if (req.query.companyId) filter.companyId = req.query.companyId;
        if (req.query.studentId) filter.studentId = req.query.studentId;
        if (req.query.roundId) filter.roundId = req.query.roundId;

        const applications = await StudentPlacementStatus.findByFilter(filter);

        // Manual populate
        const result = [];
        for (const app of applications) {
            const obj = typeof app.toJSON === 'function' ? app.toJSON() : { ...app };
            obj._id = obj.id;

            if (obj.studentId) {
                const student = await Student.findById(obj.studentId);
                if (student) obj.studentId = { _id: student.id, name: student.name, email: student.email, department: student.department, cgpa: student.cgpa };
            }
            if (obj.companyId) {
                const company = await Company.findById(obj.companyId);
                if (company) obj.companyId = { _id: company.id, name: company.name };
            }
            if (obj.roundId) {
                const round = await Round.findById(obj.roundId);
                if (round) obj.roundId = { _id: round.id, roundType: round.roundType };
            }
            result.push(obj);
        }

        res.status(200).json({ status: 'success', results: result.length, data: { applications: result } });
    } catch (error) {
        console.error("Critical Error in getAllApplications:", error);
        return next(new AppError(`Server Error: ${error.message}`, 500));
    }
});

exports.approveApplication = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['PENDING', 'REJECTED'].includes(status)) {
        return next(new AppError('Invalid status update. status must be PENDING (Approve) or REJECTED.', 400));
    }

    const existing = await StudentPlacementStatus.findById(id);
    if (!existing) return next(new AppError('Application not found', 404));

    await StudentPlacementStatus.update({ id }, { status });
    const application = await StudentPlacementStatus.findById(id);
    const obj = typeof application.toJSON === 'function' ? application.toJSON() : { ...application };
    obj._id = obj.id;

    res.status(200).json({ status: 'success', data: { application: obj } });
});

// --- Legacy Placement Logic ---

exports.updatePlacementStatus = catchAsync(async (req, res, next) => {
    const { studentId, companyId, roundId, status } = req.body;

    let placement = await StudentPlacementStatus.findOne({ studentId, companyId, roundId });

    if (!placement) {
        placement = await StudentPlacementStatus.create({
            studentId,
            companyId,
            roundId,
            status,
            updatedBy: req.user._id
        });
    } else {
        await StudentPlacementStatus.update({ id: placement.id }, { status, updatedBy: req.user._id });
        placement = await StudentPlacementStatus.findById(placement.id);
    }

    // --- Parent Notification ---
    try {
        const parents = await User.findAll({ role: 'PARENT', linkedStudentId: studentId });

        for (const parent of parents) {
            const student = await Student.findById(studentId);
            const statusMsg = status === 'CLEARED' ? 'cleared a round' :
                status === 'PLACED' ? 'been placed' :
                    status === 'OFFERED' ? 'received an offer' :
                        status === 'REJECTED' ? 'not cleared a round' : 'had a status update';

            const messageContent = `Dear ${parent.fullName},\n\nYour child, ${student ? student.name : 'Unknown'}, has ${statusMsg}.\n\nUpdate Details:\nStatus: ${status}\n\nPlease check the Student Progress dashboard for full details.\n\nBest Regards,\nHireHub Placement Cell`;

            await Message.create({
                senderId: req.user._id,
                senderName: 'HireHub System',
                senderRole: 'SYSTEM',
                receiverId: parent.id,
                subject: 'Updates Regarding your Child - HireHub',
                content: messageContent,
                type: 'SYSTEM'
            });
        }
    } catch (err) {
        console.error("Failed to send parent internal message:", err);
    }

    const obj = typeof placement.toJSON === 'function' ? placement.toJSON() : { ...placement };
    obj._id = obj.id;

    res.status(200).json({ status: 'success', data: { placement: obj } });
});

exports.getStudentPlacementStatus = catchAsync(async (req, res, next) => {
    const studentId = req.params.studentId;

    const statuses = await StudentPlacementStatus.findByStudentId(studentId);

    const result = [];
    for (const s of statuses) {
        const obj = typeof s.toJSON === 'function' ? s.toJSON() : { ...s };
        obj._id = obj.id;
        if (obj.companyId) {
            const company = await Company.findById(obj.companyId);
            if (company) obj.companyId = { _id: company.id, name: company.name };
        }
        if (obj.roundId) {
            const round = await Round.findById(obj.roundId);
            if (round) obj.roundId = { _id: round.id, roundName: round.roundName };
        }
        result.push(obj);
    }

    res.status(200).json({ status: 'success', results: result.length, data: { statuses: result } });
});
