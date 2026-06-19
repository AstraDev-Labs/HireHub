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
        enum: ['STUDENT', 'PARENT', 'COMPANY', 'STAFF', 'ADMIN', 'ALL']
    },
    subject: String,
    content: { type: String, required: true },
    type: {
        type: String,
        enum: ['DIRECT', 'ANNOUNCEMENT', 'SYSTEM'],
        default: 'DIRECT'
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

messageSchema.statics.findForUser = async function (userId, userRole) {
    // Get messages where user is receiver, sender, or target of announcement
    const [received, sent, relevantAnnouncements] = await Promise.all([
        this.find({ receiverId: userId }),
        this.find({ senderId: userId }),
        this.find({
            type: 'ANNOUNCEMENT',
            receiverRole: { $in: [userRole, 'ALL'] }
        })
    ]);

    // Merge, deduplicate by ID, and sort by createdAt desc
    const map = new Map();
    [...received, ...sent, ...relevantAnnouncements].forEach(m => {
        const obj = typeof m.toJSON === 'function' ? m.toJSON() : { ...m };
        map.set(obj.id, obj);
    });

    return [...map.values()].sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
    );
};

messageSchema.statics.countUnread = async function (userId, userRole) {
    const messages = await this.findForUser(userId, userRole);
    return messages.filter(m =>
        m.senderId !== userId && !(m.readBy || []).includes(userId)
    ).length;
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
