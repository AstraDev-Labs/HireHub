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
router.post('/rounds', authMiddleware.restrictTo('COMPANY', 'ADMIN', 'STAFF'), companyController.createRound);
router.get('/my/rounds', authMiddleware.restrictTo('COMPANY'), companyController.getRounds);
router.get('/:companyId/rounds', companyController.getRounds);
router.post('/:id/apply', authMiddleware.restrictTo('STUDENT'), companyController.applyToCompany);
router.patch('/rounds/:id', authMiddleware.restrictTo('COMPANY', 'ADMIN', 'STAFF'), companyController.updateRound);
router.delete('/rounds/:id', authMiddleware.restrictTo('COMPANY', 'ADMIN', 'STAFF'), companyController.deleteRound);
router.post('/rounds/evaluate', authMiddleware.restrictTo('COMPANY', 'ADMIN', 'STAFF'), companyController.evaluateCandidates);
router.get('/rounds/:roundId/students', authMiddleware.restrictTo('COMPANY', 'ADMIN', 'STAFF'), companyController.getRoundStudents);
router.post('/announce', authMiddleware.restrictTo('COMPANY', 'ADMIN', 'STAFF'), companyController.sendAnnouncement);

module.exports = router;
