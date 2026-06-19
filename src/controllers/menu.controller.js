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
