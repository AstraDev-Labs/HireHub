const express = require('express');
const departmentController = require('../controllers/departmentController');
const authMiddleware = require('../middlewares/authMiddleware'); // Fixed: was authController

const router = express.Router();

// Publicly accessible for Registration dropdown
router.get('/', departmentController.getAllDepartments);

// Admin only for management
router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('ADMIN'));

router.post('/', departmentController.createDepartment);
router.patch('/:id', departmentController.updateDepartment);
router.delete('/:id', departmentController.deleteDepartment);

module.exports = router;
