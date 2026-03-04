const dynamoose = require('../config/dynamodb');
const { v4: uuidv4 } = require('uuid');

const notificationSchema = new dynamoose.Schema({
    id: {
        type: String,
        hashKey: true,
        default: () => uuidv4()
    },
    userId: {
        type: String,
        required: true,
        index: { name: 'UserNotificationIndex', type: 'global' }
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

const Notification = dynamoose.model('Notification', notificationSchema);

Notification.findByUserId = async function (userId) {
    return Notification.query('userId').eq(userId).using('UserNotificationIndex').exec();
};

Notification.findById = async function (id) {
    try { return await Notification.get(id); } catch { return null; }
};

// Create a notification
Notification.createNotification = async function ({ userId, type, title, message, link }) {
    return Notification.create({ userId, type, title, message, link });
};

// Create notifications for multiple users
Notification.createBulk = async function (notifications) {
    const results = [];
    for (const n of notifications) {
        results.push(await Notification.create(n));
    }
    return results;
};

module.exports = Notification;
