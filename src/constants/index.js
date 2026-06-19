// User roles
const ROLES = {
  CUSTOMER: 'customer',
  RESTAURANT_OWNER: 'restaurant_owner',
  ADMIN: 'admin',
};

const USER_STATUSES = {
  ACTIVE: 'active',
  LOCKED: 'locked',
  PENDING: 'pending',
};

// Registration is only allowed for customers and restaurant owners
const ALLOWED_REGISTER_ROLES = [ROLES.CUSTOMER, ROLES.RESTAURANT_OWNER];

// Restaurant
const RESTAURANT_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
};

// Order
const ORDER_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const PAYMENT_STATUSES = {
  UNPAID: 'unpaid',
  PAID: 'paid',
  REFUNDED: 'refunded',
  FAILED: 'failed',
};

const PAYMENT_METHODS = {
  COD: 'cod',
  PAYOS: 'payos',
};

const STATUS_TRANSITIONS = {
  [ORDER_STATUSES.PENDING]: [ORDER_STATUSES.CONFIRMED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.CONFIRMED]: [ORDER_STATUSES.PREPARING, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.PREPARING]: [ORDER_STATUSES.READY, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.READY]: [ORDER_STATUSES.COMPLETED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.COMPLETED]: [],
  [ORDER_STATUSES.CANCELLED]: [],
};

const SOCKET_EVENTS = {
  [ORDER_STATUSES.PENDING]: 'order_created',
  [ORDER_STATUSES.CONFIRMED]: 'order_confirmed',
  [ORDER_STATUSES.PREPARING]: 'order_preparing',
  [ORDER_STATUSES.READY]: 'order_ready',
  [ORDER_STATUSES.COMPLETED]: 'order_completed',
  [ORDER_STATUSES.CANCELLED]: 'order_cancelled',
};

const PAYMENT_STATUSES_ORDER = {
  [PAYMENT_METHODS.COD]: 'unpaid',
  [PAYMENT_METHODS.PAYOS]: 'pending',
};

// Pagination
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// Notification
const NOTIFICATION_TYPES = {
  ORDER: 'order',
  PAYMENT: 'payment',
  RESTAURANT: 'restaurant',
  REVIEW: 'review',
  SYSTEM: 'system',
};

// Deposit thresholds (VND)
const DEPOSIT_THRESHOLD = 2500000; // 2.5M VND
const DEPOSIT_RATIO_BELOW = 0.15;  // 15% deposit for orders < 2.5M
const DEPOSIT_RATIO_ABOVE = 0.20;  // 20% deposit for orders >= 2.5M

const getDepositRatio = (totalAmount) =>
  totalAmount < DEPOSIT_THRESHOLD ? DEPOSIT_RATIO_BELOW : DEPOSIT_RATIO_ABOVE;

const getDepositAmount = (totalAmount) => {
  const ratio = getDepositRatio(totalAmount);
  return Math.round(totalAmount * ratio);
};

// Payment phases (deposit vs full payment)
const PAYMENT_PHASES = {
  DEPOSIT: 'deposit',
  FULL: 'full',
};

module.exports = {
  ROLES,
  USER_STATUSES,
  ALLOWED_REGISTER_ROLES,
  RESTAURANT_STATUSES,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  PAYMENT_METHODS,
  STATUS_TRANSITIONS,
  SOCKET_EVENTS,
  PAYMENT_STATUSES_ORDER,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  NOTIFICATION_TYPES,
  DEPOSIT_THRESHOLD,
  DEPOSIT_RATIO_BELOW,
  DEPOSIT_RATIO_ABOVE,
  getDepositRatio,
  getDepositAmount,
  PAYMENT_PHASES,
};
