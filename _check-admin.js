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
  console.log('========================================');
  console.log('   CHECK ADMIN FEATURES ON SERVER');
  console.log('========================================\n');

  // Step 1: Create admin user via direct DB (will fail if secret differs)
  // Try login as admin first
  console.log('=== STEP 1: FIND ADMIN ACCOUNT ===\n');
  const admins = [
    { email: 'admin@restaurant.com', password: 'Admin123456' },
    { email: 'admin@exectd.com', password: 'Admin123456' },
    { email: 'admin@test.com', password: 'Test123456' },
    { email: 'superadmin@test.com', password: 'Admin123456' },
    { email: 'admin@admin.com', password: 'admin123' },
    { email: 'admin@gmail.com', password: 'admin123' },
  ];
  let adminToken = null;
  for (const a of admins) {
    const r = await test('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(a)
    });
    if (r.body?.data?.accessToken && r.body?.data?.user?.role === 'admin') {
      adminToken = r.body.data.accessToken;
      console.log(`  ✅ Found admin: ${a.email}`);
      break;
    } else {
      const role = r.body?.data?.user?.role || 'N/A';
      const msg = r.body?.message || 'N/A';
      console.log(`  ❌ ${a.email}: ${msg} (role=${role})`);
    }
  }

  if (!adminToken) {
    console.log('\n  ⚠️ No admin account found.');
    console.log('  To test admin features, create admin in MongoDB Atlas:');
    console.log('  { email: "admin@exectd.com", password: "Admin123456", role: "admin", status: "active" }');
    console.log('\n  Will check route existence only (without auth):\n');
  }

  const h = adminToken
    ? { Authorization: 'Bearer ' + adminToken, 'Content-Type': 'application/json' }
    : null;

  // ============================================================
  // FEATURE 1: Admin danh sách nhà hàng
  // ============================================================
  console.log('\n========================================');
  console.log('  1. ADMIN DANH SÁCH NHÀ HÀNG');
  console.log('========================================');
  const f1 = await test('/api/restaurants/admin/all?page=1&limit=5', h ? { headers: h } : {});
  console.log(`  Status: ${f1.status}`);
  console.log(`  Route exists: ${f1.status === 404 ? '❌ MISSING' : '✅ EXISTS'}`);
  if (f1.body?.success) {
    console.log(`  Success: ${f1.body.success}`);
    console.log(`  Total restaurants: ${f1.body.data?.pagination?.total}`);
    console.log(`  Items returned: ${f1.body.data?.restaurants?.length}`);
    console.log(`  ✅ FEATURE WORKS`);
  } else if (f1.body?.message) {
    console.log(`  Message: ${f1.body.message}`);
    if (f1.status === 401) console.log(`  ⚠️ Need admin token`);
  }

  // ============================================================
  // FEATURE 2: Admin quản lý đơn hàng
  // ============================================================
  console.log('\n========================================');
  console.log('  2. ADMIN QUẢN LÝ ĐƠN HÀNG');
  console.log('========================================');
  const f2 = await test('/api/orders/admin/all?page=1&limit=5', h ? { headers: h } : {});
  console.log(`  Status: ${f2.status}`);
  console.log(`  Route exists: ${f2.status === 404 ? '❌ MISSING' : '✅ EXISTS'}`);
  if (f2.body?.success) {
    console.log(`  Success: ${f2.body.success}`);
    console.log(`  Total orders: ${f2.body.data?.pagination?.total}`);
    console.log(`  Items returned: ${f2.body.data?.orders?.length}`);
    console.log(`  ✅ FEATURE WORKS`);
  } else if (f2.body?.message) {
    console.log(`  Message: ${f2.body.message}`);
    if (f2.status === 401) console.log(`  ⚠️ Need admin token`);
  }

  // ============================================================
  // FEATURE 3: Admin quản lý đánh giá
  // ============================================================
  console.log('\n========================================');
  console.log('  3. ADMIN QUẢN LÝ ĐÁNH GIÁ (FEEDBACK)');
  console.log('========================================');
  const f3 = await test('/api/reviews/admin/all?page=1&limit=5', h ? { headers: h } : {});
  console.log(`  Status: ${f3.status}`);
  console.log(`  Route exists: ${f3.status === 404 ? '❌ MISSING' : '✅ EXISTS'}`);
  if (f3.body?.success) {
    console.log(`  Success: ${f3.body.success}`);
    console.log(`  Total reviews: ${f3.body.data?.pagination?.total}`);
    console.log(`  Items returned: ${f3.body.data?.reviews?.length}`);
    console.log(`  ✅ FEATURE WORKS`);
  } else if (f3.body?.message) {
    console.log(`  Message: ${f3.body.message}`);
    if (f3.status === 401) console.log(`  ⚠️ Need admin token`);
  }

  // ============================================================
  // FEATURE 4: Admin doanh thu tổng & từng nhà hàng
  // ============================================================
  console.log('\n========================================');
  console.log('  4. ADMIN DOANH THU TỔNG & TỪNG NHÀ HÀNG');
  console.log('========================================');

  // 4a. Total revenue (no restaurantId)
  const f4a = await test('/api/orders/stats/revenue', h ? { headers: h } : {});
  console.log(`  4a. Doanh thu TỔNG (stats/revenue):`);
  console.log(`      Status: ${f4a.status}`);
  console.log(`      Route exists: ${f4a.status === 404 ? '❌ MISSING' : '✅ EXISTS'}`);
  if (f4a.body?.success) {
    console.log(`      Data: ${JSON.stringify(f4a.body.data).slice(0, 200)}`);
    console.log(`      ✅ FEATURE WORKS`);
  } else if (f4a.body?.message) {
    console.log(`      Message: ${f4a.body.message}`);
  }

  // 4b. Revenue by restaurant
  const f4b = await test('/api/orders/admin/revenue-by-restaurant', h ? { headers: h } : {});
  console.log(`\n  4b. Doanh thu theo NHÀ HÀNG (admin/revenue-by-restaurant):`);
  console.log(`      Status: ${f4b.status}`);
  console.log(`      Route exists: ${f4b.status === 404 ? '❌ MISSING' : '✅ EXISTS'}`);
  if (f4b.body?.success) {
    console.log(`      Items: ${f4b.body.data?.length}`);
    if (f4b.body.data?.length > 0) {
      console.log(`      Top: ${f4b.body.data[0].name} | revenue: ${f4b.body.data[0].totalRevenue} | orders: ${f4b.body.data[0].orderCount}`);
    }
    console.log(`      ✅ FEATURE WORKS`);
  } else if (f4b.body?.message) {
    console.log(`      Message: ${f4b.body.message}`);
  }

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log('\n\n========================================');
  console.log('           TỔNG KẾT');
  console.log('========================================\n');
  const results = [
    ['1. Admin danh sách nhà hàng', f1.status !== 404],
    ['2. Admin quản lý đơn hàng', f2.status !== 404],
    ['3. Admin quản lý đánh giá', f3.status !== 404],
    ['4a. Admin doanh thu tổng', f4a.status !== 404],
    ['4b. Admin doanh thu từng nhà hàng', f4b.status !== 404],
  ];
  results.forEach(([name, ok]) => {
    console.log(`  ${ok ? '✅' : '❌'} ${name}`);
  });

  const allRoutesExist = results.every(r => r[1]);
  console.log(`\n  ${allRoutesExist ? '✅' : '❌'} Tất cả routes ĐÃ TỒN TẠI trên server`);
  console.log(`  ${adminToken ? '✅' : '⚠️'} Cần admin token để test chức năng thực tế`);

})().catch(e => console.error('FATAL:', e.message));
