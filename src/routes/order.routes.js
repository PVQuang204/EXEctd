const express = require('express');
const orderController = require('../controllers/order.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', roleMiddleware('customer'), orderController.create);
router.get('/my', roleMiddleware('customer'), orderController.myOrders);
router.get('/restaurant', roleMiddleware('restaurant_owner'), orderController.restaurantOrders);
router.patch('/:id/status', roleMiddleware('restaurant_owner', 'admin'), orderController.updateStatus);
router.get('/stats/revenue', roleMiddleware('restaurant_owner'), orderController.revenue);
router.get('/stats/top-foods/:restaurantId', roleMiddleware('restaurant_owner'), orderController.topFoods);

module.exports = router;
