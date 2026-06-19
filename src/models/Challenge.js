const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const challengeSchema = new mongoose.Schema({
    id: {
        type: String,
        default: uuidv4,
        index: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        default: 'Medium'
    },
    topicTags: {
        type: [String]
    },
    constraints: String,
    testCases: [{
        input: String,
        output: String,
        isSample: { type: Boolean, default: false }
    }],
    codeSnippets: [{
        language: String,
        code: String
    }],
    createdBy: {
        type: String,
        required: true,
        index: true
    }
}, {
    timestamps: true
});

challengeSchema.statics.findById = async function (id) {
    try { return await this.findOne({ id }); } catch { return null; }
};

challengeSchema.statics.findAll = async function (filter = {}) {
    return this.find(filter);
};

challengeSchema.statics.countAll = async function () {
    return this.countDocuments();
};

const Challenge = mongoose.model('Challenge', challengeSchema);

module.exports = Challenge;
