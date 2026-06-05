const authService = require('../../services/auth.service');

jest.mock('../../utils/sendEmail', () => jest.fn().mockResolvedValue(true));

describe('Auth extended', () => {
  it('changes password', async () => {
    await authService.register({
      fullName: 'Change',
      email: 'change@test.com',
      password: 'oldpass123',
    });
    const result = await authService.changePassword(
      (await require('../../repositories/user.repository').findByEmail('change@test.com'))._id,
      { currentPassword: 'oldpass123', newPassword: 'newpass123' }
    );
    expect(result.accessToken).toBeDefined();
    const login = await authService.login({ email: 'change@test.com', password: 'newpass123' });
    expect(login.accessToken).toBeDefined();
  });

  it('sends forgot password email', async () => {
    await authService.register({
      fullName: 'Forgot',
      email: 'forgot@test.com',
      password: 'password123',
    });
    const res = await authService.forgotPassword({ email: 'forgot@test.com' });
    expect(res.message).toMatch(/email/i);
  });
});
