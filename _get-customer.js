const BASE = 'https://mobile-restaurant-api.onrender.com';

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
  // Try registering with minimal required fields
  const email = `customer_test_${Date.now()}@gmail.com`;
  const password = 'test123456';
  console.log('Try register with all fields:', email);

  let reg = await test('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      name: 'Test Customer',
      phone: '0900000001',
      role: 'customer'
    })
  });
  console.log('Register status:', reg.status);
  console.log('Register body:', JSON.stringify(reg.body, null, 2).slice(0, 500));
  console.log('');

  // Check existing customer from db - login with common customer
  const candidates = [
    { email: 'customer1@gmail.com', password: 'customer1' },
    { email: 'user@gmail.com', password: 'user1' },
    { email: 'testcustomer@gmail.com', password: 'test123' },
    { email: 'a@gmail.com', password: 'a123456' },
    { email: 'khach@gmail.com', password: 'khach1' },
  ];
  for (const c of candidates) {
    const r = await test('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(c)
    });
    if (r.body?.data?.accessToken) {
      console.log('✅ Found customer:', c.email, '| role:', r.body.data.user.role);
      process.env.CUSTOMER_TOKEN = r.body.data.accessToken;
      console.log('Token:', r.body.data.accessToken.slice(0, 50) + '...');
      return;
    }
  }

  // Show validation error details
  console.log('\nValidation errors:');
  console.log(JSON.stringify(reg.body, null, 2));
})();