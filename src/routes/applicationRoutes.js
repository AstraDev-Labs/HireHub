const express = require('express');
const applicationController = require('../controllers/applicationController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);

// Student routes
router.post('/', authMiddleware.restrictTo('STUDENT'), applicationController.applyToDrive);
router.get('/my-applications', authMiddleware.restrictTo('STUDENT'), applicationController.getMyApplications);
router.patch('/:id/withdraw', authMiddleware.restrictTo('STUDENT'), applicationController.withdrawApplication);

// Company/Admin routes
router.get('/drive/:driveId', authMiddleware.restrictTo('ADMIN', 'STAFF', 'COMPANY'), applicationController.getDriveApplicants);
router.patch('/:id/status', authMiddleware.restrictTo('ADMIN', 'STAFF', 'COMPANY'), applicationController.updateApplicationStatus);

module.exports = router;
