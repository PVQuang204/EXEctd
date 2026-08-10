/**
 * Groq AI integration — replaces Gemini
 *
 * Why Groq?
 *   • Free tier: 14,400 request/min (Llama / Mixtral)
 *   • No credit card required
 *   • Latency: ~200-500ms (fastest free LLM API)
 *   • OpenAI-compatible API — minimal code changes
 *
 * Get key: https://console.groq.com/keys
 */

const OpenAI = require('openai');
const { loadEnv } = require('../config/env');

let client = null;

const getClient = () => {
  if (client) return client;
  loadEnv();
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  client = new OpenAI({
    apiKey,
    baseURL: 'https://api.groq.com/openai/v1',
  });
  return client;
};

const buildMenuContext = (foods) => {
  if (!foods || foods.length === 0) return 'No menu items available.';
  return foods
    .slice(0, 60)
    .map((f) => `- ${f.id || f._id}: ${f.name} | ${f.price} VND | tags: ${(f.tags || []).join(', ')} | available: ${f.isAvailable}`)
    .join('\n');
};

const generateMenuSuggestions = async ({ budget, people, tags, preferences, menuContext }) => {
  const openai = getClient();
  if (!openai) return null;

  const prompt = `Bạn là trợ lý gợi ý món ăn cho nhà hàng.
Ngân sách: ${budget.toLocaleString()} VND cho ${people} người (tức ${(budget / people).toLocaleString()} VND/người).
Sở thích khách: ${preferences ? preferences.join(', ') : 'không có'}.
Tags ưu tiên: ${tags ? tags.join(', ') : 'không có'}.
Menu (CHỈ chọn từ các id bên dưới):
${buildMenuContext(menuContext)}

QUY TẮC BẮT BUỘC:
- Tổng giá TẤT CẢ các món trong mỗi group phải <= ${budget.toLocaleString()} VND (không được vượt ngân sách).
- Chỉ dùng itemIds từ menu trên, không bịa thêm.
- Nếu budget nhỏ (<=50k/người) → chỉ cần 1 group "Tiết kiệm".
- Nếu budget lớn (>=150k/người) → có thể 2-3 groups.

Trả JSON thuần, không markdown:
{"summary":"...","groups":[{"label":"Tiết kiệm","estimatedTotal":50000,"itemIds":["id1"],"reason":"..."}],"upsell":[]}`;

  try {
    const result = await openai.chat.completions.create({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content:
            'Bạn là trợ lý nhà hàng thân thiện. Luôn trả JSON hợp lệ, không thêm markdown hay giải thích.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 600,
    });

    const text = result.choices[0]?.message?.content?.trim() || '';
    // Strip markdown code blocks if any
    const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn('[ai] Groq failed, will fallback. reason:', err.message);
    return null;
  }
};

const chatAboutMenu = async ({ userMessage, history = [], menuItems }) => {
  const openai = getClient();
  if (!openai) return null;

  const menuContext =
    menuItems && menuItems.length > 0
      ? JSON.stringify(menuItems.slice(0, 40).map((f) => ({ name: f.name, price: f.price, tags: f.tags || [] })))
      : '[]';

  const systemPrompt =
    'Bạn là trợ lý gợi ý món ăn tiếng Việt thân thiện. Dựa vào menu để trả lời câu hỏi. Trả lời ngắn gọn, tự nhiên, bằng tiếng Việt.';

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-10).map((h) => ({
      role: h.role === 'assistant' ? 'assistant' : 'user',
      content: h.content,
    })),
    { role: 'user', content: `Menu:\n${menuContext}\n\nCâu hỏi: ${userMessage}` },
  ];

  try {
    const result = await openai.chat.completions.create({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.7,
      max_tokens: 300,
    });
    return result.choices[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.warn('[ai] Groq chat failed. reason:', err.message);
    return null;
  }
};

module.exports = { getClient, generateMenuSuggestions, chatAboutMenu };
