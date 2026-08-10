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
  console.log('=== TRYING admin@gmail.com / admin1 ===\n');
  const r = await test('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gmail.com', password: 'admin1' })
  });
  console.log('  Status:', r.status);
  console.log('  Full response:', JSON.stringify(r.body, null, 2));

  if (r.body?.data?.accessToken) {
    const token = r.body.data.accessToken;
    const role = r.body.data.user?.role;
    console.log(`\n  Token: ${token.slice(0, 40)}...`);
    console.log(`  Role: ${role}`);

    if (role === 'admin') {
      console.log('\n=== TESTING ALL 4 ADMIN FEATURES ===\n');
      const h = { Authorization: 'Bearer ' + token };

      // 1. Restaurants
      const f1 = await test('/api/restaurants/admin/all', { headers: h });
      console.log('1. Danh sách nhà hàng:', f1.status, '| total:', f1.body?.data?.pagination?.total, '| items:', f1.body?.data?.restaurants?.length);

      // 2. Orders
      const f2 = await test('/api/orders/admin/all', { headers: h });
      console.log('2. Đơn hàng:', f2.status, '| total:', f2.body?.data?.pagination?.total, '| items:', f2.body?.data?.orders?.length);

      // 3. Reviews
      const f3 = await test('/api/reviews/admin/all', { headers: h });
      console.log('3. Đánh giá:', f3.status, '| total:', f3.body?.data?.pagination?.total, '| items:', f3.body?.data?.reviews?.length);

      // 4a. Total revenue
      const f4a = await test('/api/orders/stats/revenue', { headers: h });
      console.log('4a. Doanh thu tổng:', f4a.status, '| data:', JSON.stringify(f4a.body?.data).slice(0, 200));

      // 4b. Revenue by restaurant
      const f4b = await test('/api/orders/admin/revenue-by-restaurant', { headers: h });
      console.log('4b. Doanh thu từng nhà hàng:', f4b.status, '| items:', f4b.body?.data?.length);
    } else {
      console.log(`\n  ⚠️ Role is "${role}", not admin. Admin APIs will return 403.`);
    }
  }
})();
