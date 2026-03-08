const express = require('express');
const router = express.Router();
const challengeController = require('../controllers/challengeController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

// --- Challenges ---

router.route('/')
    .get(protect, restrictTo('ADMIN', 'STAFF', 'STUDENT'), challengeController.getAllChallenges)
    .post(protect, restrictTo('ADMIN', 'STAFF'), challengeController.createChallenge);

router.route('/:id')
    .get(protect, restrictTo('ADMIN', 'STAFF', 'STUDENT'), challengeController.getChallenge)
    .patch(protect, restrictTo('ADMIN', 'STAFF'), challengeController.updateChallenge);

// --- Submissions ---

router.post('/submit', protect, restrictTo('STUDENT'), challengeController.submitSolution);
router.get('/:id/submissions', protect, restrictTo('ADMIN', 'STAFF'), challengeController.getChallengeSubmissions);
router.get('/submission/:id', protect, restrictTo('ADMIN', 'STAFF', 'STUDENT'), challengeController.getSubmissionStatus);

module.exports = router;
