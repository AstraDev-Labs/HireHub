const dynamoose = require('../config/dynamodb');
const { v4: uuidv4 } = require('uuid');

const studentSchema = new dynamoose.Schema({
    id: {
        type: String,
        hashKey: true,
        default: () => uuidv4()
    },
    userId: {
        type: String,
        required: true,
        index: { name: 'UserIdIndex', type: 'global' }
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        index: { name: 'StudentEmailIndex', type: 'global' }
    },
    phone: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    batchYear: {
        type: Number,
        required: true
    },
    cgpa: {
        type: Number,
        required: true
    },
    placementStatus: {
        type: String,
        enum: ['PLACED', 'NOT_PLACED'],
        default: 'NOT_PLACED'
    },
    // --- Resume Builder Fields ---
    skills: {
        type: Array,
        schema: [String],
        default: []
    },
    education: {
        type: Array,
        schema: [{
            type: Object,
            schema: {
                id: { type: String, default: () => uuidv4() },
                institution: { type: String, required: true },
                degree: { type: String, required: true },
                fieldOfStudy: String,
                startDate: String,
                endDate: String,
                grade: String
            }
        }],
        default: []
    },
    experience: {
        type: Array,
        schema: [{
            type: Object,
            schema: {
                id: { type: String, default: () => uuidv4() },
                title: { type: String, required: true },
                company: { type: String, required: true },
                location: String,
                startDate: String,
                endDate: String,
                current: { type: Boolean, default: false },
                description: String
            }
        }],
        default: []
    },
    projects: {
        type: Array,
        schema: [{
            type: Object,
            schema: {
                id: { type: String, default: () => uuidv4() },
                title: { type: String, required: true },
                description: String,
                link: String,
                technologies: { type: Array, schema: [String] }
            }
        }],
        default: []
    },
    resumeLink: {
        type: String // A pre-existing uploaded PDF, if any
    },
    socialLinks: {
        type: Object,
        schema: {
            github: String,
            linkedin: String,
            portfolio: String
        },
        default: {}
    }
}, {
    timestamps: true
});

const Student = dynamoose.model('Student', studentSchema);

// --- Static Methods ---

Student.findById = async function (id) {
    try { return await Student.get(id); } catch { return null; }
};

Student.findByUserId = async function (userId) {
    const results = await Student.query('userId').eq(userId).using('UserIdIndex').exec();
    return results.length > 0 ? results[0] : null;
};

Student.findAll = async function (filter = {}) {
    let scan = Student.scan();
    for (const [key, value] of Object.entries(filter)) {
        scan = scan.where(key).eq(value);
    }
    return scan.exec();
};

Student.countAll = async function (filter = {}) {
    const results = await Student.findAll(filter);
    return results.length;
};

Student.searchByName = async function (query) {
    return Student.scan().where('name').contains(query).attributes(['name', 'email', 'department', 'batchYear', 'phone', 'id']).exec();
};

module.exports = Student;
