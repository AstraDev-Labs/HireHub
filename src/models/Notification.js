const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const notificationSchema = new mongoose.Schema({
    id: {
        type: String,
        default: uuidv4,
        index: true
    },
    userId: {
        type: String,
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['APPLICATION_STATUS', 'ROUND_ANNOUNCEMENT', 'REGISTRATION_APPROVED', 'REGISTRATION_REJECTED', 'NEW_APPLICATION', 'GENERAL'],
        default: 'GENERAL'
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: String,
    read: { type: Boolean, default: false }
}, {
    timestamps: true
});

notificationSchema.statics.findByUserId = async function (userId) {
    return this.find({ userId });
};

notificationSchema.statics.findById = async function (id) {
    try { return await this.findOne({ id }); } catch { return null; }
};

// Create a notification
notificationSchema.statics.createNotification = async function ({ userId, type, title, message, link }) {
    return this.create({ userId, type, title, message, link });
};

// Create notifications for multiple users
notificationSchema.statics.createBulk = async function (notifications) {
    return this.insertMany(notifications);
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
