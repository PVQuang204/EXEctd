const Food = require('../models/Food.model');
const Restaurant = require('../models/Restaurant.model');
const ApiError = require('../utils/ApiError');

/**
 * Create a new food item
 * Verifies user owns the restaurant before creating
 */
const create = async (data, restaurantId, user) => {
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) {
    throw new ApiError(404, 'Restaurant not found');
  }

  // Check ownership: only the restaurant owner or admin can add food
  if (
    restaurant.owner.toString() !== user._id.toString() &&
    user.role !== 'admin'
  ) {
    throw new ApiError(403, 'You are not authorized to add food to this restaurant');
  }

  const food = await Food.create({ ...data, restaurant: restaurantId });
  return food;
};

/**
 * Update a food item
 * Verifies user owns the food's restaurant before updating
 */
const update = async (foodId, updateData, user) => {
  const food = await Food.findById(foodId).populate('restaurant', 'owner');
  if (!food) {
    throw new ApiError(404, 'Food not found');
  }

  // Check ownership: only the restaurant owner or admin can update
  if (
    food.restaurant.owner.toString() !== user._id.toString() &&
    user.role !== 'admin'
  ) {
    throw new ApiError(403, 'You are not authorized to update this food');
  }

  const allowedFields = [
    'name',
    'description',
    'price',
    'thumbnail',
    'images',
    'category',
    'isAvailable',
    'options',
  ];
  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      food[field] = updateData[field];
    }
  });

  await food.save({ validateModifiedOnly: true });
  return food;
};

/**
 * Delete a food item
 * Verifies user owns the food's restaurant before deleting
 */
const remove = async (foodId, user) => {
  const food = await Food.findById(foodId).populate('restaurant', 'owner');
  if (!food) {
    throw new ApiError(404, 'Food not found');
  }

  // Check ownership: only the restaurant owner or admin can delete
  if (
    food.restaurant.owner.toString() !== user._id.toString() &&
    user.role !== 'admin'
  ) {
    throw new ApiError(403, 'You are not authorized to delete this food');
  }

  await food.deleteOne();
  return { message: 'Food deleted successfully' };
};

/**
 * Get all foods of a restaurant with pagination and filters
 */
const getByRestaurant = async (restaurantId, queryParams) => {
  const page = parseInt(queryParams.page, 10) || 1;
  const limit = parseInt(queryParams.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // Check if restaurant exists
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) {
    throw new ApiError(404, 'Restaurant not found');
  }

  // Build filter
  const filter = { restaurant: restaurantId };

  if (queryParams.category) {
    filter.category = queryParams.category;
  }

  if (queryParams.isAvailable !== undefined) {
    filter.isAvailable = queryParams.isAvailable === 'true';
  }

  const [foods, total] = await Promise.all([
    Food.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
    Food.countDocuments(filter),
  ]);

  return {
    foods,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

module.exports = { create, update, remove, getByRestaurant };
