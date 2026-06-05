const express = require('express');
const restaurantController = require('../controllers/restaurant.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const upload = require('../middleware/upload.middleware');

const router = express.Router();

router.get('/nearby', restaurantController.nearby);
router.get('/:id', restaurantController.getById);

router.use(authMiddleware);
router.get('/owner/mine', roleMiddleware('restaurant_owner'), restaurantController.myRestaurants);
router.post(
  '/',
  roleMiddleware('restaurant_owner'),
  upload.fields([{ name: 'coverImage', maxCount: 1 }, { name: 'logo', maxCount: 1 }]),
  restaurantController.create
);
router.put(
  '/:id',
  roleMiddleware('restaurant_owner', 'admin'),
  upload.fields([{ name: 'coverImage', maxCount: 1 }, { name: 'logo', maxCount: 1 }]),
  restaurantController.update
);
router.patch('/:id/location', roleMiddleware('restaurant_owner'), restaurantController.updateLocation);
router.patch('/:id/approve', roleMiddleware('admin'), restaurantController.approve);
router.patch('/:id/reject', roleMiddleware('admin'), restaurantController.reject);

module.exports = router;
