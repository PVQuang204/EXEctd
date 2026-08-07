const express = require('express');
const aiController = require('../controllers/ai.controller');
const authMiddleware = require('../middleware/auth.middleware');
const rateLimiter = require('../middleware/rateLimiter.middleware');

const router = express.Router();

router.use(authMiddleware, rateLimiter.aiLimiter);
router.post('/suggest', aiController.suggest);
router.post('/chat', aiController.chat);

module.exports = router;
