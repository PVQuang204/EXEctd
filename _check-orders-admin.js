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
  console.log('=== CHECK EXACT ENDPOINT ===\n');
  const paths = [
    '/api/orders/admin',
    '/api/orders/admin/',
    '/api/orders/admin/all',
    '/api/orders/admin/list',
  ];
  for (const p of paths) {
    const r = await test(p);
    console.log(`  GET ${p}: status=${r.status}`);
  }

  console.log('\n=== ALL ROUTES under /api/orders (OPTIONS) ===\n');
  for (const p of ['/api/orders', '/api/orders/admin/all', '/api/orders/admin/revenue-by-restaurant', '/api/orders/stats/revenue']) {
    const r = await test(p, { method: 'OPTIONS' });
    console.log(`  OPTIONS ${p}: status=${r.status}, allow=${r.body?.headers?.allow || 'N/A'}`);
  }
})();
