const mongoose = require('mongoose');
const foodRepository = require('../repositories/food.repository');
const orderRepository = require('../repositories/order.repository');

const roundRating = (n) => Math.round(n * 10) / 10;

const applyRatingToFood = async (foodId, rating) => {
  const food = await foodRepository.findById(foodId);
  if (!food) return;

  const count = food.ratingCount || 0;
  const nextAvg = count === 0 ? rating : (food.ratingAverage * count + rating) / (count + 1);

  await foodRepository.updateById(foodId, {
    ratingAverage: roundRating(nextAvg),
    ratingCount: count + 1,
  });
};

const syncFoodRatingsFromReview = async ({ foodId, orderId, rating }) => {
  const foodIds = new Set();

  if (foodId) foodIds.add(foodId.toString());

  if (orderId) {
    const order = await orderRepository.findById(orderId);
    order?.items?.forEach((item) => {
      if (item.foodId) foodIds.add(item.foodId.toString());
    });
  }

  await Promise.all([...foodIds].map((id) => applyRatingToFood(id, rating)));
};

const recalculateFoodRating = async (foodId) => {
  const Review = require('../models/Review.model');
  const foodObjectId = new mongoose.Types.ObjectId(foodId);

  const [stat] = await Review.aggregate([
    {
      $match: {
        $or: [{ foodId: foodObjectId }, { foodIds: foodObjectId }],
      },
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        ratingCount: { $sum: 1 },
      },
    },
  ]);

  if (!stat) {
    await foodRepository.updateById(foodId, { ratingAverage: 0, ratingCount: 0 });
    return;
  }

  await foodRepository.updateById(foodId, {
    ratingAverage: roundRating(stat.averageRating),
    ratingCount: stat.ratingCount,
  });
};

module.exports = { syncFoodRatingsFromReview, recalculateFoodRating, applyRatingToFood };
