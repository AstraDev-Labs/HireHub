const Department = require('../models/Department');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.getAllDepartments = catchAsync(async (req, res) => {
    const departments = await Department.findAll();
    const result = departments.map(d => {
        const obj = typeof d.toJSON === 'function' ? d.toJSON() : { ...d };
        obj._id = obj.id;
        return obj;
    });

    res.status(200).json({
        status: 'success',
        results: result.length,
        data: { departments: result }
    });
});

exports.createDepartment = catchAsync(async (req, res) => {
    // Uppercase name and code
    if (req.body.name) req.body.name = req.body.name.toUpperCase().trim();
    if (req.body.code) req.body.code = req.body.code.toUpperCase().trim();

    const newDepartment = await Department.create(req.body);
    const obj = typeof newDepartment.toJSON === 'function' ? newDepartment.toJSON() : { ...newDepartment };
    obj._id = obj.id;

    res.status(201).json({ status: 'success', data: { department: obj } });
});

exports.updateDepartment = catchAsync(async (req, res) => {
    const existing = await Department.findById(req.params.id);
    if (!existing) return next(new AppError('No department found with that ID', 404));

    if (req.body.name) req.body.name = req.body.name.toUpperCase().trim();
    if (req.body.code) req.body.code = req.body.code.toUpperCase().trim();

    await Department.update({ id: req.params.id }, req.body);
    const department = await Department.findById(req.params.id);
    const obj = typeof department.toJSON === 'function' ? department.toJSON() : { ...department };
    obj._id = obj.id;

    res.status(200).json({ status: 'success', data: { department: obj } });
});

exports.deleteDepartment = catchAsync(async (req, res) => {
    const department = await Department.findById(req.params.id);
    if (!department) return next(new AppError('No department found with that ID', 404));

    await Department.delete({ id: req.params.id });
    res.status(204).json({ status: 'success', data: null });
});


