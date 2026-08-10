const BASE = 'https://mobile-restaurant-api.onrender.com';

async function test(path, opts) {
  try {
    const r = await fetch(BASE + path, Object.assign({ signal: AbortSignal.timeout(30000) }, opts || {}));
    let body = null;
    try { body = await r.json(); } catch {}
    return { status: r.status, body };
  } catch (e) {
    return { error: e.message };
  }
}

(async () => {
  // Test 1: AI routes exist (no auth)
  console.log('=== AI ROUTES EXIST CHECK ===');
  const r1 = await test('/api/ai/chat');
  console.log('  POST /api/ai/chat (GET):', r1.status, r1.status === 404 ? '❌ MISSING' : '✅ EXISTS');
  const r2 = await test('/api/ai/suggest');
  console.log('  POST /api/ai/suggest:', r2.status, r2.status === 404 ? '❌ MISSING' : '✅ EXISTS');
  const r3 = await test('/api/ai/recommend');
  console.log('  POST /api/ai/recommend:', r3.status, r3.status === 404 ? '❌ MISSING' : '✅ EXISTS');

  // Test 2: AI chat requires auth?
  console.log('\n=== AI CHAT WITH EMPTY BODY (no auth) ===');
  const r4 = await test('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  console.log('  Status:', r4.status);
  console.log('  Response:', JSON.stringify(r4.body).slice(0, 300));

  // Test 3: AI chat with valid body (no auth)
  console.log('\n=== AI CHAT WITH MESSAGE (no auth) ===');
  const r5 = await test('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Xin chào, bạn có gì?' })
  });
  console.log('  Status:', r5.status);
  console.log('  Response:', JSON.stringify(r5.body).slice(0, 500));

  // Test 4: Need real customer to test properly
  console.log('\n=== AI CHAT WITH CUSTOMER ===');
  const email = 'aitest+' + Date.now() + '@test.com';
  const reg = await test('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName: 'AI Tester', email, password: 'Test123456', role: 'customer' })
  });
  const token = reg.body?.data?.accessToken;
  if (token) {
    console.log('  Customer registered:', email);

    const r6 = await test('/api/ai/chat', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Gợi ý cho tôi món ăn ngon' })
    });
    console.log('  Status:', r6.status, '| success:', r6.body?.success);
    console.log('  Message:', r6.body?.data?.message?.slice(0, 300) || r6.body?.message);
    console.log('  Model:', r6.body?.data?.model || 'N/A');
    console.log('  Full data keys:', Object.keys(r6.body?.data || {}).join(', '));

    // Test restaurant suggest
    const r7 = await test('/api/ai/recommend-restaurants', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Tôi muốn ăn cơm' })
    });
    console.log('  Recommend restaurants:', r7.status, '| success:', r7.body?.success);
  } else {
    console.log('  Failed to register customer:', reg.body?.message);
  }
})().catch(e => console.error('FATAL:', e.message));
