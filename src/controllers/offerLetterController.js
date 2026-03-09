const OfferLetter = require('../models/OfferLetter');
const Student = require('../models/Student');
const Company = require('../models/Company');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Round = require('../models/Round');
const StudentPlacementStatus = require('../models/StudentPlacementStatus');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// Get all offers (Admin/Staff see all, Company sees theirs, Student sees theirs)
exports.getOffers = catchAsync(async (req, res) => {
    let offers;

    if (['ADMIN', 'STAFF'].includes(req.user.role)) {
        offers = await OfferLetter.findAll();
    } else if (req.user.role === 'COMPANY') {
        const company = await Company.findById(req.user.companyId);
        if (!company) return res.status(200).json({ status: 'success', data: { offers: [] } });
        offers = await OfferLetter.findByCompanyId(company.id);
    } else if (req.user.role === 'STUDENT') {
        const student = await Student.findByUserId(req.user._id);
        if (!student) return res.status(200).json({ status: 'success', data: { offers: [] } });
        offers = await OfferLetter.findByStudentId(student.id);
    } else {
        offers = [];
    }

    const sorted = offers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const result = sorted.map(o => {
        const obj = typeof o.toJSON === 'function' ? o.toJSON() : { ...o };
        obj._id = obj.id;
        return obj;
    });

    res.status(200).json({ status: 'success', data: { offers: result } });
});

// Issue offer (Admin/Staff/Company)
exports.issueOffer = catchAsync(async (req, res, next) => {
    const { studentId, companyId, role, packageLpa, joiningDate, offerDate, remarks, attachmentUrl } = req.body;

    if (!studentId || !companyId) return next(new AppError('Student and Company are required', 400));

    const student = await Student.findById(studentId);
    if (!student) return next(new AppError('Student not found', 404));

    const company = await Company.findById(companyId);
    if (!company) return next(new AppError('Company not found', 404));

    // Validation: Student must have cleared the final round of this company
    const rounds = await Round.findByCompanyId(companyId);
    if (rounds && rounds.length > 0) {
        const finalRound = rounds[rounds.length - 1]; // Because they are sorted by roundOrder
        const placementStatus = await StudentPlacementStatus.findOne({ studentId, companyId, roundId: finalRound.id });

        if (!placementStatus || !['CLEARED', 'PLACED'].includes(placementStatus.status)) {
            return next(new AppError(`Offer cannot be issued. Student has not cleared the final round (${finalRound.roundType}) for ${company.name}.`, 400));
        }
    }

    const offer = await OfferLetter.create({
        studentId: student.id,
        companyId: company.id,
        studentName: student.name,
        companyName: company.name,
        role: role || '',
        packageLpa: packageLpa || company.packageLpa,
        joiningDate,
        offerDate: offerDate || new Date().toISOString().split('T')[0],
        remarks,
        issuedBy: req.user._id,
        attachmentUrl
    });

    // Notify student
    const studentUser = await User.findById(student.userId);
    if (studentUser) {
        await Notification.createNotification({
            userId: studentUser.id,
            type: 'APPLICATION_STATUS',
            title: '🎉 Offer Letter Issued!',
            message: `You have received an offer from ${company.name}${role ? ` for the role of ${role}` : ''}.`,
            link: '/offers'
        });
    }

    const obj = typeof offer.toJSON === 'function' ? offer.toJSON() : { ...offer };
    obj._id = obj.id;

    res.status(201).json({ status: 'success', data: { offer: obj } });
});

// Update offer status
exports.updateOffer = catchAsync(async (req, res, next) => {
    const offer = await OfferLetter.findById(req.params.id);
    if (!offer) return next(new AppError('Offer not found', 404));

    const allowed = ['status', 'remarks', 'joiningDate', 'role', 'packageLpa'];
    const updates = {};
    for (const key of allowed) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    await OfferLetter.update({ id: offer.id }, updates);
    const updated = await OfferLetter.findById(offer.id);
    const obj = typeof updated.toJSON === 'function' ? updated.toJSON() : { ...updated };
    obj._id = obj.id;

    res.status(200).json({ status: 'success', data: { offer: obj } });
});

// Delete offer
exports.deleteOffer = catchAsync(async (req, res, next) => {
    const offer = await OfferLetter.findById(req.params.id);
    if (!offer) return next(new AppError('Offer not found', 404));

    await OfferLetter.delete({ id: offer.id });
    res.status(200).json({ status: 'success', message: 'Offer deleted' });
});

