const express = require('express');
const chatController = require('../controllers/chat.controller');
const authMiddleware = require('../middleware/auth.middleware');
const chatRateLimiter = require('../middleware/chatRateLimiter.middleware');

const router = express.Router();

router.use(authMiddleware);
router.use(chatRateLimiter);

router.post('/conversations/:restaurantId', chatController.openOrGet);
router.get('/conversations', chatController.listMine);
router.get('/conversations/:id/messages', chatController.listMessages);
router.post('/conversations/:id/messages', chatController.send);
router.post('/conversations/:id/read', chatController.read);
router.post('/conversations/:id/close', chatController.close);
router.delete('/conversations/:id/messages/:messageId', chatController.deleteMessage);

module.exports = router;
