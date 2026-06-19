const express = require('express');
const paymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

const router = express.Router();

// PayOS callbacks (public — no auth, called by PayOS server)
router.post('/payos/webhook', paymentController.payosWebhook);
router.get('/payos/return', paymentController.payosReturn);
router.get('/payos/cancel', paymentController.payosCancel);

// Protected routes
router.use(authMiddleware);
router.post('/:orderId', roleMiddleware('customer'), paymentController.create);
router.patch('/:orderId/cod-confirm', roleMiddleware('restaurant_owner'), paymentController.confirmCOD);

module.exports = router;
