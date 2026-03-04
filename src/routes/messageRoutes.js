const express = require('express');
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);

router.get('/', messageController.getMessages);
router.post('/', messageController.sendMessage);
router.get('/unread-count', messageController.getUnreadCount);
router.patch('/read-thread', messageController.markThreadAsRead);
router.patch('/:id/read', messageController.markAsRead);
router.get('/contacts', messageController.getContacts);

module.exports = router;
