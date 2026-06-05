const menuService = require('../services/menu.service');
const asyncHandler = require('../utils/asyncHandler');

exports.createCategory = asyncHandler(async (req, res) => {
  const data = await menuService.createCategory(req.user._id, req.params.restaurantId, req.body);
  res.status(201).json({ success: true, data });
});

exports.listCategories = asyncHandler(async (req, res) => {
  const data = await menuService.listCategories(req.params.restaurantId);
  res.json({ success: true, data });
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
