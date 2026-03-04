const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Protect all routes
router.use(authMiddleware.protect);

// Public Key Management (accessible to all authenticated users)
router.patch('/update-public-key', userController.updatePublicKey);
router.get('/:id/public-key', userController.getUserPublicKey);

// Profile Management (accessible to all authenticated users)
router.get('/me', userController.getMe);
router.patch('/me', userController.updateMe);
router.patch('/change-password', userController.changePassword);

// Only Admin and Staff (HoD) can manage users
router.use(authMiddleware.restrictTo('ADMIN', 'STAFF'));

router.get('/pending', userController.getPendingUsers);
router.patch('/:id/approve', userController.approveUser);
router.patch('/:id/reject', userController.rejectUser);

module.exports = router;
