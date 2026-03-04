const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);

router.get('/',
    authMiddleware.restrictTo('ADMIN', 'STAFF'),
    dashboardController.getDashboardStats
);

router.get('/student',
    authMiddleware.restrictTo('STUDENT'),
    dashboardController.getStudentDashboard
);

router.get('/company',
    authMiddleware.restrictTo('COMPANY'),
    dashboardController.getCompanyDashboard
);

module.exports = router;
