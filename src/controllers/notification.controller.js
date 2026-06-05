const notificationService = require('../services/notification.service');
const asyncHandler = require('../utils/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
  const data = await notificationService.getMyNotifications(req.user._id, req.query);
  res.json({ success: true, data });
});

exports.markRead = asyncHandler(async (req, res) => {
  const data = await notificationService.markAsRead(req.params.id, req.user._id);
  res.json({ success: true, data });
});

exports.markAllRead = asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead(req.user._id);
  res.json({ success: true, message: 'All marked as read' });
});
