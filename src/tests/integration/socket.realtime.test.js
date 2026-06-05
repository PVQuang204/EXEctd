const http = require('http');
const { io } = require('socket.io-client');
const request = require('supertest');
const app = require('../../app');
const { initSocket } = require('../../sockets');

describe('Socket.IO realtime', () => {
  let httpServer;
  let port;
  let customerToken;
  let ownerToken;
  let restaurantId;
  let foodId;
  let categoryId;

  beforeAll(async () => {
    httpServer = http.createServer(app);
    initSocket(httpServer);
    await new Promise((resolve) => {
      httpServer.listen(0, () => {
        port = httpServer.address().port;
        resolve();
      });
    });

    const ownerReg = await request(app).post('/api/auth/register').send({
      fullName: 'Socket Owner',
      email: `sock_owner_${Date.now()}@test.com`,
      password: 'password123',
      role: 'restaurant_owner',
    });
    ownerToken = ownerReg.body.data.accessToken;

    const custReg = await request(app).post('/api/auth/register').send({
      fullName: 'Socket Customer',
      email: `sock_cust_${Date.now()}@test.com`,
      password: 'password123',
    });
    customerToken = custReg.body.data.accessToken;

    const adminLogin = await request(app).post('/api/auth/login').send({
      email: (await require('../../models/User.model').create({
        fullName: 'A',
        email: `sock_admin_${Date.now()}@test.com`,
        password: 'password123',
        role: 'admin',
      })).email,
      password: 'password123',
    });
    const adminToken = adminLogin.body.data.accessToken;

    const resto = await request(app)
      .post('/api/restaurants')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Socket Resto', phone: '1', address: 'A' });
    restaurantId = resto.body.data._id;

    await request(app)
      .patch(`/api/restaurants/${restaurantId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    const cat = await request(app)
      .post(`/api/menu/${restaurantId}/categories`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'C' });
    categoryId = cat.body.data._id;

    const food = await request(app)
      .post('/api/menu/foods')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ restaurantId, categoryId, name: 'F', price: 10000, stock: 10 });
    foodId = food.body.data._id;
  });

  afterAll((done) => {
    httpServer.close(done);
  });

  const connectClient = (token) =>
    new Promise((resolve, reject) => {
      const client = io(`http://127.0.0.1:${port}`, {
        auth: { token },
        transports: ['websocket'],
      });
      client.on('connect', () => resolve(client));
      client.on('connect_error', reject);
    });

  it('emits order_created to customer on new order', async () => {
    const customerSocket = await connectClient(customerToken);

    const eventPromise = new Promise((resolve) => {
      customerSocket.on('order_created', (payload) => resolve(payload));
    });

    await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        restaurantId,
        items: [{ foodId, quantity: 1 }],
        deliveryAddress: 'Socket St',
      });

    const payload = await Promise.race([
      eventPromise,
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 5000)),
    ]);

    expect(payload.status).toBe('pending');
    customerSocket.disconnect();
  });

  it('emits order_confirmed when owner updates status', async () => {
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        restaurantId,
        items: [{ foodId, quantity: 1 }],
        deliveryAddress: 'Socket St 2',
      });
    const orderId = orderRes.body.data._id;

    const customerSocket = await connectClient(customerToken);
    const eventPromise = new Promise((resolve) => {
      customerSocket.on('order_confirmed', resolve);
    });

    await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'confirmed' });

    const payload = await Promise.race([
      eventPromise,
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 5000)),
    ]);
    expect(payload.status).toBe('confirmed');
    customerSocket.disconnect();
  });

  it('emits notification event to customer on status update', async () => {
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        restaurantId,
        items: [{ foodId, quantity: 1 }],
        deliveryAddress: 'Notify St',
      });
    const orderId = orderRes.body.data._id;

    const customerSocket = await connectClient(customerToken);
    const notifPromise = new Promise((resolve) => {
      customerSocket.on('notification', resolve);
    });

    await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'confirmed' });

    const notif = await Promise.race([
      notifPromise,
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 5000)),
    ]);
    expect(notif.title).toMatch(/order/i);
    customerSocket.disconnect();
  });
});
