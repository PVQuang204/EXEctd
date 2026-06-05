const userService = require('../services/user.service');
const asyncHandler = require('../utils/asyncHandler');

exports.getProfile = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.user._id);
  res.json({ success: true, data: user });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user._id, req.body);
  res.json({ success: true, data: user });
});

exports.uploadAvatar = asyncHandler(async (req, res) => {
  const user = await userService.uploadAvatar(req.user._id, req.file);
  res.json({ success: true, data: user });
});

exports.listUsers = asyncHandler(async (req, res) => {
  const { role, status, page, limit } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (status) filter.status = status;
  const users = await userService.listUsers(filter, page, limit);
  res.json({ success: true, data: users });
});

exports.lockUser = asyncHandler(async (req, res) => {
  const user = await userService.lockUser(req.params.id);
  res.json({ success: true, data: user });
});

exports.unlockUser = asyncHandler(async (req, res) => {
  const user = await userService.unlockUser(req.params.id);
  res.json({ success: true, data: user });
});
