const Notification = require('../models/Notification');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// Get all notifications for the logged-in user
exports.getMyNotifications = catchAsync(async (req, res) => {
    const notifications = await Notification.findByUserId(req.user._id);

    // Sort by createdAt descending
    const sorted = notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Add _id alias
    const result = sorted.map(n => {
        const obj = typeof n.toJSON === 'function' ? n.toJSON() : { ...n };
        obj._id = obj.id;
        return obj;
    });

    res.status(200).json({ status: 'success', data: { notifications: result } });
});

// Get unread count
exports.getUnreadCount = catchAsync(async (req, res) => {
    const notifications = await Notification.findByUserId(req.user._id);
    const unreadCount = notifications.filter(n => !n.read).length;
    res.status(200).json({ status: 'success', data: { unreadCount } });
});

// Mark a single notification as read
exports.markAsRead = catchAsync(async (req, res, next) => {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return next(new AppError('Notification not found', 404));
    if (notification.userId !== req.user._id) return next(new AppError('Unauthorized', 403));

    await Notification.update({ id: notification.id }, { read: true });
    res.status(200).json({ status: 'success', message: 'Marked as read' });
});

// Mark all as read
exports.markAllAsRead = catchAsync(async (req, res) => {
    const notifications = await Notification.findByUserId(req.user._id);
    const unread = notifications.filter(n => !n.read);

    for (const n of unread) {
        await Notification.update({ id: n.id }, { read: true });
    }

    res.status(200).json({ status: 'success', message: `Marked ${unread.length} as read` });
});

// Delete a notification
exports.deleteNotification = catchAsync(async (req, res, next) => {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return next(new AppError('Notification not found', 404));
    if (notification.userId !== req.user._id) return next(new AppError('Unauthorized', 403));

    await Notification.delete({ id: notification.id });
    res.status(200).json({ status: 'success', message: 'Deleted' });
});
