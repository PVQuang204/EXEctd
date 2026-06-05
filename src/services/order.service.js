const orderRepository = require('../repositories/order.repository');
const foodRepository = require('../repositories/food.repository');
const restaurantRepository = require('../repositories/restaurant.repository');
const userRepository = require('../repositories/user.repository');
const { ORDER_STATUSES } = require('../models/Order.model');
const { createNotification } = require('./notification.service');
const { applyPromotion } = require('./menu.service');
const { emitOrderEvent } = require('../sockets');
const ApiError = require('../utils/ApiError');

const STATUS_FLOW = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['delivering', 'cancelled'],
  delivering: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

const SOCKET_EVENTS = {
  pending: 'order_created',
  confirmed: 'order_confirmed',
  preparing: 'order_preparing',
  ready: 'order_ready',
  delivering: 'order_delivering',
  completed: 'order_completed',
  cancelled: 'order_cancelled',
};

const buildOrderItems = async (items) => {
  const built = [];
  let subtotal = 0;
  for (const item of items) {
    const food = await foodRepository.findById(item.foodId);
    if (!food || !food.isAvailable) throw new ApiError(400, `Food ${item.foodId} unavailable`);
    if (food.stock < item.quantity) throw new ApiError(400, `Insufficient stock for ${food.name}`);
    const lineSubtotal = food.price * item.quantity;
    built.push({
      foodId: food._id,
      name: food.name,
      price: food.price,
      quantity: item.quantity,
      subtotal: lineSubtotal,
    });
    subtotal += lineSubtotal;
  }
  return { built, subtotal };
};

const createOrder = async (customerId, data) => {
  const restaurant = await restaurantRepository.findById(data.restaurantId);
  if (!restaurant || restaurant.status !== 'approved') {
    throw new ApiError(400, 'Restaurant not available');
  }
  const { built, subtotal } = await buildOrderItems(data.items);
  let discountAmount = 0;
  if (data.promotionCode) {
    const promo = await applyPromotion(data.restaurantId, data.promotionCode, subtotal);
    discountAmount = promo.discountAmount;
  }
  const totalAmount = Math.max(0, subtotal - discountAmount);
  const order = await orderRepository.create({
    customerId,
    restaurantId: data.restaurantId,
    items: built,
    totalAmount,
    discountAmount,
    deliveryAddress: data.deliveryAddress,
    deliveryLocation: data.deliveryLocation,
    note: data.note,
    promotionCode: data.promotionCode,
    status: 'pending',
    paymentStatus: 'unpaid',
    statusHistory: [{ status: 'pending', changedBy: customerId }],
  });
  for (const item of built) {
    await foodRepository.updateById(item.foodId, {
      $inc: { stock: -item.quantity, soldCount: item.quantity },
    });
  }
  await createNotification({
    userId: restaurant.ownerId,
    title: 'New order',
    content: `New order #${order._id}`,
    type: 'order',
    metadata: { orderId: order._id },
  });
  emitOrderEvent(order, SOCKET_EVENTS.pending);
  return order;
};

const transitionStatus = async (orderId, newStatus, user, note) => {
  const order = await orderRepository.findById(orderId);
  if (!order) throw new ApiError(404, 'Order not found');
  const allowed = STATUS_FLOW[order.status] || [];
  if (!allowed.includes(newStatus)) {
    throw new ApiError(400, `Cannot transition from ${order.status} to ${newStatus}`);
  }
  order.status = newStatus;
  order.statusHistory.push({ status: newStatus, changedBy: user._id, note });
  await order.save();
  const event = SOCKET_EVENTS[newStatus] || 'order_updated';
  emitOrderEvent(order, event);
  await createNotification({
    userId: order.customerId,
    title: 'Order update',
    content: `Order is now ${newStatus}`,
    type: 'order',
    metadata: { orderId: order._id, status: newStatus },
  });
  return order;
};

const assignDriver = async (orderId, driverId) => {
  const driver = await userRepository.findById(driverId);
  if (!driver || driver.role !== 'delivery_staff') {
    throw new ApiError(400, 'Invalid delivery staff');
  }
  const order = await orderRepository.updateById(orderId, { driverId });
  if (!order) throw new ApiError(404, 'Order not found');
  await createNotification({
    userId: driverId,
    title: 'New delivery',
    content: `You have been assigned order #${orderId}`,
    type: 'delivery',
  });
  return order;
};

const getOrders = (filter, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  return orderRepository.find(filter, {
    sort: { createdAt: -1 },
    skip,
    limit,
    populate: [
      { path: 'customerId', select: 'fullName phone' },
      { path: 'restaurantId', select: 'name' },
      { path: 'driverId', select: 'fullName phone' },
    ],
  });
};

const getRevenueStats = async (restaurantId, startDate, endDate) => {
  const match = {
    restaurantId,
    status: 'completed',
    createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
  };
  const [result] = await orderRepository.aggregate([
    { $match: match },
    { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' }, orderCount: { $sum: 1 } } },
  ]);
  return result || { totalRevenue: 0, orderCount: 0 };
};

const getTopSellingFoods = async (restaurantId, limit = 10) => {
  return orderRepository.aggregate([
    { $match: { restaurantId, status: 'completed' } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.foodId',
        name: { $first: '$items.name' },
        totalSold: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.subtotal' },
      },
    },
    { $sort: { totalSold: -1 } },
    { $limit: limit },
  ]);
};

module.exports = {
  createOrder,
  transitionStatus,
  assignDriver,
  getOrders,
  getRevenueStats,
  getTopSellingFoods,
  ORDER_STATUSES,
};
