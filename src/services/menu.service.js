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
  categoryRepository.find(
    { restaurantId, isActive: true, name: { $ne: 'Thực đơn set' } },
    { sort: { sortOrder: 1 } },
  );

const deleteCategory = async (ownerId, restaurantId, categoryId) => {
  if (!ownerId || !restaurantId || !categoryId) throw new ApiError(400, 'Missing required parameters');
  await assertOwner(restaurantId, ownerId);
  const category = await categoryRepository.findById(categoryId);
  if (!category) throw new ApiError(404, 'Category not found');
  if (category.restaurantId.toString() !== restaurantId.toString()) {
    throw new ApiError(403, 'Category does not belong to this restaurant');
  }
  const foodCount = await foodRepository.count({ categoryId, restaurantId });
  if (foodCount > 0) {
    throw new ApiError(400, `Cannot delete category with ${foodCount} food(s). Remove foods first.`);
  }
  return categoryRepository.deleteById(categoryId);
};

// Foods
const createFood = async (ownerId, data, file) => {
  await assertOwner(data.restaurantId, ownerId);
  if (file) data.image = await uploadFromBuffer(file.buffer, 'foods');
  if (data.stock == null) data.stock = 999; // default unlimited stock
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
  return foodRepository.find(filter, {
    populate: { path: 'categoryId', select: 'name' },
    sort: { createdAt: -1 },
  });
};

const deleteFood = async (ownerId, id) => {
  if (!ownerId || !id) throw new ApiError(400, 'Missing required parameters');
  const food = await foodRepository.findById(id);
  if (!food) throw new ApiError(404, 'Food not found');
  await assertOwner(food.restaurantId, ownerId);
  return foodRepository.deleteById(id);
};

// Combos
const createCombo = async (ownerId, data, file) => {
  await assertOwner(data.restaurantId, ownerId);
  if (file) data.image = await uploadFromBuffer(file.buffer, 'combos');
  return comboRepository.create(data);
};

const updateCombo = async (ownerId, id, data, file) => {
  const combo = await comboRepository.findById(id);
  if (!combo) throw new ApiError(404, 'Combo not found');
  await assertOwner(combo.restaurantId, ownerId);
  if (file) data.image = await uploadFromBuffer(file.buffer, 'combos');
  return comboRepository.updateById(id, data);
};

const listCombos = async (restaurantId) => {
  const combos = await comboRepository.find({ restaurantId, isActive: true });
  for (const combo of combos) {
    if (combo.items && combo.items.length > 0) {
      const foodIds = combo.items.map(i => i.foodId);
      const foods = await foodRepository.findByIds(foodIds);
      const foodMap = {};
      foods.forEach(f => { foodMap[f._id.toString()] = f; });
      combo.dishes = combo.items.map(i => {
        const food = foodMap[i.foodId.toString()];
        return food ? food.name : null;
      }).filter(Boolean);
      combo.serves = `${combo.items.reduce((sum, i) => sum + i.quantity, 0)} phần`;
    } else {
      combo.dishes = [];
      combo.serves = null;
    }
  }
  return combos;
};

const deleteCombo = async (ownerId, id) => {
  if (!ownerId || !id) throw new ApiError(400, 'Missing required parameters');
  const combo = await comboRepository.findById(id);
  if (!combo) throw new ApiError(404, 'Combo not found');
  await assertOwner(combo.restaurantId, ownerId);
  return comboRepository.deleteById(id);
};

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

const deletePromotion = async (ownerId, id) => {
  if (!ownerId || !id) throw new ApiError(400, 'Missing required parameters');
  const promo = await promotionRepository.findById(id);
  if (!promo) throw new ApiError(404, 'Promotion not found');
  await assertOwner(promo.restaurantId, ownerId);
  return promotionRepository.deleteById(id);
};

const applyPromotion = async (restaurantId, code, orderAmount) => {
  const promo = await promotionRepository.findOne({
    restaurantId,
    code: code?.toUpperCase(),
    isActive: true,
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() },
  });
  if (!promo) throw new ApiError(400, 'Invalid promotion code');
  if (promo.maxUsage != null && promo.usedCount >= promo.maxUsage) {
    throw new ApiError(400, 'Promotion usage limit reached');
  }
  if (orderAmount < promo.minOrderAmount) {
    throw new ApiError(400, `Minimum order amount is ${promo.minOrderAmount}`);
  }
  let discount =
    promo.discountType === 'percent'
      ? (orderAmount * promo.discountValue) / 100
      : promo.discountValue;
  if (promo.maxDiscount != null) {
    discount = Math.min(discount, promo.maxDiscount);
  }
  discount = Math.min(discount, orderAmount);
  return { promotion: promo, discountAmount: discount };
};

module.exports = {
  createCategory,
  listCategories,
  deleteCategory,
  createFood,
  updateFood,
  deleteFood,
  listFoods,
  createCombo,
  updateCombo,
  deleteCombo,
  listCombos,
  createPromotion,
  deletePromotion,
  listPromotions,
  applyPromotion,
};
