const Message = require('../models/Message');
const User = require('../models/User');
const Student = require('../models/Student');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.getMessages = catchAsync(async (req, res, next) => {
    const userId = req.user._id;
    const userRole = req.user.role;

    const messages = await Message.findForUser(userId, userRole);

    // Manual populate sender and receiver
    const result = [];
    for (const m of messages) {
        const obj = typeof m === 'object' && !m.toJSON ? m : (typeof m.toJSON === 'function' ? m.toJSON() : { ...m });
        obj._id = obj.id;

        if (obj.senderId && typeof obj.senderId === 'string') {
            const sender = await User.findById(obj.senderId);
            if (sender) obj.senderId = { _id: sender.id, fullName: sender.fullName, email: sender.email, role: sender.role, username: sender.username };
        }
        if (obj.receiverId && typeof obj.receiverId === 'string') {
            const receiver = await User.findById(obj.receiverId);
            if (receiver) obj.receiverId = { _id: receiver.id, fullName: receiver.fullName, email: receiver.email, role: receiver.role, username: receiver.username };
        }
        result.push(obj);
    }

    res.status(200).json({
        status: 'success',
        results: result.length,
        data: { messages: result }
    });
});

exports.sendMessage = catchAsync(async (req, res, next) => {
    const { receiverId, subject, content, type, receiverRole, attachments, isEncrypted } = req.body;

    if (!content && (!attachments || attachments.length === 0)) {
        return next(new AppError('Message content or attachment cannot be empty', 400));
    }

    const messageData = {
        senderId: req.user._id,
        senderName: req.user.fullName,
        senderRole: req.user.role,
        content: content || '',
        subject,
        attachments: attachments || [],
        type: type || 'DIRECT',
        isEncrypted: isEncrypted || false
    };

    if (messageData.type === 'ANNOUNCEMENT') {
        if (!['STAFF', 'ADMIN', 'COMPANY'].includes(req.user.role)) {
            return next(new AppError('You do not have permission to send announcements', 403));
        }
        messageData.receiverRole = receiverRole || 'ALL';
    } else {
        if (!receiverId) return next(new AppError('receiverId is required for direct messages', 400));
        messageData.receiverId = receiverId;

        const receiver = await User.findById(receiverId);
        if (!receiver) return next(new AppError('Receiver not found', 404));

        const senderRole = req.user.role;
        const recRole = receiver.role;

        if (senderRole === 'STUDENT' && recRole === 'STUDENT') {
            return next(new AppError('Students are not allowed to message other students directly.', 403));
        }
        if (senderRole === 'PARENT' && recRole === 'PARENT') {
            return next(new AppError('Parents are not allowed to message other parents directly.', 403));
        }
        if (senderRole === 'STUDENT' && !['STAFF', 'ADMIN', 'COMPANY', 'PARENT'].includes(recRole)) {
            return next(new AppError('Students can only message Staff, Admins, Companies, and Parents.', 403));
        }
        if (senderRole === 'PARENT') {
            if (recRole === 'STUDENT') {
                const childDoc = req.user.linkedStudentId ? await Student.findById(req.user.linkedStudentId) : null;
                if (!childDoc || childDoc.userId !== receiverId) {
                    return next(new AppError('Parents can only message their own linked child.', 403));
                }
            } else if (!['STAFF', 'ADMIN'].includes(recRole)) {
                return next(new AppError('Parents can only message Staff, Admins, and their own child.', 403));
            }
        }
    }

    const message = await Message.create(messageData);
    const obj = typeof message.toJSON === 'function' ? message.toJSON() : { ...message };
    obj._id = obj.id;

    res.status(201).json({ status: 'success', data: { message: obj } });
});

exports.markAsRead = catchAsync(async (req, res, next) => {
    const message = await Message.findById(req.params.id);
    if (!message) return next(new AppError('Message not found', 404));

    const readBy = message.readBy || [];
    if (!readBy.includes(req.user._id)) {
        readBy.push(req.user._id);
        await Message.update({ id: message.id }, { readBy });
    }

    const updated = await Message.findById(req.params.id);
    const obj = typeof updated.toJSON === 'function' ? updated.toJSON() : { ...updated };
    obj._id = obj.id;

    res.status(200).json({ status: 'success', data: { message: obj } });
});

exports.getContacts = catchAsync(async (req, res, next) => {
    const { query } = req.query;

    let users = await User.findAll({ isActive: true, approvalStatus: 'APPROVED' });

    // Filter out self
    users = users.filter(u => u.id !== req.user._id);

    // Search filter
    if (query) {
        const q = query.toLowerCase();
        users = users.filter(u =>
            (u.fullName || '').toLowerCase().includes(q) ||
            (u.username || '').toLowerCase().includes(q)
        );
    }

    // Role-based filtering
    if (req.user.role === 'STUDENT') {
        users = users.filter(u => u.role !== 'STUDENT');
    } else if (req.user.role === 'PARENT') {
        const childDoc = req.user.linkedStudentId ? await Student.findById(req.user.linkedStudentId) : null;
        users = users.filter(u => {
            if (u.role === 'PARENT') return false;
            if (u.role === 'STUDENT') {
                return childDoc && childDoc.userId === u.id;
            }
            return ['STAFF', 'ADMIN'].includes(u.role);
        });
    }

    const result = users.slice(0, 50).map(u => {
        const obj = typeof u.toJSON === 'function' ? u.toJSON() : { ...u };
        return { _id: obj.id, fullName: obj.fullName, username: obj.username, role: obj.role, department: obj.department, companyId: obj.companyId, linkedStudentId: obj.linkedStudentId };
    });

    res.status(200).json({ status: 'success', results: result.length, data: { users: result } });
});

exports.markThreadAsRead = catchAsync(async (req, res, next) => {
    const { otherUserId, subject, type } = req.body;
    const userId = req.user._id;
    const baseSubject = (subject || '').replace(/^Re:\s*/i, '');

    // Fetch relevant messages
    let messages;
    if (type === 'ANNOUNCEMENT' || type === 'SYSTEM') {
        messages = await Message.scan().where('type').eq(type).exec();
        messages = messages.filter(m => {
            const mSubject = (m.subject || '').replace(/^Re:\s*/i, '');
            return mSubject.toLowerCase() === baseSubject.toLowerCase();
        });
    } else {
        messages = await Message.query('receiverId').eq(userId).using('ReceiverIndex').exec();
        messages = messages.filter(m => {
            const mSubject = (m.subject || '').replace(/^Re:\s*/i, '');
            return m.type === 'DIRECT' && m.senderId === otherUserId && mSubject.toLowerCase() === baseSubject.toLowerCase();
        });
    }

    // Mark as read
    for (const msg of messages) {
        const readBy = msg.readBy || [];
        if (!readBy.includes(userId)) {
            readBy.push(userId);
            await Message.update({ id: msg.id }, { readBy });
        }
    }

    res.status(200).json({ status: 'success' });
});

exports.getUnreadCount = catchAsync(async (req, res, next) => {
    const count = await Message.countUnread(req.user._id, req.user.role);

    res.status(200).json({ status: 'success', data: { count } });
});
