const dynamoose = require('../config/dynamodb');
const { v4: uuidv4 } = require('uuid');

const submissionSchema = new dynamoose.Schema({
    id: {
        type: String,
        hashKey: true,
        default: () => uuidv4()
    },
    challengeId: {
        type: String,
        required: true,
        index: { name: 'ChallengeSubmissionIndex', type: 'global' }
    },
    studentId: {
        type: String,
        required: true,
        index: { name: 'StudentSubmissionIndex', type: 'global' }
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
        type: Object,
        schema: {
            stdout: String,
            stderr: String,
            compile_output: String,
            time: Number,
            memory: Number,
            status_id: Number
        }
    }
}, {
    timestamps: true
});

const Submission = dynamoose.model('Submission', submissionSchema);

Submission.findById = async function (id) {
    try { return await Submission.get(id); } catch { return null; }
};

Submission.findAll = async function (filter = {}) {
    let scan = Submission.scan();
    for (const [key, value] of Object.entries(filter)) {
        scan = scan.where(key).eq(value);
    }
    return scan.exec();
};

Submission.countAll = async function () {
    const results = await Submission.scan().exec();
    return results.length;
};

module.exports = Submission;
