const { GoogleGenerativeAI } = require('@google/generative-ai');
const { loadEnv } = require('../config/env');

let model = null;

const getModel = () => {
  if (model) return model;
  loadEnv();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 600,
      responseMimeType: 'application/json',
    },
  });
  return model;
};

const buildMenuContext = (foods) => {
  if (!foods || foods.length === 0) return 'No menu items available.';
  return foods
    .slice(0, 60)
    .map((f) => `- ${f.id || f._id}: ${f.name} | ${f.price} VND | tags: ${(f.tags || []).join(', ')} | available: ${f.isAvailable}`)
    .join('\n');
};

const generateMenuSuggestions = async ({ budget, people, tags, preferences, menuContext }) => {
  const gemini = getModel();
  if (!gemini) return null;

  const prompt = `You are a Vietnamese food assistant.\nCustomer budget: ${budget} VND for ${people} people.\nPreferences: ${preferences || 'none'}.\nTags: ${(tags || []).join(', ') || 'none'}.\nMenu (only pick from here):\n${buildMenuContext(menuContext)}\n\nReturn JSON only with schema:\n{\n  "summary": string,           // 1 friendly Vietnamese sentence\n  "groups": [                  // 1-3 groups based on budget\n    {\n      "label": string,         // "Tiết kiệm" / "Cân bằng" / "Đầy đặn"\n      "estimatedTotal": number,\n      "itemIds": string[],     // ids from menu\n      "reason": string         // Vietnamese reason\n    }\n  ],\n  "upsell": [                  // optional add-on suggestions\n    { "name": string, "estimatedPrice": number, "reason": string }\n  ]\n}\nStrict rule: prices must sum within budget. Only use itemIds from menu.`;

  try {
    const result = await gemini.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text);
  } catch (err) {
    console.warn('[ai] Gemini failed, will fallback. reason:', err.message);
    return null;
  }
};

module.exports = { getModel, generateMenuSuggestions };
