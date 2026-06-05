const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User.model');

describe('Admin dashboard', () => {
  it('returns dashboard stats for admin', async () => {
    await User.create({
      fullName: 'Admin',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
    });
    const login = await request(app).post('/api/auth/login').send({
      email: 'admin@test.com',
      password: 'password123',
    });
    const res = await request(app)
      .get('/api/dashboard/admin')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.stats).toBeDefined();
    expect(res.body.data.charts).toBeDefined();
  });
});
