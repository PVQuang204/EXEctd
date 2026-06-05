const userRepository = require('../repositories/user.repository');
const { uploadFromBuffer } = require('./upload.service');
const ApiError = require('../utils/ApiError');

const getProfile = (userId) => userRepository.findById(userId);

const updateProfile = async (userId, data) => {
  const allowed = ['fullName', 'phone', 'avatar'];
  const update = {};
  allowed.forEach((k) => {
    if (data[k] !== undefined) update[k] = data[k];
  });
  return userRepository.updateById(userId, update);
};

const uploadAvatar = async (userId, file) => {
  const url = await uploadFromBuffer(file.buffer, 'avatars');
  return userRepository.updateById(userId, { avatar: url });
};

const listUsers = (filter, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  return userRepository.find(filter, { skip, limit, sort: { createdAt: -1 } });
};

const lockUser = async (userId) => {
  const user = await userRepository.updateById(userId, { status: 'locked' });
  if (!user) throw new ApiError(404, 'User not found');
  return user;
};

const unlockUser = async (userId) => {
  const user = await userRepository.updateById(userId, { status: 'active' });
  if (!user) throw new ApiError(404, 'User not found');
  return user;
};

module.exports = {
  getProfile,
  updateProfile,
  uploadAvatar,
  listUsers,
  lockUser,
  unlockUser,
};
