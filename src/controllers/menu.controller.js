const menuService = require('../services/menu.service');
const { uploadFromBuffer } = require('../services/upload.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

exports.createCategory = asyncHandler(async (req, res) => {
  const data = await menuService.createCategory(req.user._id, req.params.restaurantId, req.body);
  res.status(201).json({ success: true, data });
});

exports.listCategories = asyncHandler(async (req, res) => {
  const data = await menuService.listCategories(req.params.restaurantId);
  res.json({ success: true, data });
});

exports.uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file uploaded');
  const imageUrl = await uploadFromBuffer(req.file.buffer, 'foods');
  res.json({ success: true, data: { image: imageUrl } });
});

exports.createFood = asyncHandler(async (req, res) => {
  const data = await menuService.createFood(req.user._id, req.body, req.file);
  res.status(201).json({ success: true, data });
});

exports.updateFood = asyncHandler(async (req, res) => {
  const data = await menuService.updateFood(req.user._id, req.params.id, req.body, req.file);
  res.json({ success: true, data });
});

exports.listFoods = asyncHandler(async (req, res) => {
  const data = await menuService.listFoods(req.params.restaurantId, req.query.categoryId);
  res.json({ success: true, data });
});

exports.createCombo = asyncHandler(async (req, res) => {
  const data = await menuService.createCombo(req.user._id, req.body, req.file);
  res.status(201).json({ success: true, data });
});

exports.listCombos = asyncHandler(async (req, res) => {
  const data = await menuService.listCombos(req.params.restaurantId);
  res.json({ success: true, data });
});

exports.createPromotion = asyncHandler(async (req, res) => {
  const data = await menuService.createPromotion(req.user._id, req.body);
  res.status(201).json({ success: true, data });
});

exports.listPromotions = asyncHandler(async (req, res) => {
  const data = await menuService.listPromotions(req.params.restaurantId);
  res.json({ success: true, data });
});

exports.deleteCategory = asyncHandler(async (req, res) => {
  await menuService.deleteCategory(req.user._id, req.params.restaurantId, req.params.id);
  res.json({ success: true, message: 'Category deleted' });
});

exports.deleteFood = asyncHandler(async (req, res) => {
  await menuService.deleteFood(req.user._id, req.params.id);
  res.json({ success: true, message: 'Food deleted' });
});

exports.updateCombo = asyncHandler(async (req, res) => {
  const data = await menuService.updateCombo(req.user._id, req.params.id, req.body, req.file);
  res.json({ success: true, data });
});

exports.deleteCombo = asyncHandler(async (req, res) => {
  await menuService.deleteCombo(req.user._id, req.params.id);
  res.json({ success: true, message: 'Combo deleted' });
});

exports.deletePromotion = asyncHandler(async (req, res) => {
  await menuService.deletePromotion(req.user._id, req.params.id);
  res.json({ success: true, message: 'Promotion deleted' });
});

exports.validateCart = asyncHandler(async (req, res) => {
  const { restaurantId, items } = req.body;
  if (!restaurantId || !items || !Array.isArray(items)) {
    return res.status(400).json({ success: false, message: 'Invalid cart data' });
  }

  const unavailable = [];
  const insufficientStock = [];

  for (const item of items) {
    let entity = await menuService.getFoodById(item.foodId);
    let entityType = 'food';
    if (!entity) {
      entity = await menuService.getComboById(item.foodId);
      entityType = 'combo';
    }

    if (!entity) {
      unavailable.push({ foodId: item.foodId, name: item.name, type: 'not_found' });
      continue;
    }

    const isAvailable = entityType === 'food' ? entity.isAvailable : entity.isActive;
    if (!isAvailable) {
      unavailable.push({ foodId: item.foodId, name: item.name, type: entityType });
    } else if (entityType === 'food' && entity.restaurantId.toString() !== restaurantId) {
      unavailable.push({ foodId: item.foodId, name: item.name, type: 'wrong_restaurant' });
    } else if (entityType === 'food' && item.quantity > entity.stock) {
      insufficientStock.push({
        foodId: item.foodId,
        name: item.name,
        requested: item.quantity,
        available: entity.stock,
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
