const dynamoose = require('../config/dynamodb');
const { v4: uuidv4 } = require('uuid');

const challengeSchema = new dynamoose.Schema({
    id: {
        type: String,
        hashKey: true,
        default: () => uuidv4()
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
        type: Array,
        schema: [String]
    },
    constraints: String,
    testCases: {
        type: Array,
        schema: [{
            type: Object,
            schema: {
                input: String,
                output: String,
                isSample: { type: Boolean, default: false }
            }
        }]
    },
    codeSnippets: {
        type: Array,
        schema: [{
            type: Object,
            schema: {
                language: String,
                code: String
            }
        }]
    },
    createdBy: {
        type: String,
        required: true,
        index: { name: 'CreatedByIndex', type: 'global' }
    }
}, {
    timestamps: true
});

const Challenge = dynamoose.model('Challenge', challengeSchema);

Challenge.findById = async function (id) {
    try { return await Challenge.get(id); } catch { return null; }
};

Challenge.findAll = async function (filter = {}) {
    let scan = Challenge.scan();
    for (const [key, value] of Object.entries(filter)) {
        scan = scan.where(key).eq(value);
    }
    return scan.exec();
};

Challenge.countAll = async function () {
    const results = await Challenge.scan().exec();
    return results.length;
};

module.exports = Challenge;
