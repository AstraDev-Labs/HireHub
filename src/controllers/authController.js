const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.syncUser = catchAsync(async (req, res, next) => {
    // The user information is in req.auth.payload when using express-oauth2-jwt-bearer
    // But typically the frontend needs to send the profile info, or the backend queries the Auth0 Management API.
    // For simplicity, let's assume the frontend sends the user profile in the body after login.
    const { email, name, picture, sub: auth0_id } = req.body;

    if (!auth0_id || !email) {
        return next(new AppError('Missing required user profile information from Auth0', 400));
    }

    // Check if user already exists
    let user = await User.findOne({ auth0_id });

    if (!user) {
        // Fallback: check by email in case they existed before Auth0
        user = await User.findOne({ email });

        if (user) {
            // Link the existing account to Auth0
            user.auth0_id = auth0_id;
            user.profileImage = picture || user.profileImage;
            await user.save({ validateBeforeSave: false });
        } else {
            // Create a brand new user
            user = await User.create({
                auth0_id,
                email,
                username: email.split('@')[0] + Math.floor(Math.random() * 10000), // Generate a random username
                fullName: name || email.split('@')[0],
                phoneNumber: '0000000000', // Default placeholder, user can update later
                profileImage: picture
            });
        }
    }

    res.status(200).json({
        status: 'success',
        data: {
            user
        }
    });
});

exports.internalSync = catchAsync(async (req, res, next) => {
    // Verify server-to-server secret
    const secret = req.headers['x-internal-secret'];
    if (secret !== process.env.AUTH0_SECRET) {
        return next(new AppError('Unauthorized sync request', 401));
    }

    const { user } = req.body;
    if (!user || !user.sub) {
        return next(new AppError('No Auth0 user data provided', 400));
    }

    let existingUser = await User.findOne({ auth0_id: user.sub });

    if (!existingUser) {
        // Fallback: check by email in case they existed before Auth0
        existingUser = await User.findOne({ email: user.email });

        if (existingUser) {
            existingUser.auth0_id = user.sub;
            existingUser.profileImage = user.picture || existingUser.profileImage;
            await existingUser.save({ validateBeforeSave: false });
        } else {
            const baseUsername = (user.nickname || user.name || user.email.split('@')[0]).replace(/\s+/g, '').toLowerCase();
            existingUser = await User.create({
                auth0_id: user.sub,
                email: user.email,
                username: `${baseUsername}${Math.floor(Math.random() * 10000)}`,
                fullName: user.name || user.nickname || user.email.split('@')[0],
                phoneNumber: '0000000000', // Default placeholder, user can update later
                profileImage: user.picture
            });
        }
    }

    res.status(200).json({
        status: 'success',
        data: {
            user: existingUser
        }
    });
});

exports.syncDelete = catchAsync(async (req, res, next) => {
    // Verify server-to-server secret
    const secret = req.headers['x-internal-secret'];
    if (secret !== process.env.AUTH0_SECRET) {
        return next(new AppError('Unauthorized sync request', 401));
    }

    const { auth0_id } = req.body;
    if (!auth0_id) {
        return next(new AppError('No Auth0 user ID provided', 400));
    }

    await User.findOneAndDelete({ auth0_id });
    
    // Note: We could also delete related Student, Company, Staff profile documents here
    // But for now, deleting the User document is the primary requirement.

    res.status(200).json({
        status: 'success',
        message: 'User deleted successfully'
    });
});

exports.logStreamWebhook = catchAsync(async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    // We use the internal secret as the bearer token for simplicity
    if (!authHeader || authHeader !== `Bearer ${process.env.AUTH0_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const logs = req.body;
    if (!Array.isArray(logs)) {
        return res.status(400).json({ error: 'Expected array of logs' });
    }

    for (const log of logs) {
        // Detect "Delete a user" event from Management API
        if (log.data && log.data.type === 'sapi' && log.data.description === 'Delete a user') {
            let auth0Id = log.data.user_id || log.data.user_name;
            
            if (!auth0Id && log.data.details && log.data.details.request && log.data.details.request.path) {
                const parts = log.data.details.request.path.split('/');
                auth0Id = parts[parts.length - 1];
            }

            if (auth0Id) {
                auth0Id = decodeURIComponent(auth0Id);
                console.log(`[Webhook] Deleting user from DB due to Auth0 Log Stream event: ${auth0Id}`);
                await User.findOneAndDelete({ auth0_id: auth0Id });
            }
        }
    }

    res.status(200).json({ status: 'success' });
});

exports.onboard = catchAsync(async (req, res, next) => {
    // The user should be authenticated and attached to req.user by protect middleware
    const user = req.user;

    if (user.role) {
        return next(new AppError('User has already completed onboarding.', 400));
    }

    const { role, department, batchYear, phoneNumber, companyName, studentName, studentContact, fullName } = req.body;

    if (!role || !['STUDENT', 'COMPANY', 'STAFF', 'PARENT'].includes(role)) {
        return next(new AppError('Invalid or missing role.', 400));
    }

    user.role = role;
    user.approvalStatus = 'PENDING';
    
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (department) user.department = department;
    
    if (role === 'PARENT') {
        if (studentName) user.studentName = studentName;
        if (studentContact) user.studentContact = studentContact;
    }
    
    if (role === 'STUDENT' || role === 'STAFF') {
        if (fullName) user.fullName = fullName;
        
        // Generate Username
        // Helper to format name: moves initials (single letters or dotted letters) to the end
        const formatName = (name) => {
            let parts = name.trim().split(/\s+/);
            let initials = [];
            let nameWords = [];
            
            for (let p of parts) {
                let cleanP = p.replace(/\./g, '');
                if (cleanP.length === 1 || p.includes('.')) {
                    let subInitials = p.split('.').filter(x => x.length > 0);
                    initials.push(...subInitials);
                } else {
                    nameWords.push(cleanP);
                }
            }
            return [...nameWords, ...initials].map(x => x.toUpperCase()).join('-');
        };

        let namePart = formatName(fullName || user.fullName);
        let deptPart = department ? department.match(/\(([^)]+)\)/) : null;
        let deptStr = deptPart ? deptPart[1].toUpperCase() : (department ? department.toUpperCase().replace(/\s+/g, '-') : 'DEPT');
        
        if (role === 'STUDENT') {
            user.username = `${namePart}-${deptStr}-${batchYear || new Date().getFullYear()}`;
        } else if (role === 'STAFF') {
            user.username = `${namePart}-${deptStr}-STAFF`;
        }
    }
    
    // We can save the user. If they are a student or company, we might need to create respective profile documents,
    // but for now, we just update the user model.

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
        status: 'success',
        data: {
            user
        }
    });
});
