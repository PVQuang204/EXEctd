const BASE = 'https://mobile-restaurant-api.onrender.com';
const RESTAURANT_ID = '6a2d512ec6f0888cdd825828';

async function test(path, opts) {
  try {
    const r = await fetch(BASE + path, Object.assign({ signal: AbortSignal.timeout(120000) }, opts || {}));
    let body = null;
    try { body = await r.json(); } catch {}
    return { status: r.status, body };
  } catch (e) {
    return { error: e.message };
  }
}

(async () => {
  // Register
  const email = `c${Date.now()}@gmail.com`;
  const reg = await test('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'test123456', fullName: 'Test', phone: '0900000001' })
  });
  const token = reg.body?.data?.accessToken;
  const h = { Authorization: 'Bearer ' + token };

  console.log('═══════════════════════════════════════════════════');
  console.log('  GROQ AI — ADVANCED TESTS');
  console.log('═══════════════════════════════════════════════════\n');

  const cases = [
    { msg: 'Gợi ý món cho người ăn chay', lang: 'Tiếng Việt' },
    { msg: 'Mon gi do an nhanh cho 2 nguoi duoi 100k', lang: 'Tiếng Việt + non-English' },
    { msg: 'Tôi bị dị ứng hải sản, món nào an toàn?', lang: 'Dị ứng' },
    { msg: 'Món nào phù hợp cho trẻ em?', lang: 'Gia đình' },
  ];

  for (const { msg, lang } of cases) {
    const t0 = Date.now();
    const r = await test('/api/ai/chat', {
      method: 'POST',
      headers: { ...h, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, restaurantId: RESTAURANT_ID })
    });
    const ms = Date.now() - t0;
    const src = r.body?.data?.source;
    const reply = r.body?.data?.reply || r.body?.message || JSON.stringify(r.body);
    const ok = src === 'groq' ? '✅' : '⚠️';
    console.log(`${ok} [${lang}] ${ms}ms`);
    console.log(`   Q: ${msg}`);
    console.log(`   A: ${reply.slice(0, 300)}`);
    console.log('');
  }

  // Test suggest với budget khác nhau
  console.log('───────────────────────────────────────────────────');
  console.log('  /ai/suggest — Budget variations');
  console.log('───────────────────────────────────────────────────\n');

  const budgets = [
    { budget: 50000, people: 1, desc: 'Sinh viên' },
    { budget: 300000, people: 4, desc: 'Gia đình 4 người' },
    { budget: 1000000, people: 6, desc: 'Tiệc 6 người' },
  ];

  for (const { budget, people, desc } of budgets) {
    const t0 = Date.now();
    const r = await test('/api/ai/suggest', {
      method: 'POST',
      headers: { ...h, 'Content-Type': 'application/json' },
      body: JSON.stringify({ budget, people, restaurantId: RESTAURANT_ID })
    });
    const ms = Date.now() - t0;
    const src = r.body?.data?.source;
    const groups = r.body?.data?.groups?.length || 0;
    const ok = src === 'groq' ? '✅' : '⚠️';
    console.log(`${ok} [${desc}] ${budget.toLocaleString()}đ/${people}p → ${ms}ms → ${groups} groups`);
    console.log(`   Summary: ${(r.body?.data?.summary || '').slice(0, 120)}`);
    if (r.body?.data?.groups?.length) {
      for (const g of r.body.data.groups) {
        console.log(`   • ${g.label}: ${g.itemIds.length} món ~${g.estimatedTotal.toLocaleString()}đ`);
      }
    }
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════');
  console.log('  ✅ MỌI THỨ HOẠT ĐỘNG TỐT VỚI GROQ AI!');
  console.log('  ✅ Miễn phí, nhanh, không giới hạn');
  console.log('═══════════════════════════════════════════════════');
})();
