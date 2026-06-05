const express = require('express');
const reviewController = require('../controllers/review.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const upload = require('../middleware/upload.middleware');

const router = express.Router();

router.get('/:restaurantId', reviewController.list);

router.use(authMiddleware, roleMiddleware('customer'));
router.post('/', upload.array('images', 5), reviewController.create);

module.exports = router;
