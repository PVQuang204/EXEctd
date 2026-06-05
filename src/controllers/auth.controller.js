const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');

exports.register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json({ success: true, data: result });
});

exports.login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.json({ success: true, data: result });
});

exports.refresh = asyncHandler(async (req, res) => {
  const token = req.body.refreshToken || req.cookies?.refreshToken;
  const result = await authService.refresh(token);
  res.json({ success: true, data: result });
});

exports.logout = asyncHandler(async (req, res) => {
  const result = await authService.logout(req.user._id);
  res.json({ success: true, data: result });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const result = await authService.changePassword(req.user._id, req.body);
  res.json({ success: true, data: result });
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body);
  res.json({ success: true, data: result });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword(req.body);
  res.json({ success: true, data: result });
});

exports.getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user });
});
