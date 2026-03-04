const express = require('express');
const companyController = require('../controllers/companyController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Public routes (for dropdowns)
router.get('/', companyController.getAllCompanies);
router.get('/:id', companyController.getCompany);

// Protected routes
router.use(authMiddleware.protect);

// Admin/Staff only routes
router.post('/', authMiddleware.restrictTo('ADMIN', 'STAFF'), companyController.createCompany);

// Company Staff routes
router.get('/my/profile', authMiddleware.restrictTo('COMPANY'), companyController.getMyCompany);
router.patch('/my/profile', authMiddleware.restrictTo('COMPANY'), companyController.updateCompanyProfile);

// Round Management (Company Staff)
router.post('/rounds', authMiddleware.restrictTo('COMPANY'), companyController.createRound);
router.get('/my/rounds', authMiddleware.restrictTo('COMPANY'), companyController.getRounds);
router.get('/:companyId/rounds', companyController.getRounds);
router.post('/:id/apply', authMiddleware.restrictTo('STUDENT'), companyController.applyToCompany);
router.patch('/rounds/:id', authMiddleware.restrictTo('COMPANY'), companyController.updateRound);
router.delete('/rounds/:id', authMiddleware.restrictTo('COMPANY'), companyController.deleteRound);
router.post('/rounds/evaluate', authMiddleware.restrictTo('COMPANY'), companyController.evaluateCandidates);
router.get('/rounds/:roundId/students', authMiddleware.restrictTo('COMPANY'), companyController.getRoundStudents);
router.post('/announce', authMiddleware.restrictTo('COMPANY'), companyController.sendAnnouncement);

module.exports = router;
