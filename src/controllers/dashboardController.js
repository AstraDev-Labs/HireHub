const Student = require('../models/Student');
const Company = require('../models/Company');
const StudentPlacementStatus = require('../models/StudentPlacementStatus');
const OfferLetter = require('../models/OfferLetter');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');

exports.getDashboardStats = catchAsync(async (req, res, next) => {
    const totalStudents = await Student.countAll();
    const placedStudents = await Student.countAll({ placementStatus: 'PLACED' });
    const notPlacedStudents = await Student.countAll({ placementStatus: 'NOT_PLACED' });
    const totalCompanies = await Company.countAll();

    // Department-wise breakdown
    const allStudents = await Student.findAll();
    const deptMap = {};
    allStudents.forEach(s => {
        const dept = s.department || 'Unknown';
        if (!deptMap[dept]) deptMap[dept] = { total: 0, placed: 0 };
        deptMap[dept].total++;
        if (s.placementStatus === 'PLACED') deptMap[dept].placed++;
    });
    const departmentStats = Object.entries(deptMap).map(([name, data]) => ({
        name,
        total: data.total,
        placed: data.placed,
        percentage: data.total > 0 ? Math.round((data.placed / data.total) * 100) : 0
    }));

    // Company-wise applicant count
    const allCompanies = await Company.findAll();
    const allPlacements = await StudentPlacementStatus.findAll();
    const companyStats = allCompanies.map(c => {
        const apps = allPlacements.filter(p => p.companyId === c.id && p.status !== 'PENDING_APPROVAL');
        return {
            name: c.name,
            applicants: apps.length,
            hiringStatus: c.hiringStatus || 'OPEN'
        };
    }).sort((a, b) => b.applicants - a.applicants);

    // Pending registrations count
    const pendingUsers = await User.scan().where('approvalStatus').eq('PENDING').exec();
    const pendingRegistrations = pendingUsers.length;

    // Salary ranges stats
    const allOffers = await OfferLetter.findAll();
    const acceptedOffers = allOffers.filter(o => o.status === 'ACCEPTED' && o.packageLpa != null);
    const salaryRanges = {
        '<5 LPA': 0,
        '5-10 LPA': 0,
        '10-20 LPA': 0,
        '>20 LPA': 0
    };

    acceptedOffers.forEach(o => {
        const lpa = Number(o.packageLpa);
        if (lpa < 5) salaryRanges['<5 LPA']++;
        else if (lpa >= 5 && lpa <= 10) salaryRanges['5-10 LPA']++;
        else if (lpa > 10 && lpa <= 20) salaryRanges['10-20 LPA']++;
        else if (lpa > 20) salaryRanges['>20 LPA']++;
    });

    const salaryStats = Object.keys(salaryRanges).map(range => ({
        name: range,
        count: salaryRanges[range]
    }));

    // Placement rate
    const placementRate = totalStudents > 0 ? Math.round((placedStudents / totalStudents) * 100) : 0;

    res.status(200).json({
        status: 'success',
        data: {
            totalStudents,
            placedStudents,
            notPlacedStudents,
            totalCompanies,
            placementRate,
            pendingRegistrations,
            departmentStats,
            companyStats,
            salaryStats
        }
    });
});

// Student-specific dashboard
exports.getStudentDashboard = catchAsync(async (req, res, next) => {
    const student = await Student.findByUserId(req.user._id);
    if (!student) {
        return res.status(200).json({
            status: 'success',
            data: { applications: [], totalApplications: 0, pending: 0, cleared: 0, rejected: 0 }
        });
    }

    const placements = await StudentPlacementStatus.findByStudentId(student.id);
    const Round = require('../models/Round');

    const applications = await Promise.all(placements.map(async (p) => {
        const obj = typeof p.toJSON === 'function' ? p.toJSON() : { ...p };
        obj._id = obj.id;
        const [company, round] = await Promise.all([
            obj.companyId ? Company.findById(obj.companyId) : null,
            obj.roundId ? Round.findById(obj.roundId) : null
        ]);
        return {
            _id: obj._id,
            companyName: company?.name || 'Unknown',
            companyId: obj.companyId,
            roundName: round?.roundName || round?.roundType || 'Initial',
            status: obj.status,
            updatedAt: obj.updatedAt
        };
    }));

    const pending = applications.filter(a => ['PENDING', 'PENDING_APPROVAL', 'CLEARED'].includes(a.status)).length;
    const cleared = applications.filter(a => a.status === 'CLEARED' || a.status === 'PLACED').length;
    const rejected = applications.filter(a => a.status === 'REJECTED').length;

    res.status(200).json({
        status: 'success',
        data: {
            applications,
            totalApplications: applications.length,
            pending,
            cleared,
            rejected,
            studentName: student.name,
            cgpa: student.cgpa,
            department: student.department
        }
    });
});

// Company-specific dashboard stats
exports.getCompanyDashboard = catchAsync(async (req, res, next) => {
    const companyId = req.user.companyId;
    if (!companyId) {
        return res.status(200).json({ status: 'success', data: { totalApplicants: 0, rounds: [], pipeline: [] } });
    }

    const company = await Company.findById(companyId);
    const Round = require('../models/Round');
    const rounds = await Round.findByCompanyId(companyId);
    const placements = await StudentPlacementStatus.findByFilter({ companyId });

    // Exclude pending approvals
    const approvedPlacements = placements.filter(p => p.status !== 'PENDING_APPROVAL');

    // Pipeline: how many students per round + status
    const pipeline = rounds.map(r => {
        const roundPlacements = approvedPlacements.filter(p => p.roundId === r.id);
        return {
            roundName: r.roundName || r.roundType,
            roundOrder: r.roundOrder,
            total: roundPlacements.length,
            cleared: roundPlacements.filter(p => p.status === 'CLEARED' || p.status === 'PLACED').length,
            pending: roundPlacements.filter(p => p.status === 'PENDING').length,
            rejected: roundPlacements.filter(p => p.status === 'REJECTED').length
        };
    }).sort((a, b) => a.roundOrder - b.roundOrder);

    const pendingApprovals = placements.filter(p => p.status === 'PENDING_APPROVAL').length;

    res.status(200).json({
        status: 'success',
        data: {
            companyName: company?.name,
            totalApplicants: approvedPlacements.length,
            pendingApprovals,
            pipeline
        }
    });
});
