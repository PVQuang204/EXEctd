const BASE = 'https://mobile-restaurant-api.onrender.com';
const RESTAURANT_ID = '6a2d512ec6f0888cdd825828';

async function test(path, opts) {
  try {
    const r = await fetch(BASE + path, Object.assign({ signal: AbortSignal.timeout(60000) }, opts || {}));
    let body = null;
    try { body = await r.json(); } catch {}
    return { status: r.status, body };
  } catch (e) {
    return { error: e.message };
  }
}

(async () => {
  console.log('═══════════════════════════════════════════════════');
  console.log('  CHAT & AI APIs — FULL TEST');
  console.log('═══════════════════════════════════════════════════\n');

  // Register customer
  const email = `customer_test_${Date.now()}@gmail.com`;
  const reg = await test('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: 'test123456',
      fullName: 'Test Customer',
      phone: '0900000001'
    })
  });
  const token = reg.body?.data?.accessToken;
  console.log('Register:', reg.status, '✅ Customer token acquired');
  const h = { Authorization: 'Bearer ' + token };

  console.log('Restaurant ID:', RESTAURANT_ID, '\n');

  console.log('═══════════════════════════════════════════════════');
  console.log('  CHAT APIs');
  console.log('═══════════════════════════════════════════════════\n');

  // 1. List conversations
  console.log('1. GET /api/chat/conversations');
  const c1 = await test('/api/chat/conversations', { headers: h });
  console.log('   Status:', c1.status, '| Count:', c1.body?.data?.length);
  console.log('   → ' + (c1.status === 200 ? '✅ HOẠT ĐỘNG' : '❌ LỖI'));
  console.log('');

  // 2. Open conversation
  console.log('2. POST /api/chat/conversations/:restaurantId');
  const c2 = await test(`/api/chat/conversations/${RESTAURANT_ID}`, {
    method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }
  });
  console.log('   Status:', c2.status);
  console.log('   Body:', JSON.stringify(c2.body, null, 2).slice(0, 600));
  const conversationId = c2.body?.data?.conversation?._id || c2.body?.data?._id || c2.body?.data?.id;
  console.log('   Conversation ID:', conversationId);
  console.log('   → ' + (c2.status === 200 || c2.status === 201 ? '✅ HOẠT ĐỘNG' : '❌ LỖI'));
  console.log('');

  // 3. Get messages
  if (conversationId) {
    console.log('3. GET /api/chat/conversations/:id/messages');
    const c3 = await test(`/api/chat/conversations/${conversationId}/messages?page=1&limit=10`, { headers: h });
    console.log('   Status:', c3.status);
    console.log('   Data:', JSON.stringify(c3.body?.data).slice(0, 400));
    console.log('   → ' + (c3.status === 200 ? '✅ HOẠT ĐỘNG' : '❌ LỖI'));
    console.log('');

    // 4. Send message
    console.log('4. POST /api/chat/conversations/:id/messages');
    const c4 = await test(`/api/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { ...h, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Xin chào, nhà hàng còn món không ạ?' })
    });
    console.log('   Status:', c4.status);
    console.log('   Data:', JSON.stringify(c4.body?.data).slice(0, 400));
    console.log('   → ' + (c4.status === 200 || c4.status === 201 ? '✅ HOẠT ĐỘNG' : '⚠️ ' + c4.status));
    console.log('');

    // 5. Mark as read
    console.log('5. POST /api/chat/conversations/:id/read');
    const c5 = await test(`/api/chat/conversations/${conversationId}/read`, {
      method: 'POST', headers: h
    });
    console.log('   Status:', c5.status, '| success:', c5.body?.success);
    console.log('   → ' + (c5.status === 200 ? '✅ HOẠT ĐỘNG' : '⚠️ ' + c5.status));
    console.log('');

    // 6. Close conversation
    console.log('6. POST /api/chat/conversations/:id/close');
    const c6 = await test(`/api/chat/conversations/${conversationId}/close`, {
      method: 'POST', headers: h
    });
    console.log('   Status:', c6.status, '| success:', c6.body?.success);
    console.log('   → ' + (c6.status === 200 ? '✅ HOẠT ĐỘNG' : '⚠️ ' + c6.status));
  } else {
    console.log('⚠️ No conversation ID, skipping remaining tests');
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  AI APIs');
  console.log('═══════════════════════════════════════════════════\n');

  // 7. AI Suggest
  console.log('7. POST /api/ai/suggest');
  const ai1 = await test('/api/ai/suggest', {
    method: 'POST',
    headers: { ...h, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      restaurantId: RESTAURANT_ID,
      budget: 200000,
      peopleCount: 2,
      preferences: ['không cay', 'có hải sản']
    })
  });
  console.log('   Status:', ai1.status);
  console.log('   Data:', JSON.stringify(ai1.body?.data || ai1.body, null, 2).slice(0, 1500));
  console.log('   → ' + (ai1.status === 200 ? '✅ HOẠT ĐỘNG' : '⚠️ ' + ai1.status + ' ' + (ai1.body?.message || '')));
  console.log('');

  // 8. AI Chat
  console.log('8. POST /api/ai/chat');
  const ai2 = await test('/api/ai/chat', {
    method: 'POST',
    headers: { ...h, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      restaurantId: RESTAURANT_ID,
      question: 'Món nào ngon nhất của nhà hàng?'
    })
  });
  console.log('   Status:', ai2.status);
  console.log('   Data:', JSON.stringify(ai2.body?.data || ai2.body, null, 2).slice(0, 1500));
  console.log('   → ' + (ai2.status === 200 ? '✅ HOẠT ĐỘNG' : '⚠️ ' + ai2.status + ' ' + (ai2.body?.message || '')));
})();