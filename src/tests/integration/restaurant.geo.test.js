const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const Restaurant = require('../../models/Restaurant.model');
const User = require('../../models/User.model');

describe('Restaurant Geo API', () => {
  let ownerToken;

  beforeEach(async () => {
    const register = await request(app).post('/api/auth/register').send({
      fullName: 'Owner',
      email: 'owner@example.com',
      password: 'password123',
      role: 'restaurant_owner',
    });
    ownerToken = register.body.data.accessToken;

    const owner = await User.findOne({ email: 'owner@example.com' });
    await Restaurant.create({
      ownerId: owner._id,
      name: 'Near Me',
      status: 'approved',
      latitude: 10.762622,
      longitude: 106.660172,
      location: { type: 'Point', coordinates: [106.660172, 10.762622] },
    });
  });

  it('finds nearby restaurants', async () => {
    const res = await request(app).get('/api/restaurants/nearby').query({
      lat: 10.762622,
      lng: 106.660172,
      distance: 10,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });
});
