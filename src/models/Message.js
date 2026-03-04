const dynamoose = require('../config/dynamodb');
const { v4: uuidv4 } = require('uuid');

const messageSchema = new dynamoose.Schema({
    id: {
        type: String,
        hashKey: true,
        default: () => uuidv4()
    },
    senderId: {
        type: String,
        required: true,
        index: { name: 'SenderIndex', type: 'global' }
    },
    senderName: { type: String, required: true },
    senderRole: { type: String, required: true },
    receiverId: {
        type: String,
        index: { name: 'ReceiverIndex', type: 'global' }
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
        type: Array,
        schema: [{ type: Object, schema: { url: String, filename: String, fileType: String } }],
        default: []
    },
    readBy: {
        type: Array,
        schema: [String],
        default: []
    },
    isEncrypted: { type: Boolean, default: false }
}, {
    timestamps: true
});

const Message = dynamoose.model('Message', messageSchema);

// --- Static Methods ---

Message.findById = async function (id) {
    try { return await Message.get(id); } catch { return null; }
};

Message.findForUser = async function (userId, userRole) {
    // Get messages where user is receiver, sender, or target of announcement
    const [received, sent] = await Promise.all([
        Message.query('receiverId').eq(userId).using('ReceiverIndex').exec(),
        Message.query('senderId').eq(userId).using('SenderIndex').exec()
    ]);

    // Also get announcements for user's role
    const announcements = await Message.scan()
        .where('type').eq('ANNOUNCEMENT')
        .exec();

    const relevantAnnouncements = announcements.filter(
        a => a.receiverRole === userRole || a.receiverRole === 'ALL'
    );

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

Message.countUnread = async function (userId, userRole) {
    const messages = await Message.findForUser(userId, userRole);
    return messages.filter(m =>
        m.senderId !== userId && !(m.readBy || []).includes(userId)
    ).length;
};

module.exports = Message;
