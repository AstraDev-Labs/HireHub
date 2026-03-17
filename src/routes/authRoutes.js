const express = require('express');
const authController = require('../controllers/authController');
const otpController = require('../controllers/otpController');
const authMiddleware = require('../middlewares/authMiddleware');
const { accountCreationLimiter, otpLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

router.post('/register', accountCreationLimiter, authController.register);
router.get('/key', authController.getPublicKey);
router.post('/login', authController.login);
router.post('/logout', authMiddleware.protect, authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);

// OTP Routes
router.post('/send-phone-otp', otpLimiter, otpController.sendPhoneOTP);
router.post('/verify-phone-otp', otpLimiter, otpController.verifyPhoneOTP);

module.exports = router;
