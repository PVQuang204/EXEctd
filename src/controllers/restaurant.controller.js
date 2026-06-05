const restaurantService = require('../services/restaurant.service');
const asyncHandler = require('../utils/asyncHandler');

exports.create = asyncHandler(async (req, res) => {
  const data = await restaurantService.createRestaurant(req.user._id, req.body, req.files);
  res.status(201).json({ success: true, data });
});

exports.update = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const data = await restaurantService.updateRestaurant(
    req.params.id,
    req.user._id,
    req.body,
    req.files,
    isAdmin
  );
  res.json({ success: true, data });
});

exports.updateLocation = asyncHandler(async (req, res) => {
  const data = await restaurantService.updateLocation(req.params.id, req.user._id, req.body);
  res.json({ success: true, data });
});

exports.nearby = asyncHandler(async (req, res) => {
  const { lat, lng, distance } = req.query;
  const data = await restaurantService.findNearby({ lat, lng, distance });
  res.json({ success: true, data });
});

exports.getById = asyncHandler(async (req, res) => {
  const data = await restaurantService.getById(req.params.id);
  res.json({ success: true, data });
});

exports.myRestaurants = asyncHandler(async (req, res) => {
  const data = await restaurantService.getOwnerRestaurants(req.user._id);
  res.json({ success: true, data });
});

exports.approve = asyncHandler(async (req, res) => {
  const data = await restaurantService.approveRestaurant(req.params.id);
  res.json({ success: true, data });
});

exports.reject = asyncHandler(async (req, res) => {
  const data = await restaurantService.rejectRestaurant(req.params.id);
  res.json({ success: true, data });
});
