const ApiError = require('../utils/ApiError');
const { ROLES } = require('../constants');

const roleMiddleware = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return next(new ApiError(401, 'Not authorized'));
  if (!allowedRoles.includes(req.user.role)) {
    return next(new ApiError(403, 'You do not have permission'));
  }
  next();
};

const isAdmin = roleMiddleware(ROLES.ADMIN);
const isRestaurantOwner = roleMiddleware(ROLES.RESTAURANT_OWNER);
const isCustomer = roleMiddleware(ROLES.CUSTOMER);
const isDeliveryStaff = roleMiddleware(ROLES.DELIVERY_STAFF);
const isOwnerOrAdmin = roleMiddleware(ROLES.RESTAURANT_OWNER, ROLES.ADMIN);

module.exports = roleMiddleware;
module.exports.isAdmin = isAdmin;
module.exports.isRestaurantOwner = isRestaurantOwner;
module.exports.isCustomer = isCustomer;
module.exports.isDeliveryStaff = isDeliveryStaff;
module.exports.isOwnerOrAdmin = isOwnerOrAdmin;
