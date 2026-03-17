const Student = require('../models/Student');
const Company = require('../models/Company');
const StudentPlacementStatus = require('../models/StudentPlacementStatus');
const OfferLetter = require('../models/OfferLetter');
const User = require('../models/User');
const Challenge = require('../models/Challenge');
const catchAsync = require('../utils/catchAsync');
const { getOrSetCached } = require('../utils/asyncCache');

exports.getDashboardStats = catchAsync(async (req, res) => {
    const data = await getOrSetCached('dashboard:admin:stats', 15000, async () => {
        const [rawStudents, allCompanies, allPlacements, pendingUsers, allOffers, totalChallenges, approvedUsers] = await Promise.all([
            Student.findAll(),
            Company.findAll(),
            StudentPlacementStatus.findAll(),
            User.scan().where('approvalStatus').eq('PENDING').exec(),
            OfferLetter.findAll(),
            Challenge.countAll(),
            User.scan().where('approvalStatus').eq('APPROVED').exec()
        ]);

        const approvedUserIds = new Set(approvedUsers.map(u => u.id));
        const allStudents = rawStudents.filter(s => approvedUserIds.has(s.userId));

        const totalStudents = allStudents.length;
        const placedStudents = allStudents.filter((student) => student.placementStatus === 'PLACED').length;
        const notPlacedStudents = allStudents.filter((student) => student.placementStatus === 'NOT_PLACED').length;
        const totalCompanies = allCompanies.length;

        const deptMap = {};
        allStudents.forEach((student) => {
            const department = student.department || 'Unknown';
            if (!deptMap[department]) {
                deptMap[department] = { total: 0, placed: 0 };
            }
            deptMap[department].total += 1;
            if (student.placementStatus === 'PLACED') {
                deptMap[department].placed += 1;
            }
        });

        const departmentStats = Object.entries(deptMap).map(([name, stats]) => ({
            name,
            total: stats.total,
            placed: stats.placed,
            percentage: stats.total > 0 ? Math.round((stats.placed / stats.total) * 100) : 0,
        }));

        const applicantCounts = new Map();
        allPlacements.forEach((placement) => {
            if (placement.status !== 'PENDING_APPROVAL') {
                applicantCounts.set(placement.companyId, (applicantCounts.get(placement.companyId) || 0) + 1);
            }
        });

        const companyStats = allCompanies
            .map((company) => ({
                name: company.name,
                applicants: applicantCounts.get(company.id) || 0,
                hiringStatus: company.hiringStatus || 'OPEN',
            }))
            .sort((a, b) => b.applicants - a.applicants);

        const salaryRanges = {
            '<5 LPA': 0,
            '5-10 LPA': 0,
            '10-20 LPA': 0,
            '>20 LPA': 0,
        };

        allOffers.forEach((offer) => {
            if (offer.status !== 'ACCEPTED' || offer.packageLpa == null) {
                return;
            }

            const lpa = Number(offer.packageLpa);
            if (lpa < 5) salaryRanges['<5 LPA'] += 1;
            else if (lpa <= 10) salaryRanges['5-10 LPA'] += 1;
            else if (lpa <= 20) salaryRanges['10-20 LPA'] += 1;
            else salaryRanges['>20 LPA'] += 1;
        });

        const salaryStats = Object.keys(salaryRanges).map((range) => ({
            name: range,
            count: salaryRanges[range],
        }));

        return {
            totalStudents,
            placedStudents,
            notPlacedStudents,
            totalCompanies,
            placementRate: totalStudents > 0 ? Math.round((placedStudents / totalStudents) * 100) : 0,
            pendingRegistrations: pendingUsers.length,
            departmentStats,
            companyStats,
            salaryStats,
            totalChallenges,
        };
    });

    res.status(200).json({
        status: 'success',
        data,
    });
});

exports.getStudentDashboard = catchAsync(async (req, res) => {
    const data = await getOrSetCached(`dashboard:student:${req.user._id}`, 10000, async () => {
        const student = await Student.findByUserId(req.user._id);
        if (!student) {
            return { applications: [], totalApplications: 0, pending: 0, cleared: 0, rejected: 0 };
        }

        const placements = await StudentPlacementStatus.findByStudentId(student.id);
        const Round = require('../models/Round');

        const applications = await Promise.all(placements.map(async (placement) => {
            const placementData = typeof placement.toJSON === 'function' ? placement.toJSON() : { ...placement };
            placementData._id = placementData.id;
            const [company, round] = await Promise.all([
                placementData.companyId ? Company.findById(placementData.companyId) : null,
                placementData.roundId ? Round.findById(placementData.roundId) : null,
            ]);

            return {
                _id: placementData._id,
                companyName: company?.name || 'Unknown',
                companyId: placementData.companyId,
                roundName: round?.roundName || round?.roundType || 'Initial',
                status: placementData.status,
                updatedAt: placementData.updatedAt,
            };
        }));

        return {
            applications,
            totalApplications: applications.length,
            pending: applications.filter((application) => ['PENDING', 'PENDING_APPROVAL', 'CLEARED'].includes(application.status)).length,
            cleared: applications.filter((application) => application.status === 'CLEARED' || application.status === 'PLACED').length,
            rejected: applications.filter((application) => application.status === 'REJECTED').length,
            studentName: student.name,
            cgpa: student.cgpa,
            department: student.department,
        };
    });

    res.status(200).json({ status: 'success', data });
});

exports.getCompanyDashboard = catchAsync(async (req, res) => {
    const companyId = req.user.companyId;
    if (!companyId) {
        return res.status(200).json({ status: 'success', data: { totalApplicants: 0, rounds: [], pipeline: [] } });
    }

    const data = await getOrSetCached(`dashboard:company:${companyId}`, 10000, async () => {
        const Round = require('../models/Round');
        const [company, rounds, placements] = await Promise.all([
            Company.findById(companyId),
            Round.findByCompanyId(companyId),
            StudentPlacementStatus.findByFilter({ companyId }),
        ]);

        const approvedPlacements = placements.filter((placement) => placement.status !== 'PENDING_APPROVAL');
        const pipeline = rounds
            .map((round) => {
                const roundPlacements = approvedPlacements.filter((placement) => placement.roundId === round.id);
                return {
                    roundName: round.roundName || round.roundType,
                    roundOrder: round.roundOrder,
                    total: roundPlacements.length,
                    cleared: roundPlacements.filter((placement) => placement.status === 'CLEARED' || placement.status === 'PLACED').length,
                    pending: roundPlacements.filter((placement) => placement.status === 'PENDING').length,
                    rejected: roundPlacements.filter((placement) => placement.status === 'REJECTED').length,
                };
            })
            .sort((a, b) => a.roundOrder - b.roundOrder);

        return {
            companyName: company?.name,
            totalApplicants: approvedPlacements.length,
            pendingApprovals: placements.filter((placement) => placement.status === 'PENDING_APPROVAL').length,
            pipeline,
        };
    });

    res.status(200).json({ status: 'success', data });
});

