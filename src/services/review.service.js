const mongoose = require('mongoose');
const reviewRepository = require('../repositories/review.repository');
const restaurantRepository = require('../repositories/restaurant.repository');
const orderRepository = require('../repositories/order.repository');
const { uploadFromBuffer, extractUrl } = require('./upload.service');
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
    if (order.status !== ORDER_STATUSES.READY) {
      throw new ApiError(400, 'Can only review ready orders');
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
    const result = await uploadFromBuffer(file.buffer, 'reviews');
    const url = extractUrl(result);
    if (!url) throw new ApiError(500, 'Image upload failed');
    images.push(url);
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

const listAllReviews = async ({ page = 1, limit = 20, restaurantId, rating, startDate, endDate }) => {
  const filter = {};
  if (restaurantId) filter.restaurantId = new mongoose.Types.ObjectId(restaurantId);
  if (rating) filter.rating = Number(rating);
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }
  const skip = (page - 1) * limit;
  const [reviews, total] = await Promise.all([
    reviewRepository.find(filter, {
      sort: { createdAt: -1 },
      skip,
      limit,
      populate: [
        { path: 'customerId', select: 'fullName avatar' },
        { path: 'restaurantId', select: 'name' },
      ],
    }),
    reviewRepository.count(filter),
  ]);
  return { reviews, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) } };
};

module.exports = { createReview, listReviews, listAllReviews };
