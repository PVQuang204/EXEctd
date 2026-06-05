const userRepository = require('../repositories/user.repository');
const ApiError = require('../utils/ApiError');
const { verifyAccessToken } = require('../utils/token');

const authMiddleware = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new ApiError(401, 'Not authorized — no token');
    }
    const token = header.split(' ')[1];
    const decoded = verifyAccessToken(token);
    const user = await userRepository.findById(decoded.id);
    if (!user) throw new ApiError(401, 'User not found');
    if (user.status === 'locked') throw new ApiError(403, 'Account is locked');
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Invalid or expired token'));
    }
    next(err);
  }
};

module.exports = authMiddleware;
