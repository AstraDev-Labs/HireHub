const User = require('../models/User');
const Student = require('../models/Student');
const Company = require('../models/Company');
const Notification = require('../models/Notification');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { logAction } = require('../utils/auditLogger');
const sanitizeUser = require('../utils/sanitizeUser');

exports.getPendingUsers = catchAsync(async (req, res) => {
    let users = await User.findByApprovalStatus('PENDING');

    // Filter out ADMINs
    users = users.filter(u => u.role !== 'ADMIN');

    // If STAFF, filter based on department
    if (req.user.role === 'STAFF' && req.user.department) {
        const staffDept = req.user.department;

        // For parents, we need to resolve linked student departments
        const parentUsers = users.filter(u => u.role === 'PARENT' && u.linkedStudentId);
        const studentIds = parentUsers.map(u => u.linkedStudentId);

        const studentDeptMap = {};
        for (const sid of studentIds) {
            const student = await Student.findById(sid);
            if (student) studentDeptMap[sid] = student.department;
        }

        users = users.filter(user => {
            if (user.role === 'STUDENT' || user.role === 'STAFF') {
                return user.department === staffDept;
            }
            if (user.role === 'PARENT' && user.linkedStudentId) {
                return studentDeptMap[user.linkedStudentId] === staffDept;
            }
            return false;
        });
    }

    // Add _id alias for frontend compatibility
    const result = users.map(u => {
        const obj = sanitizeUser(u);
        obj._id = obj.id;
        return obj;
    });

    res.status(200).json({
        status: 'success',
        results: result.length,
        data: { users: result }
    });
});

exports.approveUser = catchAsync(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new AppError('No user found with that ID', 404));
    }

    // Role-based authorization for Staff
    if (req.user.role === 'STAFF') {
        const staffDept = req.user.department;

        if (user.role === 'PARENT') {
            if (!user.linkedStudentId) {
                return next(new AppError('You can only approve parents of students from your own department.', 403));
            }
            const student = await Student.findById(user.linkedStudentId);
            if (!student || student.department !== staffDept) {
                return next(new AppError('You can only approve parents of students from your own department.', 403));
            }
        } else if (user.role === 'STUDENT' || user.role === 'STAFF') {
            if (user.department !== staffDept) {
                return next(new AppError(`You can only approve users from your own department (${staffDept}).`, 403));
            }
        } else {
            return next(new AppError('You do not have permission to approve this user type.', 403));
        }
    }

    await User.update({ id: user.id }, { approvalStatus: 'APPROVED' });

    // Trigger notification
    await Notification.createNotification({
        userId: user.id,
        type: 'REGISTRATION_APPROVED',
        title: 'Registration Approved',
        message: 'Your registration has been approved. You now have full access to the platform.',
        link: '/dashboard'
    });

    // Audit Logging
    await logAction(req, 'UPDATE', 'User', user.id, `Approved user: ${user.fullName} (${user.role})`);

    const updatedUser = await User.findById(user.id);
    const obj = sanitizeUser(updatedUser);
    obj._id = obj.id;

    res.status(200).json({
        status: 'success',
        data: { user: obj }
    });
});

exports.rejectUser = catchAsync(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new AppError('No user found with that ID', 404));
    }

    if (req.user.role === 'STAFF') {
        const staffDept = req.user.department;

        if (user.role === 'PARENT') {
            if (!user.linkedStudentId) {
                return next(new AppError('You can only reject parents of students from your own department.', 403));
            }
            const student = await Student.findById(user.linkedStudentId);
            if (!student || student.department !== staffDept) {
                return next(new AppError('You can only reject parents of students from your own department.', 403));
            }
        } else if (user.role === 'STUDENT' || user.role === 'STAFF') {
            if (user.department !== staffDept) {
                return next(new AppError(`You can only reject users from your own department (${staffDept}).`, 403));
            }
        } else {
            return next(new AppError('You do not have permission to reject this user type.', 403));
        }
    }

    await User.update({ id: user.id }, { approvalStatus: 'DENIED' });

    // Trigger notification
    await Notification.createNotification({
        userId: user.id,
        type: 'REGISTRATION_REJECTED',
        title: 'Registration Rejected',
        message: 'Your registration has been rejected. Please contact the placement cell for more information.',
        link: '/profile'
    });

    // Audit Logging
    await logAction(req, 'UPDATE', 'User', user.id, `Rejected user: ${user.fullName} (${user.role})`);

    const updatedUser = await User.findById(user.id);
    const obj = sanitizeUser(updatedUser);
    obj._id = obj.id;

    res.status(200).json({
        status: 'success',
        data: { user: obj }
    });
});

exports.updatePublicKey = catchAsync(async (req, res) => {
    const { publicKey } = req.body;
    if (!publicKey) return next(new AppError('Please provide a public key', 400));

    await User.update({ id: req.user._id }, { publicKey });

    res.status(200).json({ status: 'success' });
});

exports.getUserPublicKey = catchAsync(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return next(new AppError('User not found', 404));

    res.status(200).json({
        status: 'success',
        data: { publicKey: user.publicKey }
    });
});

// --- Profile endpoints (all authenticated users) ---

exports.getMe = catchAsync(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) return next(new AppError('User not found', 404));

    const profile = sanitizeUser(user);
    profile._id = profile.id;

    // Merge role-specific data
    if (user.role === 'STUDENT') {
        const student = await Student.findByUserId(user.id);
        if (student) {
            const s = typeof student.toJSON === 'function' ? student.toJSON() : { ...student };
            profile.studentId = s.id;
            profile.cgpa = s.cgpa;
            profile.batchYear = s.batchYear;
            profile.department = s.department || profile.department;
            profile.placementStatus = s.placementStatus;
            profile.studentPhone = s.phone;
            profile.resumeLink = s.resumeLink;
            profile.socialLinks = s.socialLinks || {};
        }
    } else if (user.role === 'COMPANY' && user.companyId) {
        const company = await Company.findById(user.companyId);
        if (company) {
            const c = typeof company.toJSON === 'function' ? company.toJSON() : { ...company };
            profile.companyName = c.name;
            profile.companyEmail = c.email;
            profile.companyWebsite = c.website;
        }
    } else if (user.role === 'PARENT' && user.linkedStudentId) {
        const student = await Student.findById(user.linkedStudentId);
        if (student) {
            const s = typeof student.toJSON === 'function' ? student.toJSON() : { ...student };
            profile.linkedStudent = {
                name: s.name,
                department: s.department,
                batchYear: s.batchYear,
                cgpa: s.cgpa,
                placementStatus: s.placementStatus
            };
        }
    }

    res.status(200).json({ status: 'success', data: { user: profile } });
});

exports.updateMe = catchAsync(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) return next(new AppError('User not found', 404));

    // Common updatable fields
    const userUpdates = {};
    if (req.body.fullName) userUpdates.fullName = req.body.fullName;
    if (req.body.phoneNumber) {
        if (!/^\d{10}$/.test(req.body.phoneNumber)) {
            return next(new AppError('Phone number must be exactly 10 digits', 400));
        }
        userUpdates.phoneNumber = req.body.phoneNumber;
    }
    if (req.body.profileImage) userUpdates.profileImage = req.body.profileImage;

    // Apply user updates
    if (Object.keys(userUpdates).length > 0) {
        await User.update({ id: user.id }, userUpdates);
    }

    // Role-specific updates
    if (user.role === 'STUDENT') {
        const student = await Student.findByUserId(user.id);
        if (student) {
            const studentUpdates = {};
            if (req.body.cgpa !== undefined) {
                const cgpa = parseFloat(req.body.cgpa);
                if (isNaN(cgpa) || cgpa < 0 || cgpa > 10) {
                    return next(new AppError('CGPA must be between 0 and 10', 400));
                }
                studentUpdates.cgpa = cgpa;
            }
            if (req.body.socialLinks) studentUpdates.socialLinks = req.body.socialLinks;
            if (req.body.phoneNumber) studentUpdates.phone = req.body.phoneNumber;
            if (req.body.fullName) studentUpdates.name = req.body.fullName;

            if (Object.keys(studentUpdates).length > 0) {
                await Student.update({ id: student.id }, studentUpdates);
            }
        }
    }

    // Return updated profile
    const updatedUser = await User.findById(user.id);
    const profile = sanitizeUser(updatedUser);
    profile._id = profile.id;

    if (user.role === 'STUDENT') {
        const student = await Student.findByUserId(user.id);
        if (student) {
            const s = typeof student.toJSON === 'function' ? student.toJSON() : { ...student };
            profile.studentId = s.id;
            profile.cgpa = s.cgpa;
            profile.batchYear = s.batchYear;
            profile.placementStatus = s.placementStatus;
            profile.resumeLink = s.resumeLink;
            profile.socialLinks = s.socialLinks || {};
        }
    }

    res.status(200).json({ status: 'success', data: { user: profile } });
});

// Change Password
exports.changePassword = catchAsync(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return next(new AppError('Please provide current and new password', 400));
    }

    if (newPassword.length < 6) {
        return next(new AppError('Password must be at least 6 characters', 400));
    }
    if (!/[A-Z]/.test(newPassword)) {
        return next(new AppError('Password must contain an uppercase letter', 400));
    }
    if (!/[a-z]/.test(newPassword)) {
        return next(new AppError('Password must contain a lowercase letter', 400));
    }
    if (!/[0-9]/.test(newPassword)) {
        return next(new AppError('Password must contain a number', 400));
    }

    const user = await User.findById(req.user._id);
    if (!user) return next(new AppError('User not found', 404));

    const bcrypt = require('bcrypt');
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        return next(new AppError('Current password is incorrect', 401));
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.update({ id: user.id }, { password: hashedPassword });

    res.status(200).json({ status: 'success', message: 'Password changed successfully' });
});


