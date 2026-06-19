const http = require('http');

const BASE = 'http://localhost:5000';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

let passed = 0;
let total = 0;

function log(label, msg, color) {
    console.log(`  [${color}${label}${RESET}] ${msg}`);
}

function pass(label, detail) {
    total++; passed++;
    log('PASS', label + (detail ? ` — ${detail}` : ''), GREEN);
}
function fail(label, detail) {
    total++;
    log('FAIL', label + (detail ? ` — ${detail}` : ''), RED);
}

async function request(method, path, body, headers) {
    return new Promise((resolve, reject) => {
        const url = new URL('/api' + path, BASE);
        const options = {
            hostname: url.hostname,
            port: url.port || 80,
            path: url.pathname + url.search,
            method,
            headers: { 'Content-Type': 'application/json', ...headers },
        };
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try { resolve({ statusCode: res.statusCode, body: JSON.parse(data) }); }
                catch { resolve({ statusCode: res.statusCode, body: data }); }
            });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function run() {
    // ============================================================
    // 1. REGISTER CUSTOMER
    // ============================================================
    console.log(`\n${YELLOW}======= STEP 1: REGISTER CUSTOMER =======${RESET}`);
    const ts = Date.now();
    const customerEmail = `testcustomer_${ts}@test.com`;
    const customerPass = 'Test123456';
    const regCust = await request('POST', '/auth/register', {
        email: customerEmail, password: customerPass, fullName: 'Test Customer',
        phone: `0901${String(ts).slice(-7)}`, role: 'customer',
    });
    if (regCust.body?.success) pass('register customer');
    else fail('register customer', JSON.stringify(regCust.body));

    let accessToken = regCust.body?.data?.accessToken;
    if (!accessToken) { console.log(`${RED}CRITICAL: No access token. Stopping.${RESET}`); return; }
    const custHeaders = { Authorization: `Bearer ${accessToken}` };
    log('INFO', 'accessToken obtained', CYAN);

    // ============================================================
    // 2. LOGIN CUSTOMER
    // ============================================================
    console.log(`\n${YELLOW}======= STEP 2: LOGIN CUSTOMER =======${RESET}`);
    const loginCust = await request('POST', '/auth/login', { email: customerEmail, password: customerPass });
    if (loginCust.body?.success) pass('login customer');
    else fail('login customer', JSON.stringify(loginCust.body));

    // ============================================================
    // 3. REGISTER & LOGIN OWNER
    // ============================================================
    console.log(`\n${YELLOW}======= STEP 3: REGISTER & LOGIN OWNER =======${RESET}`);
    const ownerEmail = `testowner_${ts}@test.com`;
    const ownerPass = 'Test123456';
    await request('POST', '/auth/register', {
        email: ownerEmail, password: ownerPass, fullName: 'Test Owner',
        phone: `0902${String(ts).slice(-7)}`, role: 'restaurant_owner',
    });
    const loginOwner = await request('POST', '/auth/login', { email: ownerEmail, password: ownerPass });
    if (loginOwner.body?.success) pass('login owner');
    else fail('login owner', JSON.stringify(loginOwner.body));
    const ownerToken = loginOwner.body?.data?.accessToken;
    const ownerHeaders = { Authorization: `Bearer ${ownerToken}` };

    // ============================================================
    // 4. CREATE RESTAURANT
    // ============================================================
    console.log(`\n${YELLOW}======= STEP 4: CREATE RESTAURANT =======${RESET}`);
    const createRest = await request('POST', '/restaurants', {
        name: `Test Restaurant ${ts}`, address: '123 Test Street',
        phone: `0903${String(ts).slice(-7)}`, cuisineType: 'Vietnamese',
        description: 'A test restaurant', openTime: '08:00', closeTime: '22:00',
    }, ownerHeaders);
    if (createRest.body?.success) pass('create restaurant');
    else fail('create restaurant', JSON.stringify(createRest.body));
    const restaurantId = createRest.body?.data?._id || createRest.body?.data?.id;
    log('INFO', `restaurantId = ${restaurantId}`, CYAN);

    // ============================================================
    // 5. MENU CRUD
    // ============================================================
    console.log(`\n${YELLOW}======= STEP 5: MENU CRUD =======${RESET}`);

    const createCat = await request('POST', `/menu/${restaurantId}/categories`, { name: 'Món chính' }, ownerHeaders);
    if (createCat.body?.success) pass('create category');
    else fail('create category', JSON.stringify(createCat.body));
    const categoryId = createCat.body?.data?._id || createCat.body?.data?.id;
    log('INFO', `categoryId = ${categoryId}`, CYAN);

    const getCats = await request('GET', `/menu/${restaurantId}/categories`);
    if (getCats.body?.success) pass('get categories');
    else fail('get categories', JSON.stringify(getCats.body));

    const createFood = await request('POST', '/menu/foods', {
        restaurantId,
        name: `Phở Bò Test ${ts}`, description: 'Test pho', price: 55000,
        categoryId, isAvailable: true, tags: ['best_seller'],
    }, ownerHeaders);
    if (createFood.body?.success) pass('create food');
    else fail('create food', JSON.stringify(createFood.body));
    const foodId = createFood.body?.data?._id || createFood.body?.data?.id;
    log('INFO', `foodId = ${foodId}`, CYAN);

    const getFoods = await request('GET', `/menu/${restaurantId}/foods`);
    if (getFoods.body?.success) pass('get foods');
    else fail('get foods', JSON.stringify(getFoods.body));

    if (foodId) {
        const updateFood = await request('PUT', `/menu/foods/${foodId}`, {
            restaurantId,
            name: `Phở Bò Updated ${ts}`, price: 60000,
        }, ownerHeaders);
        if (updateFood.body?.success) pass('update food');
        else fail('update food', JSON.stringify(updateFood.body));

        const toggleOff = await request('PUT', `/menu/foods/${foodId}`, { isAvailable: false }, ownerHeaders);
        if (toggleOff.body?.success) pass('toggle food OFF');
        else fail('toggle food OFF', JSON.stringify(toggleOff.body));

        const toggleOn = await request('PUT', `/menu/foods/${foodId}`, { isAvailable: true }, ownerHeaders);
        if (toggleOn.body?.success) pass('toggle food ON');
        else fail('toggle food ON', JSON.stringify(toggleOn.body));
    }

    // ============================================================
    // 6. COMBO CRUD
    // ============================================================
    console.log(`\n${YELLOW}======= STEP 6: COMBO CRUD =======${RESET}`);

    const createCombo = await request('POST', '/menu/combos', {
        restaurantId,
        name: `Combo Test ${ts}`, description: 'Test combo description',
        price: 150000, serves: '2-3 người',
        items: foodId ? [{ foodId, quantity: 1 }] : [],
        isActive: true,
    }, ownerHeaders);
    if (createCombo.body?.success) pass('create combo');
    else fail('create combo', JSON.stringify(createCombo.body));
    const comboId = createCombo.body?.data?._id || createCombo.body?.data?.id;
    log('INFO', `comboId = ${comboId}`, CYAN);

    const getCombos = await request('GET', `/menu/${restaurantId}/combos`);
    if (getCombos.body?.success) pass('get combos');
    else fail('get combos', JSON.stringify(getCombos.body));

    if (comboId) {
        const updateCombo = await request('PUT', `/menu/combos/${comboId}`, {
            name: `Combo Updated ${ts}`, price: 160000,
        }, ownerHeaders);
        if (updateCombo.body?.success) pass('update combo');
        else fail('update combo', JSON.stringify(updateCombo.body));

        const toggleComboOff = await request('PUT', `/menu/combos/${comboId}`, { isActive: false }, ownerHeaders);
        if (toggleComboOff.body?.success) pass('toggle combo OFF');
        else fail('toggle combo OFF', JSON.stringify(toggleComboOff.body));

        const toggleComboOn = await request('PUT', `/menu/combos/${comboId}`, { isActive: true }, ownerHeaders);
        if (toggleComboOn.body?.success) pass('toggle combo ON');
        else fail('toggle combo ON', JSON.stringify(toggleComboOn.body));
    }

    // ============================================================
    // 7. CREATE ORDERS
    // ============================================================
    console.log(`\n${YELLOW}======= STEP 7: CREATE ORDERS =======${RESET}`);

    const createOrder = await request('POST', '/orders', {
        restaurantId,
        items: [{ foodId, name: `Phở Bò Test ${ts}`, price: 55000, quantity: 2, subtotal: 110000 }],
        totalAmount: 110000,
        deliveryAddress: '123 Delivery St', deliveryPhone: '0901123456',
        deliveryName: 'Test Customer', note: 'Test order',
    }, custHeaders);
    if (createOrder.body?.success) pass('create order');
    else fail('create order', JSON.stringify(createOrder.body));
    const orderId = createOrder.body?.data?._id || createOrder.body?.data?.id;
    log('INFO', `orderId = ${orderId}`, CYAN);

    const getMyOrders = await request('GET', '/orders/my', null, custHeaders);
    if (getMyOrders.body?.success) pass('get my orders');
    else fail('get my orders', JSON.stringify(getMyOrders.body));

    const getRestOrders = await request('GET', '/orders/restaurant', null, ownerHeaders);
    if (getRestOrders.body?.success) pass('get restaurant orders');
    else fail('get restaurant orders', JSON.stringify(getRestOrders.body));

    // ============================================================
    // 8. PAYMENT FLOW
    // ============================================================
    console.log(`\n${YELLOW}======= STEP 8: PAYMENT FLOW =======${RESET}`);

    if (orderId) {
        // PayOS
        const payPayOS = await request('POST', `/payments/${orderId}`, { paymentMethod: 'payos' }, custHeaders);
        if (payPayOS.body?.success) {
            pass('create PayOS payment');
            const payUrl = payPayOS.body.data?.paymentUrl;
            log('INFO', `checkoutUrl: ${payUrl ? payUrl.substring(0, 70) + '...' : 'N/A'}`, CYAN);
        } else {
            fail('create PayOS payment', JSON.stringify(payPayOS.body));
        }

        // 2nd order for COD
        const order2 = await request('POST', '/orders', {
            restaurantId,
            items: [{ foodId, name: 'Test Food 2', price: 55000, quantity: 1, subtotal: 55000 }],
            totalAmount: 55000, deliveryAddress: '123 Delivery St',
            deliveryPhone: '0901123456', deliveryName: 'Test Customer',
        }, custHeaders);
        const order2Id = order2.body?.data?._id || order2.body?.data?.id;

        const payCOD = await request('POST', `/payments/${order2Id}`, { paymentMethod: 'cod' }, custHeaders);
        if (payCOD.body?.success) pass('create COD payment');
        else fail('create COD payment', JSON.stringify(payCOD.body));

        const codConfirm = await request('PATCH', `/payments/${order2Id}/cod-confirm`, null, ownerHeaders);
        if (codConfirm.body?.success) pass('owner confirms COD');
        else fail('owner confirms COD', JSON.stringify(codConfirm.body));
    } else {
        fail('create PayOS payment (no orderId)');
        fail('create COD payment (no orderId)');
        fail('owner confirms COD (no orderId)');
    }

    // ============================================================
    // 9. ORDER STATUS TRANSITIONS
    // ============================================================
    console.log(`\n${YELLOW}======= STEP 9: ORDER STATUS UPDATE =======${RESET}`);

    if (orderId) {
        for (const status of ['confirmed', 'preparing', 'ready', 'completed']) {
            const r = await request('PATCH', `/orders/${orderId}/status`, { status }, ownerHeaders);
            if (r.body?.success) pass(`update status → ${status}`);
            else fail(`update status → ${status}`, JSON.stringify(r.body));
        }
    }

    // ============================================================
    // 10. REVENUE & STATS
    // ============================================================
    console.log(`\n${YELLOW}======= STEP 10: REVENUE & STATS =======${RESET}`);

    const revenue = await request('GET', `/orders/stats/revenue?restaurantId=${restaurantId}`, null, ownerHeaders);
    if (revenue.body?.success) {
        pass('get revenue stats');
        log('INFO', `totalRevenue: ${revenue.body.data?.totalRevenue}`, CYAN);
    } else fail('get revenue stats', JSON.stringify(revenue.body));

    if (restaurantId) {
        const topFoods = await request('GET', `/orders/stats/top-foods/${restaurantId}`, null, ownerHeaders);
        if (topFoods.body?.success) pass('get top foods');
        else fail('get top foods', JSON.stringify(topFoods.body));
    }

    // ============================================================
    // 11. SECURITY TESTS
    // ============================================================
    console.log(`\n${YELLOW}======= STEP 11: AUTH / SECURITY TESTS =======${RESET}`);

    const noAuth = await request('GET', '/orders/my');
    if (noAuth.statusCode === 401) pass('GET /orders/my without auth → 401');
    else fail('GET /orders/my without auth → 401', `got ${noAuth.statusCode}`);

    const wrongRole = await request('POST', '/menu/foods', { name: 'Hack' }, custHeaders);
    if (wrongRole.statusCode === 403) pass('POST /menu/foods as customer → 403');
    else fail('POST /menu/foods as customer → 403', `got ${wrongRole.statusCode}`);

    // ============================================================
    // CLEANUP
    // ============================================================
    console.log(`\n${YELLOW}======= CLEANUP =======${RESET}`);
    if (foodId && restaurantId) {
        const d = await request('DELETE', `/menu/foods/${foodId}`, null, ownerHeaders);
        log('INFO', `delete food: ${d.body?.success ? 'OK' : d.body?.message}`, CYAN);
    }
    if (comboId && restaurantId) {
        const d = await request('DELETE', `/menu/combos/${comboId}`, null, ownerHeaders);
        log('INFO', `delete combo: ${d.body?.success ? 'OK' : d.body?.message}`, CYAN);
    }
    if (categoryId && restaurantId) {
        const d = await request('DELETE', `/menu/${restaurantId}/categories/${categoryId}`, null, ownerHeaders);
        log('INFO', `delete category: ${d.body?.success ? 'OK' : d.body?.message}`, CYAN);
    }

    // ============================================================
    // SUMMARY
    // ============================================================
    console.log(`\n${YELLOW}========================================${RESET}`);
    const pct = total > 0 ? Math.round((passed / total) * 100) : 0;
    const color = passed === total ? GREEN : YELLOW;
    console.log(`${color}  RESULTS: ${passed} / ${total} tests passed (${pct}%)${RESET}`);
    console.log(`${YELLOW}========================================\n${RESET}`);
    if (passed < total) console.log(`${YELLOW}Some tests failed. Review output above.${RESET}`);
    else console.log(`${GREEN}All tests passed!${RESET}`);
}

run().catch(err => {
    console.error(`${RED}Script error: ${err.message}${RESET}`);
    process.exit(1);
});
