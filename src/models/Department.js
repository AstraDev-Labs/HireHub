const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const departmentSchema = new mongoose.Schema({
    id: {
        type: String,
        default: () => uuidv4(),
        index: true
    },
    name: {
        type: String,
        required: true,
        index: true
    },
    code: {
        type: String,
        required: true,
        index: true
    }
}, {
    timestamps: true
});

// --- Static Methods ---

departmentSchema.statics.findById = async function (id) {
    try { return await this.findOne({ id }); } catch { return null; }
};

departmentSchema.statics.findAll = async function () {
    const results = await this.find();
    return results.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
};

const Department = mongoose.model('Department', departmentSchema);

module.exports = Department;
