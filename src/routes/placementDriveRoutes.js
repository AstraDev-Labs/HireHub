const express = require('express');
const placementDriveController = require('../controllers/placementDriveController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);

// All authenticated users can view drives
router.get('/', placementDriveController.getAllDrives);
router.get('/:id', placementDriveController.getDrive);

// Only Admin/Staff can create/update/delete
router.post('/', authMiddleware.restrictTo('ADMIN', 'STAFF', 'COMPANY'), placementDriveController.createDrive);
router.patch('/:id', authMiddleware.restrictTo('ADMIN', 'STAFF', 'COMPANY'), placementDriveController.updateDrive);
router.delete('/:id', authMiddleware.restrictTo('ADMIN', 'STAFF', 'COMPANY'), placementDriveController.deleteDrive);

module.exports = router;
