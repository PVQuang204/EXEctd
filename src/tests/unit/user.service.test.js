const userService = require('../../services/user.service');
const userRepository = require('../../repositories/user.repository');

describe('User service', () => {
  it('updates profile and lists users', async () => {
    const user = await userRepository.create({
      fullName: 'U',
      email: 'user@test.com',
      password: 'password123',
    });
    const updated = await userService.updateProfile(user._id, { fullName: 'Updated', phone: '090' });
    expect(updated.fullName).toBe('Updated');
    const list = await userService.listUsers({}, 1, 10);
    expect(list.length).toBeGreaterThanOrEqual(1);
  });

  it('locks and unlocks user', async () => {
    const user = await userRepository.create({
      fullName: 'L',
      email: 'lock@test.com',
      password: 'password123',
    });
    await userService.lockUser(user._id);
    let locked = await userRepository.findById(user._id);
    expect(locked.status).toBe('locked');
    await userService.unlockUser(user._id);
    locked = await userRepository.findById(user._id);
    expect(locked.status).toBe('active');
  });
});
