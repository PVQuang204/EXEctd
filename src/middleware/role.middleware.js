const ApiError = require('../utils/ApiError');

const roleMiddleware = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return next(new ApiError(401, 'Not authorized'));
  if (!allowedRoles.includes(req.user.role)) {
    return next(new ApiError(403, 'You do not have permission'));
  }
  next();
};

module.exports = roleMiddleware;
