const express = require('express');
const authController = require('../controllers/authController');
const otpController = require('../controllers/otpController');
const authMiddleware = require('../middlewares/authMiddleware');
const { accountCreationLimiter, otpLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

router.post('/internal-sync', authController.internalSync);
router.delete('/sync-delete', authController.syncDelete);
router.post('/log-stream', authController.logStreamWebhook);
router.post('/sync', authMiddleware.protect, authController.syncUser);
router.patch('/onboard', authMiddleware.protect, authController.onboard);

module.exports = router;
