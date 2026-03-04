const express = require('express');
const authController = require('../controllers/authController');
const otpController = require('../controllers/otpController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authMiddleware.protect, authController.logout);
router.post('/refresh-token', authController.refreshToken);

// OTP Routes
router.post('/send-phone-otp', otpController.sendPhoneOTP);
router.post('/verify-phone-otp', otpController.verifyPhoneOTP);

module.exports = router;
