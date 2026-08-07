const aiService = require('../services/ai.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

exports.suggest = asyncHandler(async (req, res) => {
  const { budget, people, tags, preferences, restaurantId } = req.body || {};
  const data = await aiService.suggestByBudget({
    budget: Number(budget),
    people: Number(people),
    tags,
    preferences,
    restaurantId,
  });
  res.json({ success: true, data });
});

exports.chat = asyncHandler(async (req, res) => {
  const { message, restaurantId, history } = req.body || {};
  if (!message) throw new ApiError(400, 'message is required');
  const data = await aiService.chatAboutMenu({
    userMessage: message,
    restaurantId,
    history: Array.isArray(history) ? history.slice(-10) : [],
  });
  res.json({ success: true, data });
});
