const express = require('express');
const reviewController = require('../controllers/review.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const upload = require('../middleware/upload.middleware');

const router = express.Router();

// Admin: list all reviews (must be BEFORE /:restaurantId to avoid collision)
router.get('/admin/all', authMiddleware, roleMiddleware('admin'), reviewController.adminList);

// Public: list reviews for a restaurant
router.get('/:restaurantId', reviewController.list);

// Customer: create review
router.post('/', authMiddleware, roleMiddleware('customer'), upload.array('images', 5), reviewController.create);

// Customer: update review
router.put('/:id', authMiddleware, roleMiddleware('customer'), upload.array('images', 5), reviewController.update);

// Customer: delete review
router.delete('/:id', authMiddleware, roleMiddleware('customer'), reviewController.delete);

module.exports = router;
