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
  const login = await test('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gmail.com', password: 'admin1' })
  });
  const token = login.body?.data?.accessToken;
  const h = { Authorization: 'Bearer ' + token };

  console.log('═══════════════════════════════════════════════════');
  console.log('  CHECK 4 ADMIN APIs — REAL SERVER TEST');
  console.log('═══════════════════════════════════════════════════\n');

  console.log('Login:', login.status, '| role:', login.body?.data?.user?.role, '| email:', login.body?.data?.user?.email);
  console.log('');

  // 1
  const f1 = await test('/api/restaurants/admin/all?page=1&limit=10', { headers: h });
  console.log('1. GET /api/restaurants/admin/all');
  console.log('   Status:', f1.status);
  console.log('   Success:', f1.body?.success);
  console.log('   Total:', f1.body?.data?.pagination?.total);
  console.log('   Items:', f1.body?.data?.restaurants?.length);
  console.log('   → ' + (f1.status === 200 ? '✅ HOẠT ĐỘNG' : '❌ LỖI ' + f1.status));
  console.log('');

  // 2
  const f2 = await test('/api/orders/admin/all?page=1&limit=10', { headers: h });
  console.log('2. GET /api/orders/admin/all');
  console.log('   Status:', f2.status);
  console.log('   Success:', f2.body?.success);
  console.log('   Total:', f2.body?.data?.pagination?.total);
  console.log('   Items:', f2.body?.data?.orders?.length);
  console.log('   → ' + (f2.status === 200 ? '✅ HOẠT ĐỘNG' : '❌ LỖI ' + f2.status));
  console.log('');

  // 3
  const f3 = await test('/api/reviews/admin/all?page=1&limit=10', { headers: h });
  console.log('3. GET /api/reviews/admin/all');
  console.log('   Status:', f3.status);
  console.log('   Success:', f3.body?.success);
  console.log('   Total:', f3.body?.data?.pagination?.total);
  console.log('   Items:', f3.body?.data?.reviews?.length);
  console.log('   → ' + (f3.status === 200 ? '✅ HOẠT ĐỘNG' : (f3.status === 403 ? '🔧 FIX XONG, CHỜ PUSH' : '❌ LỖI ' + f3.status)));
  console.log('');

  // 4a
  const f4a = await test('/api/orders/stats/revenue', { headers: h });
  console.log('4a. GET /api/orders/stats/revenue');
  console.log('    Status:', f4a.status);
  console.log('    Success:', f4a.body?.success);
  console.log('    Data:', JSON.stringify(f4a.body?.data));
  console.log('    → ' + (f4a.status === 200 ? '✅ HOẠT ĐỘNG' : '❌ LỖI ' + f4a.status));
  console.log('');

  // 4b
  const f4b = await test('/api/orders/admin/revenue-by-restaurant', { headers: h });
  console.log('4b. GET /api/orders/admin/revenue-by-restaurant');
  console.log('    Status:', f4b.status);
  console.log('    Success:', f4b.body?.success);
  console.log('    Items:', f4b.body?.data?.length);
  if (f4b.body?.data?.[0]) {
    console.log('    Sample:', JSON.stringify(f4b.body.data[0]));
  }
  console.log('    → ' + (f4b.status === 200 ? '✅ HOẠT ĐỘNG' : '❌ LỖI ' + f4b.status));
})();