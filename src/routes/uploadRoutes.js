const express = require('express');
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Protect all routes after this middleware
router.use(authMiddleware.protect);

router.post('/', (req, res, next) => {
    uploadController.uploadFile(req, res, (err) => {
        if (err) {
            console.error('❌ Multer Error during upload:', err);
            return next(err);
        }
        next();
    });
}, uploadController.uploadHandler);

module.exports = router;
