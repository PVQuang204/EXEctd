const crypto = require('crypto');
const userRepository = require('../repositories/user.repository');
const ApiError = require('../utils/ApiError');
const sendEmail = require('../utils/sendEmail');
const {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyRefreshToken,
} = require('../utils/token');

const sanitizeUser = (user) => ({
  _id: user._id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  role: user.role,
  avatar: user.avatar,
  status: user.status,
});

const issueTokens = async (user) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = hashToken(refreshToken);
  await user.save({ validateBeforeSave: false });
  return { accessToken, refreshToken, user: sanitizeUser(user) };
};

const register = async ({ fullName, email, password, phone, role }) => {
  if (await userRepository.findByEmail(email)) {
    throw new ApiError(400, 'Email already exists');
  }
  const allowedRegisterRoles = ['customer', 'restaurant_owner', 'delivery_staff'];
  const userRole = allowedRegisterRoles.includes(role) ? role : 'customer';
  const user = await userRepository.create({
    fullName,
    email,
    password,
    phone,
    role: userRole,
    status: userRole === 'restaurant_owner' ? 'active' : 'active',
  });
  return issueTokens(user);
};

const login = async ({ email, password }) => {
  const user = await userRepository.findByEmail(email, true);
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  if (user.status === 'locked') throw new ApiError(403, 'Account is locked');
  return issueTokens(user);
};

const refresh = async (refreshToken) => {
  if (!refreshToken) throw new ApiError(401, 'Refresh token required');
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, 'Invalid refresh token');
  }
  const user = await userRepository.findByRefreshToken(hashToken(refreshToken));
  if (!user || user._id.toString() !== decoded.id) {
    throw new ApiError(401, 'Invalid refresh token');
  }
  return issueTokens(user);
};

const logout = async (userId) => {
  await userRepository.updateById(userId, { refreshToken: null });
  return { message: 'Logged out successfully' };
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await userRepository.findById(userId);
  const withPass = await userRepository.findByEmail(user.email, true);
  if (!(await withPass.comparePassword(currentPassword))) {
    throw new ApiError(400, 'Current password is incorrect');
  }
  withPass.password = newPassword;
  withPass.refreshToken = undefined;
  await withPass.save();
  return issueTokens(withPass);
};

const forgotPassword = async ({ email }) => {
  const user = await userRepository.findByEmail(email);
  if (!user) throw new ApiError(404, 'No user with that email');
  const resetToken = user.generateResetPasswordToken();
  await user.save({ validateBeforeSave: false });
  const clientUrl = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');
  const resetUrl = `${clientUrl}/reset-password/${resetToken}`;
  await sendEmail({
    to: user.email,
    subject: 'Reset Password - Mobile Restaurant',
    html: `<p>Reset your password: <a href="${resetUrl}">${resetUrl}</a></p><p>Expires in 15 minutes.</p>`,
  });
  return { message: 'Reset email sent' };
};

const resetPassword = async ({ token, password }) => {
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const user = await userRepository.findOne(
    { resetPasswordToken: hashed, resetPasswordExpire: { $gt: Date.now() } },
    { select: '+resetPasswordToken +resetPasswordExpire +password' }
  );
  if (!user) throw new ApiError(400, 'Invalid or expired token');
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  return issueTokens(user);
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  changePassword,
  forgotPassword,
  resetPassword,
  sanitizeUser,
};
