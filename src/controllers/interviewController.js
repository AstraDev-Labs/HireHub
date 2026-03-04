const InterviewSlot = require('../models/InterviewSlot');
const Company = require('../models/Company');
const Student = require('../models/Student');
const Round = require('../models/Round');
const Notification = require('../models/Notification');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { v4: uuidv4 } = require('uuid');

exports.createInterviewSlots = catchAsync(async (req, res, next) => {
    // Companies can create slots
    const { driveId, roundId, slots } = req.body;
    // slots should be array of { studentId, scheduledAt, durationMinutes, meetLink }

    if (!driveId || !roundId || !slots || !Array.isArray(slots) || slots.length === 0) {
        return next(new AppError('Please provide driveId, roundId, and an array of slots.', 400));
    }

    const companyId = req.user.companyId;
    if (!companyId) {
        return next(new AppError('You must be associated with a company to schedule interviews.', 403));
    }

    const company = await Company.findById(companyId);
    if (!company) {
        return next(new AppError('Company not found.', 404));
    }

    const round = await Round.findById(roundId);
    if (!round) {
        return next(new AppError('Round not found.', 404));
    }

    const createdSlots = [];

    for (const slot of slots) {
        const student = await Student.findById(slot.studentId);
        if (!student) continue;

        const newSlot = new InterviewSlot({
            id: uuidv4(),
            driveId,
            companyId,
            studentId: slot.studentId,
            roundId,
            studentName: student.name,
            companyName: company.name,
            roundName: round.roundName || round.roundType,
            scheduledAt: new Date(slot.scheduledAt),
            durationMinutes: slot.durationMinutes || 30,
            meetLink: slot.meetLink || '',
            status: 'SCHEDULED'
        });

        await newSlot.save();
        createdSlots.push(newSlot);

        // Notify Student
        if (student.userId) {
            const notif = new Notification({
                id: uuidv4(),
                userId: student.userId,
                title: 'Interview Scheduled',
                message: `An interview has been scheduled with ${company.name} for the ${round.roundName || round.roundType} round on ${new Date(slot.scheduledAt).toLocaleString()}.`,
                type: 'SYSTEM',
                isRead: false
            });
            await notif.save();
        }
    }

    res.status(201).json({
        status: 'success',
        results: createdSlots.length,
        data: {
            interviewSlots: createdSlots
        }
    });
});

exports.getCompanyInterviews = catchAsync(async (req, res, next) => {
    const companyId = req.user.companyId;
    if (!companyId) return next(new AppError('Company ID not found.', 403));

    const interviews = await InterviewSlot.findByCompanyId(companyId);

    // Sort by scheduledAt
    interviews.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

    res.status(200).json({
        status: 'success',
        results: interviews.length,
        data: {
            interviews
        }
    });
});

exports.getStudentInterviews = catchAsync(async (req, res, next) => {
    const student = await Student.findByUserId(req.user._id);
    if (!student) return next(new AppError('Student profile not found.', 404));

    const interviews = await InterviewSlot.findByStudentId(student.id);

    interviews.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

    res.status(200).json({
        status: 'success',
        results: interviews.length,
        data: {
            interviews
        }
    });
});

exports.getAllInterviews = catchAsync(async (req, res, next) => {
    // Only Admin/Staff can use this
    const interviews = await InterviewSlot.scan().exec();

    interviews.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

    res.status(200).json({
        status: 'success',
        results: interviews.length,
        data: {
            interviews
        }
    });
});

exports.updateInterviewStatus = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { status, feedback } = req.body;

    const interview = await InterviewSlot.findById(id);
    if (!interview) {
        return next(new AppError('Interview slot not found.', 404));
    }

    // Checking if the user belongs to the company that scheduled it
    if (req.user.companyId !== interview.companyId && req.user.role !== 'ADMIN' && req.user.role !== 'STAFF') {
        return next(new AppError('You do not have permission to update this interview.', 403));
    }

    if (status) interview.status = status;
    if (feedback) interview.feedback = feedback;

    await interview.save();

    res.status(200).json({
        status: 'success',
        data: {
            interview
        }
    });
});

exports.deleteInterview = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const interview = await InterviewSlot.findById(id);

    if (!interview) {
        return next(new AppError('Interview slot not found.', 404));
    }

    if (req.user.companyId !== interview.companyId && req.user.role !== 'ADMIN') {
        return next(new AppError('You do not have permission to delete this interview.', 403));
    }

    await interview.delete();

    res.status(204).json({
        status: 'success',
        data: null
    });
});
