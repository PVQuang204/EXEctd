const express = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validateRequest = require('../middleware/validateRequest.middleware');
const { authLimiter } = require('../middleware/rateLimiter.middleware');

const router = express.Router();

router.post(
  '/register',
  authLimiter,
  validateRequest({
    fullName: { required: true, minLength: 2 },
    email: { required: true, type: 'email' },
    password: { required: true, minLength: 6 },
  }),
  authController.register
);

router.post(
  '/login',
  authLimiter,
  validateRequest({
    email: { required: true, type: 'email' },
    password: { required: true },
  }),
  authController.login
);
router.post('/refresh', authController.refresh);
router.post('/logout', authMiddleware, authController.logout);
router.get('/me', authMiddleware, authController.getMe);
router.put('/change-password', authMiddleware, authController.changePassword);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
