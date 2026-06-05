const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const ApiError = require('../utils/ApiError');

/**
 * Middleware xác thực JWT token
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Lấy token từ header Authorization: Bearer <token>
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new ApiError(401, 'Not authorized, no token provided');
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user vào request
    req.user = await User.findById(decoded.id);
    if (!req.user) {
      throw new ApiError(401, 'User not found');
    }

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }
    next(new ApiError(401, 'Not authorized, token invalid'));
  }
};

/**
 * Middleware phân quyền theo role
 * @param  {...string} roles - Các role được phép truy cập
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action'));
    }
    next();
  };
};

module.exports = { protect, authorize };
