const menuService = require('../services/menu.service');
const asyncHandler = require('../utils/asyncHandler');

exports.validateCart = asyncHandler(async (req, res) => {
  const { restaurantId, items } = req.body;
  if (!restaurantId || !items || !Array.isArray(items)) {
    return res.status(400).json({ success: false, message: 'Invalid cart data' });
  }

  const unavailable = [];
  const insufficientStock = [];

  for (const item of items) {
    const food = await menuService.getFoodById(item.foodId);
    if (!food || !food.isAvailable) {
      unavailable.push({ foodId: item.foodId, name: item.name });
    } else if (food.restaurantId.toString() !== restaurantId) {
      unavailable.push({ foodId: item.foodId, name: item.name, reason: 'wrong_restaurant' });
    } else if (food.stock < item.quantity) {
      insufficientStock.push({
        foodId: item.foodId,
        name: item.name,
        requested: item.quantity,
        available: food.stock,
      });
    }
  }

  const valid = unavailable.length === 0 && insufficientStock.length === 0;
  res.json({
    success: true,
    data: {
      valid,
      unavailable,
      insufficientStock,
      message: valid
        ? 'Cart is valid'
        : unavailable.length
        ? `${unavailable.length} món không còn khả dụng`
        : `${insufficientStock.length} món không đủ số lượng`,
    },
  });
});
