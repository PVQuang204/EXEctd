const foodRepository = require('../repositories/food.repository');
const comboRepository = require('../repositories/combo.repository');
const { generateMenuSuggestions, chatAboutMenu: groqChat } = require('../config/ai');
const ApiError = require('../utils/ApiError');

// Validate & sanitize AI output:
//   - Loại bỏ itemIds trùng lặp (AI đôi khi chọn cùng 1 món nhiều lần)
//   - Loại bỏ itemIds không tồn tại trong menu (AI có thể bịa ID)
//   - Đảm bảo tổng giá group <= budget
//   - Đảm bảo mỗi group có ít nhất 1 món
const sanitizeAiGroups = (aiGroups, validIds, budget) => {
  if (!Array.isArray(aiGroups)) return [];
  const validIdSet = new Set(validIds.map((id) => id.toString()));
  const seen = new Set();

  return aiGroups
    .map((g) => {
      if (!g || typeof g !== 'object') return null;
      const itemIds = Array.isArray(g.itemIds) ? g.itemIds : [];
      const uniqueIds = [];
      for (const id of itemIds) {
        const sid = String(id);
        if (validIdSet.has(sid) && !seen.has(sid)) {
          uniqueIds.push(sid);
          seen.add(sid);
        }
      }
      if (uniqueIds.length === 0) return null;
      return {
        label: typeof g.label === 'string' ? g.label : 'Gợi ý',
        estimatedTotal: Number(g.estimatedTotal) || 0,
        itemIds: uniqueIds,
        reason: typeof g.reason === 'string' ? g.reason : '',
      };
    })
    .filter(Boolean)
    .filter((g) => g.estimatedTotal <= budget);
};

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
      // target = tổng tiền cho 1 người (không nhân people)
      const target = Math.max(0, Math.round((budget * ratio) / people));
      const picked = [];
      let total = 0;
      for (const food of available) {
        if (picked.length >= Math.max(2, Math.ceil(people * 1.5))) break;
        // So sánh tổng phần ăn với target/người (không nhân people)
        if (total + food.price > target) continue;
        picked.push(food);
        total += food.price;
      }
      if (picked.length === 0) return null;
      return {
        label,
        estimatedTotal: total * people, // = tổng cho cả nhóm
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

  const validIds = menuContext.map((m) => m.id.toString());
  const fallbackUpsell = suggestUpsell(budget);

  // Try Groq AI first
  const start = Date.now();
  const aiResult = await generateMenuSuggestions({
    budget,
    people,
    tags,
    preferences,
    menuContext,
  });

  if (aiResult && Array.isArray(aiResult.groups) && aiResult.groups.length) {
    const sanitizedGroups = sanitizeAiGroups(aiResult.groups, validIds, budget);
    const elapsed = Date.now() - start;
    if (sanitizedGroups.length > 0) {
      console.log(
        `[ai:suggest] source=groq restaurant=${restaurantId} budget=${budget} people=${people} groups=${sanitizedGroups.length} elapsed=${elapsed}ms`
      );
      return {
        source: 'groq',
        summary: aiResult.summary || '',
        groups: sanitizedGroups,
        // Merge: nếu AI không trả upsell, dùng fallback
        upsell:
          Array.isArray(aiResult.upsell) && aiResult.upsell.length > 0
            ? aiResult.upsell
            : fallbackUpsell,
        elapsedMs: elapsed,
      };
    }
    // AI trả group nhưng tất cả itemIds không hợp lệ → fallback
    console.warn(
      `[ai:suggest] AI groups invalid after sanitization, fallback to rule-based (restaurant=${restaurantId})`
    );
  }

  // Fallback to rule-based
  const fallback = ruleBasedSuggestion({ budget, people, menuContext });
  const elapsed = Date.now() - start;
  console.log(
    `[ai:suggest] source=rule-based restaurant=${restaurantId} budget=${budget} people=${people} groups=${fallback.groups.length} elapsed=${elapsed}ms`
  );
  return {
    source: 'rule-based',
    ...fallback,
    elapsedMs: elapsed,
  };
};

const chatAboutMenu = async ({ userMessage, history = [], restaurantId }) => {
  if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
    throw new ApiError(400, 'message is required');
  }
  if (userMessage.length > 1000) {
    throw new ApiError(400, 'message too long (max 1000 chars)');
  }

  // Build menu context
  const menu = await foodRepository.find({ restaurantId, isAvailable: true }).catch(() => []);
  const menuItems = menu.map((f) => ({
    name: f.name,
    price: f.price,
    tags: f.tags || [],
  }));

  // Sanitize history: chỉ giữ items có role hợp lệ + content là string
  const ALLOWED_ROLES = new Set(['user', 'assistant']);
  const cleanHistory = (Array.isArray(history) ? history : [])
    .filter((h) => h && typeof h === 'object' && ALLOWED_ROLES.has(h.role) && typeof h.content === 'string')
    .slice(-10)
    .map((h) => ({ role: h.role, content: h.content.slice(0, 1000) }));

  // Try Groq AI
  const start = Date.now();
  const reply = await groqChat({ userMessage: userMessage.trim(), history: cleanHistory, menuItems });
  if (reply) {
    const elapsed = Date.now() - start;
    console.log(`[ai:chat] source=groq restaurant=${restaurantId} elapsed=${elapsed}ms`);
    return {
      source: 'groq',
      reply,
      elapsedMs: elapsed,
    };
  }

  // Fallback
  const elapsed = Date.now() - start;
  console.log(`[ai:chat] source=rule-based restaurant=${restaurantId} elapsed=${elapsed}ms`);
  return {
    source: 'rule-based',
    reply: 'Mình sẵn sàng gợi ý món theo ngân sách. Bạn thử gọi /api/ai/suggest với ngân sách và số người nhé.',
    elapsedMs: elapsed,
  };
};

module.exports = {
  suggestByBudget,
  chatAboutMenu,
  KNOWN_UPSELLS,
};
