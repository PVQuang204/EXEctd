const notificationService = require('../../services/notification.service');
const userRepository = require('../../repositories/user.repository');

describe('Notification service', () => {
  it('creates and lists notifications', async () => {
    const user = await userRepository.create({
      fullName: 'N',
      email: 'notif@test.com',
      password: 'password123',
    });
    await notificationService.createNotification({
      userId: user._id,
      title: 'Hello',
      content: 'World',
      type: 'system',
    });
    const list = await notificationService.getMyNotifications(user._id, { page: 1, limit: 10 });
    expect(list.length).toBe(1);
    await notificationService.markAllAsRead(user._id);
  });
});
