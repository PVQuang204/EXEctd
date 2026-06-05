const express = require('express');
const paymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

const router = express.Router();

router.get('/vnpay/callback', paymentController.vnpayCallback);
router.get('/vnpay/ipn', paymentController.vnpayIpn);

router.use(authMiddleware);
router.post('/:orderId', roleMiddleware('customer'), paymentController.create);
router.patch('/:orderId/cod-confirm', roleMiddleware('restaurant_owner'), paymentController.confirmCOD);

module.exports = router;
