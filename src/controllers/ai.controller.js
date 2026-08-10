const aiService = require('../services/ai.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

exports.suggest = asyncHandler(async (req, res) => {
  const { budget, people, tags, preferences, restaurantId } = req.body || {};
  const numBudget = Number(budget);
  const numPeople = Number(people);
  if (!Number.isFinite(numBudget) || !Number.isFinite(numPeople)) {
    throw new ApiError(400, 'budget and people must be numbers');
  }
  const data = await aiService.suggestByBudget({
    budget: numBudget,
    people: numPeople,
    tags: Array.isArray(tags) ? tags.slice(0, 10) : undefined,
    preferences: Array.isArray(preferences) ? preferences.slice(0, 10) : undefined,
    restaurantId,
  });
  res.json({ success: true, data });
});

exports.chat = asyncHandler(async (req, res) => {
  const { message, restaurantId, history } = req.body || {};
  if (!message || typeof message !== 'string') {
    throw new ApiError(400, 'message is required');
  }
  const data = await aiService.chatAboutMenu({
    userMessage: message,
    restaurantId,
    history: Array.isArray(history) ? history.slice(-10) : [],
  });
  res.json({ success: true, data });
});
