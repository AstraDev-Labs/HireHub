const express = require('express');
const placementController = require('../controllers/placementController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);

router.route('/')
    .post(
        authMiddleware.restrictTo('ADMIN', 'STAFF', 'COMPANY'),
        placementController.updatePlacementStatus
    );

// Application Approval Routes (Admin/Staff)
router.get('/applications', authMiddleware.restrictTo('ADMIN', 'STAFF'), placementController.getAllApplications);
router.patch('/applications/:id/approve', authMiddleware.restrictTo('ADMIN', 'STAFF'), placementController.approveApplication);

router.route('/:studentId')
    .get(
        authMiddleware.restrictTo('ADMIN', 'STAFF', 'STUDENT'),
        placementController.getStudentPlacementStatus
    );

module.exports = router;
