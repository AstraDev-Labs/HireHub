const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const submissionSchema = new mongoose.Schema({
    id: {
        type: String,
        default: uuidv4,
        index: true
    },
    challengeId: {
        type: String,
        required: true,
        index: true
    },
    studentId: {
        type: String,
        required: true,
        index: true
    },
    language: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Memory Limit Exceeded', 'Runtime Error', 'Compilation Error', 'Pending'],
        default: 'Pending'
    },
    executionResult: {
        stdout: String,
        stderr: String,
        compile_output: String,
        time: Number,
        memory: Number,
        status_id: Number
    }
}, {
    timestamps: true
});

submissionSchema.statics.findById = async function (id) {
    try { return await this.findOne({ id }); } catch { return null; }
};

submissionSchema.statics.findAll = async function (filter = {}) {
    return this.find(filter);
};

submissionSchema.statics.countAll = async function () {
    return this.countDocuments();
};

const Submission = mongoose.model('Submission', submissionSchema);

module.exports = Submission;
