const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

router.use(protect);

router.post('/schedule', restrictTo('COMPANY', 'ADMIN', 'STAFF'), interviewController.createInterviewSlots);

router.get('/company', restrictTo('COMPANY', 'ADMIN', 'STAFF'), interviewController.getCompanyInterviews);

router.get('/student', restrictTo('STUDENT'), interviewController.getStudentInterviews);

router.get('/all', restrictTo('ADMIN', 'STAFF'), interviewController.getAllInterviews);

router.patch('/:id', restrictTo('COMPANY', 'ADMIN', 'STAFF'), interviewController.updateInterviewStatus);

router.delete('/:id', restrictTo('COMPANY', 'ADMIN', 'STAFF'), interviewController.deleteInterview);

module.exports = router;
