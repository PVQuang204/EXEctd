const express = require('express');
const paymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

const router = express.Router();

// MoMo callbacks (public — no auth)
router.get('/momo/callback', paymentController.momoCallback);
router.post('/momo/ipn', paymentController.momoIpn);

// VNPay callbacks (public — no auth)
router.get('/vnpay/return', paymentController.vnpayReturn);
router.get('/vnpay/ipn', paymentController.vnpayIpn);

// Protected routes
router.use(authMiddleware);
router.post('/:orderId', roleMiddleware('customer'), paymentController.create);
router.patch('/:orderId/cod-confirm', roleMiddleware('restaurant_owner'), paymentController.confirmCOD);

module.exports = router;
