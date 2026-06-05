const categoryRepository = require('../repositories/category.repository');
const foodRepository = require('../repositories/food.repository');
const comboRepository = require('../repositories/combo.repository');
const promotionRepository = require('../repositories/promotion.repository');
const restaurantRepository = require('../repositories/restaurant.repository');
const { uploadFromBuffer } = require('./upload.service');
const ApiError = require('../utils/ApiError');

const assertOwner = async (restaurantId, ownerId) => {
  const r = await restaurantRepository.findById(restaurantId);
  if (!r) throw new ApiError(404, 'Restaurant not found');
  if (r.ownerId.toString() !== ownerId.toString()) throw new ApiError(403, 'Forbidden');
  return r;
};

// Categories
const createCategory = async (ownerId, restaurantId, data) => {
  await assertOwner(restaurantId, ownerId);
  return categoryRepository.create({ ...data, restaurantId });
};

const listCategories = (restaurantId) =>
  categoryRepository.find({ restaurantId, isActive: true }, { sort: { sortOrder: 1 } });

// Foods
const createFood = async (ownerId, data, file) => {
  await assertOwner(data.restaurantId, ownerId);
  if (file) data.image = await uploadFromBuffer(file.buffer, 'foods');
  return foodRepository.create(data);
};

const updateFood = async (ownerId, id, data, file) => {
  const food = await foodRepository.findById(id);
  if (!food) throw new ApiError(404, 'Food not found');
  await assertOwner(food.restaurantId, ownerId);
  if (file) data.image = await uploadFromBuffer(file.buffer, 'foods');
  return foodRepository.updateById(id, data);
};

const listFoods = (restaurantId, categoryId) => {
  const filter = { restaurantId, isAvailable: true };
  if (categoryId) filter.categoryId = categoryId;
  return foodRepository.find(filter);
};

// Combos
const createCombo = async (ownerId, data, file) => {
  await assertOwner(data.restaurantId, ownerId);
  if (file) data.image = await uploadFromBuffer(file.buffer, 'combos');
  return comboRepository.create(data);
};

const listCombos = (restaurantId) =>
  comboRepository.find({ restaurantId, isActive: true });

// Promotions
const createPromotion = async (ownerId, data) => {
  await assertOwner(data.restaurantId, ownerId);
  return promotionRepository.create(data);
};

const listPromotions = (restaurantId) =>
  promotionRepository.find({
    restaurantId,
    isActive: true,
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() },
  });

const applyPromotion = async (restaurantId, code, orderAmount) => {
  const promo = await promotionRepository.findOne({
    restaurantId,
    code: code?.toUpperCase(),
    isActive: true,
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() },
  });
  if (!promo) throw new ApiError(400, 'Invalid promotion code');
  if (orderAmount < promo.minOrderAmount) {
    throw new ApiError(400, `Minimum order amount is ${promo.minOrderAmount}`);
  }
  let discount =
    promo.discountType === 'percent'
      ? (orderAmount * promo.discountValue) / 100
      : promo.discountValue;
  discount = Math.min(discount, orderAmount);
  return { promotion: promo, discountAmount: discount };
};

module.exports = {
  createCategory,
  listCategories,
  createFood,
  updateFood,
  listFoods,
  createCombo,
  listCombos,
  createPromotion,
  listPromotions,
  applyPromotion,
  categoryRepository,
  foodRepository,
  comboRepository,
  promotionRepository,
};
