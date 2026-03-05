const express = require('express');
const router = express.Router();
const challengeController = require('../controllers/challengeController');
const { protect, restrictTo } = require('../controllers/authController');

// --- Challenges ---

router.route('/')
    .get(protect, challengeController.getAllChallenges)
    .post(protect, restrictTo('ADMIN', 'STAFF', 'COMPANY'), challengeController.createChallenge);

router.route('/:id')
    .get(protect, challengeController.getChallenge);

// --- Submissions ---

router.post('/submit', protect, restrictTo('STUDENT'), challengeController.submitSolution);
router.get('/submission/:id', protect, challengeController.getSubmissionStatus);

module.exports = router;
