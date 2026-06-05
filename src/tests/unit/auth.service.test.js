const authService = require('../../services/auth.service');
const userRepository = require('../../repositories/user.repository');

describe('Auth service', () => {
  it('registers a new customer', async () => {
    const result = await authService.register({
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result.accessToken).toBeDefined();
    expect(result.user.email).toBe('test@example.com');
    expect(result.user.role).toBe('customer');
  });

  it('logs in with valid credentials', async () => {
    await authService.register({
      fullName: 'Login User',
      email: 'login@example.com',
      password: 'password123',
    });
    const result = await authService.login({
      email: 'login@example.com',
      password: 'password123',
    });
    expect(result.accessToken).toBeDefined();
  });

  it('refreshes tokens', async () => {
    const { refreshToken } = await authService.register({
      fullName: 'Refresh User',
      email: 'refresh@example.com',
      password: 'password123',
    });
    const result = await authService.refresh(refreshToken);
    expect(result.accessToken).toBeDefined();
  });

  it('logs out', async () => {
    const { user } = await authService.register({
      fullName: 'Logout User',
      email: 'logout@example.com',
      password: 'password123',
    });
    const res = await authService.logout(user._id);
    expect(res.message).toMatch(/logged out/i);
    const dbUser = await userRepository.findById(user._id);
    expect(dbUser.refreshToken).toBeFalsy();
  });
});
