const express = require('express');
const reviewController = require('../controllers/review.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const upload = require('../middleware/upload.middleware');

const router = express.Router();

// Public: list reviews for a restaurant
router.get('/:restaurantId', reviewController.list);

// Customer: create review
router.post('/', authMiddleware, roleMiddleware('customer'), upload.array('images', 5), reviewController.create);

// Admin: list all reviews
router.get('/admin/all', authMiddleware, roleMiddleware('admin'), reviewController.adminList);

module.exports = router;
