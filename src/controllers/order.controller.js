const orderService = require('../services/order.service');
const restaurantRepository = require('../repositories/restaurant.repository');
const asyncHandler = require('../utils/asyncHandler');

exports.create = asyncHandler(async (req, res) => {
  const data = await orderService.createOrder(req.user._id, req.body);
  res.status(201).json({ success: true, data });
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const data = await orderService.transitionStatus(
    req.params.id,
    req.body.status,
    req.user,
    req.body.note
  );
  res.json({ success: true, data });
});

exports.myOrders = asyncHandler(async (req, res) => {
  const data = await orderService.getOrders(
    { customerId: req.user._id },
    req.query.page,
    req.query.limit
  );
  res.json({ success: true, data });
});

exports.restaurantOrders = asyncHandler(async (req, res) => {
  const restaurants = await restaurantRepository.find({ ownerId: req.user._id });
  const ids = restaurants.map((r) => r._id);
  const data = await orderService.getOrders(
    { restaurantId: { $in: ids } },
    req.query.page,
    req.query.limit
  );
  res.json({ success: true, data });
});

exports.revenue = asyncHandler(async (req, res) => {
  const { restaurantId, startDate, endDate } = req.query;
  const data = await orderService.getRevenueStats(restaurantId, startDate, endDate);
  res.json({ success: true, data });
});

exports.topFoods = asyncHandler(async (req, res) => {
  const data = await orderService.getTopSellingFoods(req.params.restaurantId);
  res.json({ success: true, data });
});
