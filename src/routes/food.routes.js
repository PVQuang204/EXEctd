const express = require('express');
const router = express.Router({ mergeParams: true });
const { body, param } = require('express-validator');
const foodController = require('../controllers/food.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

// ============ Validation Rules ============

const createFoodValidation = [
  body('name')
    .notEmpty()
    .withMessage('Food name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters')
    .trim(),
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('category').optional().trim(),
  body('isAvailable')
    .optional()
    .isBoolean()
    .withMessage('isAvailable must be a boolean'),
  body('options')
    .optional()
    .isArray()
    .withMessage('Options must be an array'),
  body('options.*.name')
    .optional()
    .notEmpty()
    .withMessage('Option name is required'),
  body('options.*.price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Option price must be a positive number'),
];

const updateFoodValidation = [
  param('id').isMongoId().withMessage('Invalid food ID'),
  body('name')
    .optional()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters')
    .trim(),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('category').optional().trim(),
  body('isAvailable')
    .optional()
    .isBoolean()
    .withMessage('isAvailable must be a boolean'),
  body('options')
    .optional()
    .isArray()
    .withMessage('Options must be an array'),
  body('options.*.name')
    .optional()
    .notEmpty()
    .withMessage('Option name is required'),
  body('options.*.price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Option price must be a positive number'),
];

const deleteFoodValidation = [
  param('id').isMongoId().withMessage('Invalid food ID'),
];

// ============ Routes ============

/**
 * @swagger
 * tags:
 *   name: Foods
 *   description: Food item management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Food:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 60d5ec49f1b2c72b9c8e4d3b
 *         name:
 *           type: string
 *           example: Pho Bo
 *         description:
 *           type: string
 *           example: Traditional beef noodle soup
 *         price:
 *           type: number
 *           example: 50000
 *         thumbnail:
 *           type: string
 *           nullable: true
 *         images:
 *           type: array
 *           items:
 *             type: string
 *         category:
 *           type: string
 *           example: Soup
 *         restaurant:
 *           type: string
 *           example: 60d5ec49f1b2c72b9c8e4d3a
 *         isAvailable:
 *           type: boolean
 *           example: true
 *         options:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Extra beef
 *               price:
 *                 type: number
 *                 example: 15000
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     FoodInput:
 *       type: object
 *       required:
 *         - name
 *         - price
 *       properties:
 *         name:
 *           type: string
 *           maxLength: 100
 *           example: Pho Bo
 *         description:
 *           type: string
 *           maxLength: 500
 *           example: Traditional beef noodle soup
 *         price:
 *           type: number
 *           minimum: 0
 *           example: 50000
 *         category:
 *           type: string
 *           example: Soup
 *         isAvailable:
 *           type: boolean
 *           example: true
 *         options:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Extra beef
 *               price:
 *                 type: number
 *                 example: 15000
 */

/**
 * @swagger
 * /api/restaurants/{restaurantId}/foods:
 *   post:
 *     summary: Create a new food item for a restaurant
 *     tags: [Foods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Restaurant ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FoodInput'
 *     responses:
 *       201:
 *         description: Food created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Food'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Not the owner of this restaurant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Restaurant not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/',
  protect,
  authorize('owner', 'admin'),
  createFoodValidation,
  foodController.createFood
);

/**
 * @swagger
 * /api/restaurants/{restaurantId}/foods:
 *   get:
 *     summary: Get all foods of a restaurant
 *     tags: [Foods]
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Restaurant ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by food category
 *       - in: query
 *         name: isAvailable
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *         description: Filter by availability
 *     responses:
 *       200:
 *         description: List of foods
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Food'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationInfo'
 *       404:
 *         description: Restaurant not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', foodController.getFoods);

/**
 * @swagger
 * /api/restaurants/{restaurantId}/foods/{id}:
 *   put:
 *     summary: Update a food item
 *     tags: [Foods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Food ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FoodInput'
 *     responses:
 *       200:
 *         description: Food updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Food'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Not the owner of the food's restaurant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Food not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put(
  '/:id',
  protect,
  authorize('owner', 'admin'),
  updateFoodValidation,
  foodController.updateFood
);

/**
 * @swagger
 * /api/restaurants/{restaurantId}/foods/{id}:
 *   delete:
 *     summary: Delete a food item
 *     tags: [Foods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Food ID
 *     responses:
 *       200:
 *         description: Food deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Food deleted successfully
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Not the owner of the food's restaurant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Food not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  '/:id',
  protect,
  authorize('owner', 'admin'),
  deleteFoodValidation,
  foodController.deleteFood
);

module.exports = router;
