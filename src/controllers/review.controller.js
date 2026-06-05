const reviewService = require('../services/review.service');
const asyncHandler = require('../utils/asyncHandler');

exports.create = asyncHandler(async (req, res) => {
  const files = req.files || (req.file ? [req.file] : []);
  const data = await reviewService.createReview(req.user._id, req.body, files);
  res.status(201).json({ success: true, data });
});

exports.list = asyncHandler(async (req, res) => {
  const data = await reviewService.listReviews(
    req.params.restaurantId,
    req.query.page,
    req.query.limit
  );
  res.json({ success: true, data });
});
