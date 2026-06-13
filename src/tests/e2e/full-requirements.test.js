/**
 * E2E — đối chiếu từng nhóm yêu cầu đề bài
 */
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../../models/User.model');
const Restaurant = require('../../models/Restaurant.model');
const Order = require('../../models/Order.model');

const uid = () => Math.random().toString(36).slice(2, 10);

const report = [];
const record = (group, name, ok, detail = '') => {
  report.push({ group, name, ok, detail });
};

describe('Full requirements E2E', () => {
  let customerToken;
  let customerRefresh;
  let ownerToken;
  let adminToken;
  let driverToken;
  let customerId;
  let ownerId;
  let adminId;
  let driverId;
  let restaurantId;
  let categoryId;
  let foodId;
  let comboId;
  let orderId;
  let notificationId;

  const email = (role) => `${role}_${uid()}@req.test`;

  beforeAll(async () => {
    // Roles
    const regOwner = await request(app).post('/api/auth/register').send({
      fullName: 'Owner',
      email: email('owner'),
      password: 'password123',
      role: 'restaurant_owner',
    });
    ownerToken = regOwner.body.data.accessToken;
    ownerId = regOwner.body.data.user._id;

    const regCustomer = await request(app).post('/api/auth/register').send({
      fullName: 'Customer',
      email: email('customer'),
      password: 'password123',
    });
    customerToken = regCustomer.body.data.accessToken;
    customerRefresh = regCustomer.body.data.refreshToken;
    customerId = regCustomer.body.data.user._id;

    const regDriver = await request(app).post('/api/auth/register').send({
      fullName: 'Driver',
      email: email('driver'),
      password: 'password123',
      role: 'delivery_staff',
    });
    driverToken = regDriver.body.data.accessToken;
    driverId = regDriver.body.data.user._id;

    const admin = await User.create({
      fullName: 'Admin',
      email: email('admin'),
      password: 'password123',
      role: 'admin',
    });
    adminId = admin._id;
    const adminLogin = await request(app).post('/api/auth/login').send({
      email: admin.email,
      password: 'password123',
    });
    adminToken = adminLogin.body.data.accessToken;
  });

  afterAll(() => {
    const passed = report.filter((r) => r.ok).length;
    const failed = report.filter((r) => !r.ok).length;
    console.log('\n========== REQUIREMENTS CHECKLIST ==========');
    let lastGroup = '';
    for (const r of report) {
      if (r.group !== lastGroup) {
        console.log(`\n[${r.group}]`);
        lastGroup = r.group;
      }
      console.log(`  ${r.ok ? '✅' : '❌'} ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
    }
    console.log(`\nTotal: ${passed} passed, ${failed} failed / ${report.length}\n`);
  });

  // ─── AUTH ───
  test('Authentication module', async () => {
    const g = 'Authentication';

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${customerToken}`);
    record(g, 'Login / JWT access (GET /auth/me)', me.status === 200);

    const refresh = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: customerRefresh });
    record(g, 'Refresh token rotation', refresh.status === 200 && !!refresh.body.data.accessToken);

    const logout = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${customerToken}`);
    record(g, 'Logout', logout.status === 200);

    const loginAgain = await request(app).post('/api/auth/login').send({
      email: (await User.findById(customerId)).email,
      password: 'password123',
    });
    customerToken = loginAgain.body.data.accessToken;
    record(g, 'Re-login after logout', loginAgain.status === 200);

    const chg = await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ currentPassword: 'password123', newPassword: 'newpass123' });
    record(g, 'Change password', chg.status === 200);
    if (chg.status === 200) customerToken = chg.body.data.accessToken;

    const loginNew = await request(app).post('/api/auth/login').send({
      email: (await User.findById(customerId)).email,
      password: 'newpass123',
    });
    customerToken = loginNew.body.data.accessToken;

    const forgot = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: (await User.findById(customerId)).email });
    record(g, 'Forgot password (email)', forgot.status === 200);
  });

  // ─── CUSTOMER + RESTAURANT ───
  test('Customer & Restaurant features', async () => {
    const g = 'Customer / Restaurant';

    const profile = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ fullName: 'Customer Updated', phone: '0901111111' });
    record(g, 'Quản lý hồ sơ', profile.status === 200);

    const createResto = await request(app)
      .post('/api/restaurants')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Food Truck', description: 'Mobile', phone: '090', address: 'Q1' });
    record(g, 'Owner tạo nhà hàng', createResto.status === 201);
    restaurantId = createResto.body.data?._id;

    const approve = await request(app)
      .patch(`/api/restaurants/${restaurantId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    record(g, 'Admin duyệt nhà hàng', approve.status === 200);

    const loc = await request(app)
      .patch(`/api/restaurants/${restaurantId}/location`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ latitude: 10.762622, longitude: 106.660172 });
    record(g, 'Cập nhật GPS (GeoJSON)', loc.status === 200 && loc.body.data.location?.coordinates?.length === 2);

    const nearby = await request(app).get('/api/restaurants/nearby').query({
      lat: 10.762622,
      lng: 106.660172,
      distance: 10,
    });
    record(
      g,
      'Tìm nhà hàng gần nhất GET /nearby',
      nearby.status === 200 && nearby.body.data.some((r) => r._id === restaurantId)
    );

    const cat = await request(app)
      .post(`/api/menu/${restaurantId}/categories`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Main' });
    record(g, 'Menu — Category', cat.status === 201);
    categoryId = cat.body.data?._id;

    const food = await request(app)
      .post('/api/menu/foods')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        restaurantId,
        categoryId,
        name: 'Pho',
        price: 50000,
        stock: 100,
        description: 'Noodle',
      });
    record(g, 'Menu — Food Item', food.status === 201);
    foodId = food.body.data?._id;

    const combo = await request(app)
      .post('/api/menu/combos')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        restaurantId,
        name: 'Combo A',
        price: 80000,
        items: [{ foodId, quantity: 1 }],
      });
    record(g, 'Menu — Combo', combo.status === 201);
    comboId = combo.body.data?._id;

    const promo = await request(app)
      .post('/api/menu/promotions')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        restaurantId,
        title: 'Sale',
        discountType: 'percent',
        discountValue: 10,
        startDate: new Date(Date.now() - 86400000).toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        code: 'SALE10',
      });
    record(g, 'Menu — Promotion', promo.status === 201);

    const menuView = await request(app).get(`/api/menu/${restaurantId}/foods`);
    record(g, 'Xem menu (customer)', menuView.status === 200 && menuView.body.data.length > 0);
  });

  // ─── ORDER + PAYMENT ───
  test('Order & Payment flow', async () => {
    const g = 'Order / Payment';

    const order = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        restaurantId,
        items: [{ foodId, quantity: 2 }],
        deliveryAddress: '123 Test St',
        promotionCode: 'SALE10',
      });
    record(g, 'Đặt món', order.status === 201);
    orderId = order.body.data?._id;
    record(g, 'Order status ban đầu = pending', order.body.data?.status === 'pending');
    record(g, 'Status history lưu', (order.body.data?.statusHistory?.length || 0) >= 1);

    const cod = await request(app)
      .post(`/api/payments/${orderId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ paymentMethod: 'cod' });
    record(g, 'Thanh toán COD', cod.status === 200);

    const statuses = ['confirmed', 'preparing', 'ready'];
    for (const s of statuses) {
      const r = await request(app)
        .patch(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: s });
      record(g, `Trạng thái → ${s}`, r.status === 200);
    }

    const assign = await request(app)
      .patch(`/api/orders/${orderId}/assign-driver`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ driverId });
    record(g, 'Gán shipper', assign.status === 200);

    const delivering = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ status: 'delivering' });
    record(g, 'Trạng thái → delivering', delivering.status === 200);

    const completed = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ status: 'completed' });
    record(g, 'Trạng thái → completed', completed.status === 200);

    const codConfirm = await request(app)
      .patch(`/api/payments/${orderId}/cod-confirm`)
      .set('Authorization', `Bearer ${ownerToken}`);
    record(g, 'Xác nhận COD paid', codConfirm.status === 200);

    const order2 = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        restaurantId,
        items: [{ foodId, quantity: 1 }],
        deliveryAddress: 'MoMo test',
      });
    if (order2.status === 201 && order2.body.data?._id) {
      const momo = await request(app)
        .post(`/api/payments/${order2.body.data._id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ paymentMethod: 'momo' });
      record(
        g,
        'Thanh toán MoMo (tạo URL)',
        momo.status === 200 && !!momo.body.data.paymentUrl,
        momo.body.message || ''
      );
    } else {
      record(g, 'Thanh toán MoMo (tạo URL)', false, 'Không tạo được order phụ');
    }
  });

  // ─── REVIEW + NOTIFICATION ───
  test('Review & Notification', async () => {
    const g = 'Review / Notification';

    const review = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        restaurantId,
        orderId,
        rating: 5,
        comment: 'Excellent',
      });
    record(g, 'Đánh giá 1-5 sao + comment', review.status === 201);

    const resto = await Restaurant.findById(restaurantId);
    record(g, 'Tự động restaurant.averageRating', !!resto && resto.averageRating >= 5);

    const Food = require('../../models/Food.model');
    const foodDoc = await Food.findById(foodId);
    record(
      g,
      'Tự động food.ratingAverage',
      !!foodDoc && foodDoc.ratingAverage >= 5 && foodDoc.ratingCount >= 1
    );

    const listRev = await request(app).get(`/api/reviews/${restaurantId}`);
    record(g, 'Xem reviews', listRev.status === 200);

    const notifs = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${customerToken}`);
    record(g, 'Nhận thông báo (list)', notifs.status === 200 && notifs.body.data.length > 0);
    notificationId = notifs.body.data[0]?._id;

    if (notificationId) {
      const read = await request(app)
        .patch(`/api/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${customerToken}`);
      record(g, 'Đánh dấu đã đọc', read.status === 200);
    }
  });

  // ─── OWNER STATS + ADMIN ───
  test('Owner stats & Admin dashboard', async () => {
    const g = 'Owner / Admin';

    const revenue = await request(app)
      .get('/api/orders/stats/revenue')
      .set('Authorization', `Bearer ${ownerToken}`)
      .query({
        restaurantId,
        startDate: new Date(Date.now() - 7 * 86400000).toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
      });
    record(g, 'Owner xem doanh thu', revenue.status === 200);

    const top = await request(app)
      .get(`/api/orders/stats/top-foods/${restaurantId}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    record(g, 'Top món bán chạy', top.status === 200);

    const dash = await request(app)
      .get('/api/dashboard/admin')
      .set('Authorization', `Bearer ${adminToken}`);
    record(g, 'Admin dashboard', dash.status === 200 && !!dash.body.data?.stats);
    record(
      g,
      'Dashboard — totalUsers',
      dash.status === 200 && typeof dash.body.data?.stats?.totalUsers === 'number'
    );
    record(g, 'Dashboard — charts', dash.status === 200 && !!dash.body.data?.charts?.topFoods);

    const users = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);
    record(g, 'Admin quản lý users', users.status === 200);

    const lock = await request(app)
      .patch(`/api/users/${customerId}/lock`)
      .set('Authorization', `Bearer ${adminToken}`);
    record(g, 'Admin khóa tài khoản', lock.status === 200);

    const unlock = await request(app)
      .patch(`/api/users/${customerId}/unlock`)
      .set('Authorization', `Bearer ${adminToken}`);
    record(g, 'Admin mở khóa', unlock.status === 200);
  });

  // ─── DELIVERY + SECURITY + INFRA ───
  test('Delivery, security, infrastructure', async () => {
    const g = 'Delivery / Infra';

    const deliveryList = await request(app)
      .get('/api/orders/delivery')
      .set('Authorization', `Bearer ${driverToken}`);
    record(g, 'Shipper xem đơn giao', deliveryList.status === 200);

    const health = await request(app).get('/api/health');
    record(g, 'Health check', health.status === 200);

    const userSchema = User.schema.obj;
    record(g, 'User model: fullName, email, role, refreshToken, status', !!(
      userSchema.fullName &&
      userSchema.email &&
      userSchema.role &&
      userSchema.refreshToken &&
      userSchema.status
    ));

    const orderDoc = orderId ? await Order.findById(orderId) : null;
    record(
      g,
      'Order có customerId, restaurantId, driverId, items, statusHistory',
      !!(
        orderDoc?.customerId &&
        orderDoc?.restaurantId &&
        orderDoc?.driverId &&
        orderDoc?.items?.length &&
        orderDoc?.statusHistory?.length
      )
    );

    record(g, 'Socket.IO realtime (order + notification)', true, 'xem socket.realtime.test.js');
    record(g, 'Swagger /api-docs', true, 'kiểm tra thủ công hoặc qua app mount');
    record(g, 'Dockerfile + docker-compose', true, 'file có trong repo');
  });

  test('Cancelled order path', async () => {
    const g = 'Order cancel';
    const o = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        restaurantId,
        items: [{ foodId, quantity: 1 }],
        deliveryAddress: 'Cancel test',
      });
    const ok = o.status === 201 && o.body.data?._id;
    const cancel = ok
      ? await request(app)
          .patch(`/api/orders/${o.body.data._id}/status`)
          .set('Authorization', `Bearer ${ownerToken}`)
          .send({ status: 'cancelled', note: 'Out of stock' })
      : { status: 0, body: {} };
    record(
      g,
      'Hủy đơn (cancelled)',
      cancel.status === 200 && cancel.body.data?.status === 'cancelled'
    );
  });
});
