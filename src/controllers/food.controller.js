const { validationResult } = require('express-validator');
const foodService = require('../services/food.service');
const ApiError = require('../utils/ApiError');

/**
 * Kiểm tra validation errors
 */
const handleValidation = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((err) => err.msg);
    throw new ApiError(400, messages.join('. '));
  }
};

/**
 * @desc    Create a new food item for a restaurant
 * @route   POST /api/restaurants/:restaurantId/foods
 * @access  Private (owner, admin)
 */
const createFood = async (req, res, next) => {
  try {
    handleValidation(req);
    const food = await foodService.create(
      req.body,
      req.params.restaurantId,
      req.user
    );

    res.status(201).json({
      success: true,
      data: food,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a food item
 * @route   PUT /api/foods/:id
 * @access  Private (owner of restaurant or admin)
 */
const updateFood = async (req, res, next) => {
  try {
    handleValidation(req);
    const food = await foodService.update(req.params.id, req.body, req.user);

    res.status(200).json({
      success: true,
      data: food,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a food item
 * @route   DELETE /api/foods/:id
 * @access  Private (owner of restaurant or admin)
 */
const deleteFood = async (req, res, next) => {
  try {
    const result = await foodService.remove(req.params.id, req.user);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all foods of a restaurant
 * @route   GET /api/restaurants/:restaurantId/foods
 * @access  Public
 */
const getFoods = async (req, res, next) => {
  try {
    const result = await foodService.getByRestaurant(
      req.params.restaurantId,
      req.query
    );

    res.status(200).json({
      success: true,
      data: result.foods,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createFood, updateFood, deleteFood, getFoods };
