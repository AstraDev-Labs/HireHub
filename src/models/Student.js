const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const studentEducationSchema = new mongoose.Schema({
    id: { type: String, default: uuidv4 },
    institution: { type: String, required: true },
    degree: { type: String, required: true },
    fieldOfStudy: String,
    startDate: String,
    endDate: String,
    grade: String
}, { _id: false });

const studentExperienceSchema = new mongoose.Schema({
    id: { type: String, default: uuidv4 },
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: String,
    startDate: String,
    endDate: String,
    current: { type: Boolean, default: false },
    description: String
}, { _id: false });

const studentProjectSchema = new mongoose.Schema({
    id: { type: String, default: uuidv4 },
    title: { type: String, required: true },
    description: String,
    link: String,
    technologies: [String]
}, { _id: false });

const studentSchema = new mongoose.Schema({
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
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        index: true
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
    skills: {
        type: [String],
        default: []
    },
    education: {
        type: [studentEducationSchema],
        default: []
    },
    experience: {
        type: [studentExperienceSchema],
        default: []
    },
    projects: {
        type: [studentProjectSchema],
        default: []
    },
    resumeLink: {
        type: String
    },
    socialLinks: {
        github: String,
        linkedin: String,
        portfolio: String
    }
}, {
    timestamps: true
});

// --- Static Methods ---

studentSchema.statics.findById = async function (id) {
    try { return await this.findOne({ id }); } catch { return null; }
};

studentSchema.statics.findByUserId = async function (userId) {
    return this.findOne({ userId });
};

studentSchema.statics.findAll = async function (filter = {}) {
    return this.find(filter);
};

studentSchema.statics.countAll = async function (filter = {}) {
    return this.countDocuments(filter);
};

studentSchema.statics.searchByName = async function (query) {
    return this.find({ name: { $regex: query, $options: 'i' } })
        .select('name email department batchYear phone id');
};

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
