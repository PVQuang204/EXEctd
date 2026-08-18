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

exports.adminList = asyncHandler(async (req, res) => {
  const data = await reviewService.listAllReviews(req.query);
  res.json({ success: true, data });
});

exports.update = asyncHandler(async (req, res) => {
  const files = req.files || (req.file ? [req.file] : []);
  const data = await reviewService.updateReview(req.params.id, req.user._id, req.body, files);
  res.json({ success: true, data });
});

exports.delete = asyncHandler(async (req, res) => {
  await reviewService.deleteReview(req.params.id, req.user._id);
  res.json({ success: true, message: 'Review deleted' });
});
