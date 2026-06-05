const notificationRepository = require('../repositories/notification.repository');
const { emitToUser } = require('../sockets');

const createNotification = async ({ userId, title, content, type = 'system', metadata }) => {
  const notification = await notificationRepository.create({
    userId,
    title,
    content,
    type,
    metadata,
  });
  emitToUser(userId.toString(), 'notification', notification);
  return notification;
};

const getMyNotifications = (userId, { page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;
  return notificationRepository.find(
    { userId },
    { sort: { createdAt: -1 }, skip, limit: Number(limit) }
  );
};

const markAsRead = async (id, userId) => {
  const n = await notificationRepository.findOne({ _id: id, userId });
  if (!n) return null;
  return notificationRepository.updateById(id, { isRead: true });
};

const markAllAsRead = (userId) =>
  notificationRepository.model.updateMany({ userId, isRead: false }, { isRead: true });

module.exports = {
  createNotification,
  getMyNotifications,
  markAsRead,
  markAllAsRead,
};
