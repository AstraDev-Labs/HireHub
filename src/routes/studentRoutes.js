const express = require('express');
const studentController = require('../controllers/studentController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Public search route
router.get('/search', studentController.searchStudents);

// All routes are protected
router.use(authMiddleware.protect);

// Student Profile Completion
router.post('/complete-profile', authMiddleware.restrictTo('STUDENT'), studentController.completeProfile);
router.get('/my-status', authMiddleware.restrictTo('STUDENT'), studentController.getMyStatus);
router.get('/my-child-status', authMiddleware.restrictTo('PARENT'), studentController.getMyChildStatus);
router.get('/my-profile', authMiddleware.restrictTo('STUDENT'), studentController.getMyProfile);

router.route('/')
    .get(authMiddleware.restrictTo('ADMIN', 'STAFF', 'COMPANY'), studentController.getAllStudents)
    .post(authMiddleware.restrictTo('ADMIN', 'STAFF'), studentController.createStudent);

router.route('/:id')
    .get(authMiddleware.restrictTo('ADMIN', 'STAFF', 'STUDENT', 'COMPANY'), studentController.getStudent)
    .put(authMiddleware.restrictTo('ADMIN', 'STAFF', 'STUDENT'), studentController.updateStudent)
    .delete(authMiddleware.restrictTo('ADMIN'), studentController.deleteStudent);

module.exports = router;
