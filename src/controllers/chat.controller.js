const chatService = require('../services/chat.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

exports.openOrGet = asyncHandler(async (req, res) => {
  const conversation = await chatService.openOrGet(req.user, req.params.restaurantId);
  res.status(201).json({ success: true, data: conversation });
});

exports.listMine = asyncHandler(async (req, res) => {
  const data = await chatService.listMyConversations(req.user);
  res.json({ success: true, data });
});

exports.listMessages = asyncHandler(async (req, res) => {
  const data = await chatService.listMessages(req.user, req.params.id, {
    before: req.query.before,
    limit: req.query.limit,
  });
  res.json({ success: true, data });
});

exports.send = asyncHandler(async (req, res) => {
  const data = await chatService.sendMessage(req.user, req.params.id, req.body);
  res.status(201).json({ success: true, data });
});

exports.read = asyncHandler(async (req, res) => {
  await chatService.markRead(req.user, req.params.id);
  res.json({ success: true });
});

exports.close = asyncHandler(async (req, res) => {
  const data = await chatService.closeConversation(req.user, req.params.id);
  res.json({ success: true, data });
});
