const foodRepository = require('../repositories/food.repository');
const comboRepository = require('../repositories/combo.repository');
const { generateMenuSuggestions, chatAboutMenu: groqChat } = require('../config/ai');
const ApiError = require('../utils/ApiError');

const KNOWN_UPSELLS = [
  { name: 'Rạp chiếu phim mini tại nhà', estimatedPrice: 350000, reason: 'Biến bữa ăn thành đêm xem phim' },
  { name: 'Nước uống lớn 1.5L', estimatedPrice: 25000, reason: 'Mua cùng tiện hơn' },
  { name: 'Combo bắp rang bơ', estimatedPrice: 45000, reason: 'Dùng kèm phim/khách' },
  { name: 'Set tráng miệng chè', estimatedPrice: 35000, reason: 'Kết thúc bữa trọn vị' },
  { name: 'Voucher dọn phòng', estimatedPrice: 80000, reason: 'Dọn dẹp sau tiệc' },
];

const suggestUpsell = (budget) => {
  const items = [];
  if (budget >= 200000) {
    items.push(KNOWN_UPSELLS[0]);
    items.push(KNOWN_UPSELLS[2]);
  }
  if (budget >= 100000) {
    items.push(KNOWN_UPSELLS[1]);
    items.push(KNOWN_UPSELLS[3]);
  }
  if (budget >= 400000) items.push(KNOWN_UPSELLS[4]);
  return items.slice(0, 4);
};

const ruleBasedSuggestion = ({ budget, people, menuContext }) => {
  const tiers = [
    { label: 'Tiết kiệm', ratio: 0.5 },
    { label: 'Cân bằng', ratio: 0.8 },
    { label: 'Đầy đặn', ratio: 1.15 },
  ];

  const available = menuContext.filter((f) => f.isAvailable && f.price > 0);
  if (available.length === 0) {
    return {
      summary: `Với ngân sách ${budget.toLocaleString()} VND cho ${people} người, mình chưa tìm được món phù hợp trong menu.`,
      groups: [],
      upsell: suggestUpsell(budget),
    };
  }

  const groups = tiers
    .map(({ label, ratio }) => {
      const target = Math.max(0, Math.round((budget * ratio) / people));
      const picked = [];
      let total = 0;
      for (const food of available) {
        if (picked.length >= Math.max(2, Math.ceil(people * 1.5))) break;
        if (total + food.price > target * people) continue;
        picked.push(food);
        total += food.price;
      }
      if (picked.length === 0) return null;
      return {
        label,
        estimatedTotal: total * people,
        itemIds: picked.map((f) => (f.id || f._id).toString()),
        reason: `Khoảng ${Math.round(ratio * 100)}% ngân sách, ${picked.length} món cho ${people} người`,
      };
    })
    .filter(Boolean);

  const summary = `Gợi ý cho ${people} người với ${budget.toLocaleString()} VND: ${groups
    .map((g) => `${g.label} ~${g.estimatedTotal.toLocaleString()}đ`)
    .join(', ')}.`;

  return { summary, groups, upsell: suggestUpsell(budget) };
};

const suggestByBudget = async ({ budget, people, tags, restaurantId, preferences }) => {
  if (!budget || budget <= 0) throw new ApiError(400, 'budget must be > 0');
  if (!people || people <= 0) throw new ApiError(400, 'people must be > 0');
  if (!restaurantId) throw new ApiError(400, 'restaurantId is required');

  let menu = await foodRepository.find({
    restaurantId,
    isAvailable: true,
    ...(tags && tags.length ? { tags: { $in: tags } } : {}),
  });
  if (!menu.length) {
    menu = await foodRepository.find({ isAvailable: true });
  }
  const combos = await comboRepository.find({ restaurantId, isActive: true }).catch(() => []);

  const menuContext = [...menu, ...combos].map((m) => ({
    id: m._id,
    name: m.name,
    price: m.price,
    tags: m.tags || [],
    isAvailable: m.isAvailable !== false && m.isActive !== false,
  }));

  // Try Groq AI first
  const aiResult = await generateMenuSuggestions({ budget, people, tags, preferences, menuContext });
  if (aiResult && Array.isArray(aiResult.groups) && aiResult.groups.length) {
    return {
      source: 'groq',
      ...aiResult,
      upsell: aiResult.upsell || suggestUpsell(budget),
    };
  }

  // Fallback to rule-based
  const fallback = ruleBasedSuggestion({ budget, people, menuContext });
  return { source: 'rule-based', ...fallback };
};

const chatAboutMenu = async ({ userMessage, history = [], restaurantId }) => {
  // Build menu context
  const menu = await foodRepository.find({ restaurantId, isAvailable: true }).catch(() => []);
  const menuItems = menu.map((f) => ({
    name: f.name,
    price: f.price,
    tags: f.tags || [],
  }));

  // Try Groq AI
  const reply = await groqChat({ userMessage, history, menuItems });
  if (reply) {
    return { source: 'groq', reply };
  }

  // Fallback
  return {
    source: 'rule-based',
    reply: 'Mình sẵn sàng gợi ý món theo ngân sách. Bạn thử gọi /api/ai/suggest với ngân sách và số người nhé.',
  };
};

module.exports = {
  suggestByBudget,
  chatAboutMenu,
  KNOWN_UPSELLS,
};
