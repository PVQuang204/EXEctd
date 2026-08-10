const BASE = 'https://mobile-restaurant-api.onrender.com';

async function test(path, opts) {
  try {
    const r = await fetch(BASE + path, Object.assign({ signal: AbortSignal.timeout(30000) }, opts || {}));
    let body = null;
    try { body = await r.json(); } catch {}
    return { status: r.status, body, allow: r.headers.get('allow') };
  } catch (e) {
    return { error: e.message };
  }
}

(async () => {
  console.log('=== COMPREHENSIVE CHECK: /api/orders/admin* ===\n');

  // Login first
  const login = await test('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gmail.com', password: 'admin1' })
  });
  const token = login.body?.data?.accessToken;
  console.log('Admin login:', login.status, '| role:', login.body?.data?.user?.role, '\n');

  const h = { Authorization: 'Bearer ' + token };
  const variants = [
    '/api/orders/admin',
    '/api/orders/admin/',
    '/api/orders/admin/all',
    '/api/orders/admin/orders',
    '/api/orders/admin/list',
    '/api/admin/orders',
  ];

  console.log('=== WITH ADMIN TOKEN ===');
  for (const p of variants) {
    const r = await test(p, { headers: h });
    console.log(`  GET ${p.padEnd(35)} status=${r.status}  success=${r.body?.success}  msg=${r.body?.message?.slice(0, 60) || '-'}`);
  }

  console.log('\n=== WITHOUT TOKEN (just to see if route exists) ===');
  for (const p of variants) {
    const r = await test(p);
    const exists = r.status !== 404;
    console.log(`  GET ${p.padEnd(35)} status=${r.status}  ${exists ? '✅ EXISTS' : '❌ 404 (not found)'}`);
  }

  console.log('\n=== REAL CHECK: source code ===\n');
})();