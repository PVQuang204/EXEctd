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
  console.log('═══════════════════════════════════════════════════');
  console.log('  AI APIs — FULL TEST WITH TIMING');
  console.log('═══════════════════════════════════════════════════\n');

  // Register customer
  const email = `c${Date.now()}@gmail.com`;
  const reg = await test('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'test123456', fullName: 'Test', phone: '0900000001' })
  });
  const token = reg.body?.data?.accessToken;
  console.log('Register:', reg.status, '| Token:', token ? 'OK' : 'FAIL');
  const h = { Authorization: 'Bearer ' + token };

  // ── 1. Health check ──
  console.log('\n1. GET /api/health');
  const health = await test('/api/health');
  console.log('   Status:', health.status, '| Body:', JSON.stringify(health.body).slice(0, 200));
  console.log('');

  // ── 2. AI /suggest ──
  console.log('2. POST /api/ai/suggest');
  console.log('   Input: { budget: 200000, people: 2, restaurantId: "...", preferences: ["khong cay"] }');
  const t0 = Date.now();
  const ai1 = await test('/api/ai/suggest', {
    method: 'POST',
    headers: { ...h, 'Content-Type': 'application/json' },
    body: JSON.stringify({ budget: 200000, people: 2, restaurantId: RESTAURANT_ID, preferences: ['khong cay'] })
  });
  const t1 = Date.now();
  console.log('   Status:', ai1.status);
  console.log('   Latency:', t1 - t0, 'ms');
  console.log('   Success:', ai1.body?.success);
  console.log('   Source:', ai1.body?.data?.source);
  console.log('   Message:', ai1.body?.message);
  const data1 = JSON.stringify(ai1.body?.data || ai1.body, null, 2);
  console.log('   Data:', data1.slice(0, 1500));
  console.log('');

  // ── 3. AI /chat ──
  console.log('3. POST /api/ai/chat');
  console.log('   Input: { message: "Mon nao ngon nhat?", restaurantId: "..." }');
  const t2 = Date.now();
  const ai2 = await test('/api/ai/chat', {
    method: 'POST',
    headers: { ...h, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Mon nao ngon nhat?', restaurantId: RESTAURANT_ID })
  });
  const t3 = Date.now();
  console.log('   Status:', ai2.status);
  console.log('   Latency:', t3 - t2, 'ms');
  console.log('   Success:', ai2.body?.success);
  console.log('   Source:', ai2.body?.data?.source);
  console.log('   Message:', ai2.body?.message);
  const data2 = JSON.stringify(ai2.body?.data || ai2.body, null, 2);
  console.log('   Data:', data2.slice(0, 1500));
  console.log('');

  // ── Summary ──
  console.log('═══════════════════════════════════════════════════');
  console.log('  KẾT LUẬN');
  console.log('═══════════════════════════════════════════════════');
  const src1 = ai1.body?.data?.source;
  const src2 = ai2.body?.data?.source;
  if (src1 === 'gemini' && src2 === 'gemini') {
    console.log('  ✅ AI liên kết với Groq thực sự');
    console.log('  ✅ /ai/suggest → source: groq');
    console.log('  ✅ /ai/chat → source: groq');
  } else if (src1 === 'rule-based' || src2 === 'rule-based') {
    console.log('  ⚠️  AI đang chạy ở chế độ FALLBACK (rule-based)');
    console.log('  ⚠️  Groq API key chưa được cấu hình trên Render');
    console.log('  ⚠️  Cần thêm GROQ_API_KEY vào Render Environment');
    console.log('     → https://dashboard.render.com → Service → Environment');
  } else {
    console.log('  ❓ Trạng thái không rõ, kiểm tra logs bên trên');
  }
})();