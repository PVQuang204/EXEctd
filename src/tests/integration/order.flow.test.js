const request = require('supertest');
const app = require('../../app');
const Restaurant = require('../../models/Restaurant.model');
const User = require('../../models/User.model');
const Category = require('../../models/Category.model');
const Food = require('../../models/Food.model');

describe('Order flow API', () => {
  let customerToken;
  let ownerToken;
  let restaurantId;
  let foodId;

  beforeEach(async () => {
    await request(app).post('/api/auth/register').send({
      fullName: 'Customer',
      email: 'cust@flow.com',
      password: 'password123',
    });
    const loginC = await request(app).post('/api/auth/login').send({
      email: 'cust@flow.com',
      password: 'password123',
    });
    customerToken = loginC.body.data.accessToken;

    await request(app).post('/api/auth/register').send({
      fullName: 'Owner',
      email: 'own@flow.com',
      password: 'password123',
      role: 'restaurant_owner',
    });
    const loginO = await request(app).post('/api/auth/login').send({
      email: 'own@flow.com',
      password: 'password123',
    });
    ownerToken = loginO.body.data.accessToken;

    const owner = await User.findOne({ email: 'own@flow.com' });
    const restaurant = await Restaurant.create({
      ownerId: owner._id,
      name: 'Flow Resto',
      status: 'approved',
      latitude: 10.77,
      longitude: 106.66,
      location: { type: 'Point', coordinates: [106.66, 10.77] },
    });
    restaurantId = restaurant._id;
    const cat = await Category.create({ restaurantId, name: 'Food' });
    const food = await Food.create({
      restaurantId,
      categoryId: cat._id,
      name: 'Banh mi',
      price: 30000,
      stock: 50,
    });
    foodId = food._id;
  });

  it('creates order and owner confirms', async () => {
    const create = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        restaurantId,
        items: [{ foodId, quantity: 2 }],
        deliveryAddress: 'District 1',
      });
    expect(create.status).toBe(201);
    const orderId = create.body.data._id;

    const confirm = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'confirmed' });
    expect(confirm.status).toBe(200);
    expect(confirm.body.data.status).toBe('confirmed');
  });
});
