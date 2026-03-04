const dynamoose = require('../config/dynamodb');
const { v4: uuidv4 } = require('uuid');

const departmentSchema = new dynamoose.Schema({
    id: {
        type: String,
        hashKey: true,
        default: () => uuidv4()
    },
    name: {
        type: String,
        required: true,
        index: { name: 'DeptNameIndex', type: 'global' }
    },
    code: {
        type: String,
        required: true,
        index: { name: 'DeptCodeIndex', type: 'global' }
    }
}, {
    timestamps: true
});

const Department = dynamoose.model('Department', departmentSchema);

// --- Static Methods ---

Department.findById = async function (id) {
    try { return await Department.get(id); } catch { return null; }
};

Department.findAll = async function () {
    const results = await Department.scan().exec();
    return results.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
};

module.exports = Department;
