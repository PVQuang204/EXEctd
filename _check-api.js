const BASE = 'https://mobile-restaurant-api.onrender.com';

async function test(path, opts) {
  try {
    const r = await fetch(BASE + path, Object.assign({ signal: AbortSignal.timeout(15000) }, opts || {}));
    let body = null;
    try { body = await r.json(); } catch {}
    return { status: r.status, body };
  } catch (e) {
    return { error: e.message };
  }
}

(async () => {
  console.log('=== SERVER HEALTH ===');
  const health = await test('/api/health');
  console.log('Health:', health.status, '| ts:', health.body?.timestamp);

  // Check if admin routes exist (401 = route exists, no token; 404 = route missing)
  console.log('\n=== ADMIN ROUTES EXIST CHECK (no auth) ===');
  const e1 = await test('/api/restaurants/admin/all');
  console.log('  /api/restaurants/admin/all:', e1.status, e1.status === 401 ? '✅ EXISTS' : e1.status === 404 ? '❌ MISSING' : '?');
  const e2 = await test('/api/orders/admin/all');
  console.log('  /api/orders/admin/all:', e2.status, e2.status === 401 ? '✅ EXISTS' : e2.status === 404 ? '❌ MISSING' : '?');
  const e3 = await test('/api/reviews/admin/all');
  console.log('  /api/reviews/admin/all:', e3.status, e3.status === 401 ? '✅ EXISTS' : e3.status === 404 ? '❌ MISSING' : '?');
  const e4 = await test('/api/orders/admin/revenue-by-restaurant');
  console.log('  /api/orders/admin/revenue-by-restaurant:', e4.status, e4.status === 401 ? '✅ EXISTS' : e4.status === 404 ? '❌ MISSING' : '?');
  const e5 = await test('/api/dashboard/admin');
  console.log('  /api/dashboard/admin:', e5.status, e5.status === 401 ? '✅ EXISTS' : e5.status === 404 ? '❌ MISSING' : '?');

  // Try existing admin accounts
  console.log('\n=== TRY EXISTING ADMIN ACCOUNTS ===');
  const admins = [
    { email: 'admin@restaurant.com', password: 'Admin123456' },
    { email: 'admin@test.com', password: 'Test123456' },
    { email: 'admin123@test.com', password: 'Test123456' },
    { email: 'superadmin@test.com', password: 'Admin123456' },
  ];
  let adminToken = null;
  for (const a of admins) {
    const r = await test('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(a)
    });
    if (r.body?.data?.accessToken) {
      const role = r.body.data.user?.role;
      console.log(`  ${a.email}: role=${role}${role === 'admin' ? ' ✅' : ' ❌'}`);
      if (role === 'admin') adminToken = r.body.data.accessToken;
    } else {
      console.log(`  ${a.email}: no access`);
    }
  }

  if (adminToken) {
    console.log('\n=== FULL ADMIN API TEST ===');
    const h = { Authorization: 'Bearer ' + adminToken, 'Content-Type': 'application/json' };
    const ok = (label, r) => console.log(`  ${label}: ${r.status} ${r.body?.success ? '✅' : '❌'} | msg: ${r.body?.message || ''}`);
    const r1 = await test('/api/restaurants/admin/all?page=1&limit=5', { headers: h });
    ok('Restaurants', r1);
    if (r1.body?.success) console.log('  total:', r1.body.data.pagination.total);
    const r2 = await test('/api/orders/admin/all?page=1&limit=5', { headers: h });
    ok('Orders', r2);
    if (r2.body?.success) console.log('  total:', r2.body.data.pagination.total);
    const r3 = await test('/api/reviews/admin/all?page=1&limit=5', { headers: h });
    ok('Reviews', r3);
    if (r3.body?.success) console.log('  total:', r3.body.data.pagination.total);
    const r4 = await test('/api/orders/admin/revenue-by-restaurant', { headers: h });
    ok('Revenue by restaurant', r4);
    const r5 = await test('/api/dashboard/admin', { headers: h });
    ok('Dashboard', r5);
    if (r5.body?.data?.stats) {
      console.log('  users:', r5.body.data.stats.totalUsers, '| restaurants:', r5.body.data.stats.totalRestaurants, '| orders:', r5.body.data.stats.totalOrders, '| revenue:', r5.body.data.stats.monthlyRevenue);
    }
  } else {
    console.log('\nNo admin account found. Create one via MongoDB Atlas dashboard.');
  }
})().catch(e => console.error('FATAL:', e.message));
