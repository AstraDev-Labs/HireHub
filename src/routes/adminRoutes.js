const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

router.get('/logs', protect, restrictTo('ADMIN'), adminController.getAuditLogs);

module.exports = router;
