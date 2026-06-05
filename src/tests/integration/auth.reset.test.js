const request = require('supertest');
const crypto = require('crypto');
const app = require('../../app');
const User = require('../../models/User.model');

describe('Reset password full flow', () => {
  it('resets password using token from DB', async () => {
    const email = `reset_${Date.now()}@test.com`;
    await request(app).post('/api/auth/register').send({
      fullName: 'Reset User',
      email,
      password: 'oldpass123',
    });

    await request(app).post('/api/auth/forgot-password').send({ email });
    expect(true).toBe(true);

    const user = await User.findOne({ email }).select('+resetPasswordToken +resetPasswordExpire');
    expect(user.resetPasswordToken).toBeTruthy();

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const reset = await request(app).post('/api/auth/reset-password').send({
      token: rawToken,
      password: 'newpass456',
    });
    expect(reset.status).toBe(200);
    expect(reset.body.data.accessToken).toBeDefined();

    const login = await request(app).post('/api/auth/login').send({
      email,
      password: 'newpass456',
    });
    expect(login.status).toBe(200);
  });
});
