const request = require('supertest');
const app = require('../../app');

describe('Auth API', () => {
  it('registers and logs in', async () => {
    const register = await request(app).post('/api/auth/register').send({
      fullName: 'API User',
      email: 'api@example.com',
      password: 'password123',
    });
    expect(register.status).toBe(201);
    expect(register.body.data.accessToken).toBeDefined();

    const login = await request(app).post('/api/auth/login').send({
      email: 'api@example.com',
      password: 'password123',
    });
    expect(login.status).toBe(200);

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe('api@example.com');
  });
});
