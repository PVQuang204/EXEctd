const mongoose = require('mongoose');
const reviewRepository = require('../repositories/review.repository');
const restaurantRepository = require('../repositories/restaurant.repository');
const orderRepository = require('../repositories/order.repository');
const { uploadFromBuffer } = require('./upload.service');
const { createNotification } = require('./notification.service');
const { syncFoodRatingsFromReview } = require('./foodRating.service');
const { emitToUser, emitToRestaurant } = require('../sockets');
const { ORDER_STATUSES, NOTIFICATION_TYPES } = require('../constants');
const ApiError = require('../utils/ApiError');

const resolveFoodIds = async ({ foodId, orderId }) => {
  if (foodId) return [foodId];
  if (!orderId) return [];
  const order = await orderRepository.findById(orderId);
  if (!order) return [];
  return order.items.map((i) => i.foodId).filter(Boolean);
};

const createReview = async (customerId, data, files = []) => {
  const { restaurantId, orderId, foodId, rating, comment } = data;

  if (orderId) {
    const order = await orderRepository.findById(orderId);
    if (!order || order.customerId.toString() !== customerId.toString()) {
      throw new ApiError(403, 'Invalid order');
    }
    if (order.status !== ORDER_STATUSES.COMPLETED) {
      throw new ApiError(400, 'Can only review completed orders');
    }
  }

  const existing = await reviewRepository.findOne({
    customerId,
    restaurantId,
    ...(orderId ? { orderId } : {}),
  });
  if (existing) throw new ApiError(400, 'Already reviewed');

  const images = [];
  for (const file of files) {
    images.push(await uploadFromBuffer(file.buffer, 'reviews'));
  }

  const foodIds = await resolveFoodIds({ foodId, orderId });

  const review = await reviewRepository.create({
    customerId,
    restaurantId,
    orderId,
    foodId: foodId || (foodIds.length === 1 ? foodIds[0] : undefined),
    foodIds,
    rating,
    comment,
    images,
  });

  const restaurantObjectId = new mongoose.Types.ObjectId(restaurantId);
  const stats = await reviewRepository.aggregate([
    { $match: { restaurantId: restaurantObjectId } },
    {
      $group: {
        _id: '$restaurantId',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);
  if (stats[0]) {
    await restaurantRepository.updateById(restaurantId, {
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      totalReviews: stats[0].totalReviews,
    });
  }

  await syncFoodRatingsFromReview({ foodId, orderId, rating });

  const restaurant = await restaurantRepository.findById(restaurantId);
  await createNotification({
    userId: restaurant.ownerId,
    title: 'New review',
    content: `New ${rating}-star review`,
    type: NOTIFICATION_TYPES.REVIEW,
    metadata: { reviewId: review._id, restaurantId },
  });

  emitToRestaurant(restaurantId.toString(), 'new_review', review);
  emitToUser(customerId.toString(), 'new_review', review);

  return review;
};

const listReviews = (restaurantId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  return reviewRepository.find(
    { restaurantId },
    {
      sort: { createdAt: -1 },
      skip,
      limit,
      populate: { path: 'customerId', select: 'fullName avatar' },
    }
  );
};

module.exports = { createReview, listReviews };
