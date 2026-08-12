const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const messageSchema = new mongoose.Schema({
    id: {
        type: String,
        default: uuidv4,
        index: true
    },
    senderId: {
        type: String,
        required: true,
        index: true
    },
    senderName: { type: String, required: true },
    senderRole: { type: String, required: true },
    receiverId: {
        type: String,
        index: true
    },
    receiverRole: {
        type: String,
        enum: ['STUDENT', 'PARENT', 'COMPANY', 'STAFF', 'ADMIN', 'ALL'],
        index: true
    },
    subject: String,
    content: { type: String, required: true },
    type: {
        type: String,
        enum: ['DIRECT', 'ANNOUNCEMENT', 'SYSTEM'],
        default: 'DIRECT',
        index: true
    },
    attachments: {
        type: [{
            url: String,
            filename: String,
            fileType: String
        }],
        default: []
    },
    readBy: {
        type: [String],
        default: []
    },
    isEncrypted: { type: Boolean, default: false }
}, {
    timestamps: true
});

// --- Static Methods ---

messageSchema.statics.findById = async function (id) {
    try { return await this.findOne({ id }); } catch { return null; }
};

messageSchema.statics.findForUser = async function (userId, userRole, { skip = 0, limit = 0, sort = { createdAt: -1 } } = {}) {
    return this.find({
        $or: [
            { receiverId: userId },
            { senderId: userId },
            { type: 'ANNOUNCEMENT', receiverRole: { $in: [userRole, 'ALL'] } }
        ]
    }).sort(sort).skip(skip).limit(limit);
};

messageSchema.statics.countUnread = async function (userId, userRole) {
    return this.countDocuments({
        $or: [
            { receiverId: userId },
            { type: 'ANNOUNCEMENT', receiverRole: { $in: [userRole, 'ALL'] } }
        ],
        senderId: { $ne: userId },
        readBy: { $ne: userId }
    });
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
