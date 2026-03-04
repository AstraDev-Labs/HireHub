const express = require('express');
const offerLetterController = require('../controllers/offerLetterController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);

router.get('/', offerLetterController.getOffers);
router.post('/', authMiddleware.restrictTo('ADMIN', 'STAFF', 'COMPANY'), offerLetterController.issueOffer);
router.patch('/:id', authMiddleware.restrictTo('ADMIN', 'STAFF', 'COMPANY'), offerLetterController.updateOffer);
router.delete('/:id', authMiddleware.restrictTo('ADMIN', 'STAFF'), offerLetterController.deleteOffer);

module.exports = router;
