const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

router.use(protect);

router.post('/schedule', restrictTo('COMPANY_HR', 'ADMIN'), interviewController.createInterviewSlots);

router.get('/company', restrictTo('COMPANY_HR', 'ADMIN'), interviewController.getCompanyInterviews);

router.get('/student', restrictTo('STUDENT'), interviewController.getStudentInterviews);

router.get('/all', restrictTo('ADMIN', 'STAFF'), interviewController.getAllInterviews);

router.patch('/:id', restrictTo('COMPANY_HR', 'ADMIN', 'STAFF'), interviewController.updateInterviewStatus);

router.delete('/:id', restrictTo('COMPANY_HR', 'ADMIN'), interviewController.deleteInterview);

module.exports = router;
