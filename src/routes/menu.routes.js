const express = require('express');
const menuController = require('../controllers/menu.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const upload = require('../middleware/upload.middleware');

const router = express.Router();

router.get('/:restaurantId/categories', menuController.listCategories);
router.get('/:restaurantId/foods', menuController.listFoods);
router.get('/:restaurantId/combos', menuController.listCombos);
router.get('/:restaurantId/promotions', menuController.listPromotions);

router.use(authMiddleware, roleMiddleware('restaurant_owner'));
router.post('/:restaurantId/categories', menuController.createCategory);
router.delete('/:restaurantId/categories/:id', menuController.deleteCategory);
router.post('/foods', upload.single('image'), menuController.createFood);
router.put('/foods/:id', upload.single('image'), menuController.updateFood);
router.delete('/foods/:id', menuController.deleteFood);
router.post('/combos', upload.single('image'), menuController.createCombo);
router.delete('/combos/:id', menuController.deleteCombo);
router.post('/promotions', menuController.createPromotion);
router.delete('/promotions/:id', menuController.deletePromotion);

module.exports = router;
