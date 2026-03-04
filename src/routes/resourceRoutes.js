const express = require('express');
const resourceController = require('../controllers/resourceController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);

router.route('/')
    .get(resourceController.getResources)
    .post(
        authMiddleware.restrictTo('ADMIN', 'STAFF', 'COMPANY'),
        resourceController.uploadResource
    );

router.route('/:id')
    .delete(
        authMiddleware.restrictTo('ADMIN', 'STAFF', 'COMPANY'),
        resourceController.deleteResource
    );

module.exports = router;
