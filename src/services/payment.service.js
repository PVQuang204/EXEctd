const paymentRepository = require('../repositories/payment.repository');
const orderRepository = require('../repositories/order.repository');
const { createMoMoPaymentUrl, verifyMoMoCallback } = require('../config/momo');
const { createNotification } = require('./notification.service');
const { emitOrderEvent } = require('../sockets');
const ApiError = require('../utils/ApiError');

const createPayment = async (orderId, customerId, { paymentMethod }) => {
  const order = await orderRepository.findById(orderId);
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.customerId.toString() !== customerId.toString()) {
    throw new ApiError(403, 'Not your order');
  }
  if (order.paymentStatus === 'paid') throw new ApiError(400, 'Order already paid');

  let payment = await paymentRepository.findOne({ orderId });
  if (!payment) {
    payment = await paymentRepository.create({
      orderId,
      amount: order.totalAmount,
      paymentMethod,
      paymentStatus: 'pending',
    });
  }

  if (paymentMethod === 'cod') {
    await orderRepository.updateById(orderId, { paymentStatus: 'unpaid' });
    return { payment, message: 'Pay on delivery' };
  }

  if (paymentMethod === 'momo') {
    const paymentUrl = await createMoMoPaymentUrl({
      amount: order.totalAmount,
      orderId: payment._id.toString(),
      orderInfo: `Thanh toan don hang ${orderId}`,
    });
    return { payment, paymentUrl };
  }

  throw new ApiError(400, 'Invalid payment method. Use "cod" or "momo"');
};

const handleMoMoCallback = async (params) => {
  if (!verifyMoMoCallback(params)) {
    throw new ApiError(400, 'Invalid MoMo signature');
  }

  const payment = await paymentRepository.findById(params.orderId);
  if (!payment) throw new ApiError(404, 'Payment not found');

  const success = params.resultCode === 0 || params.resultCode === '0';
  payment.paymentStatus = success ? 'success' : 'failed';
  payment.transactionId = String(params.transId);
  payment.momoResponse = params;
  await payment.save();

  const order = await orderRepository.findById(payment.orderId);
  if (success && order) {
    order.paymentStatus = 'paid';
    await order.save();
    await createNotification({
      userId: order.customerId,
      title: 'Payment successful',
      content: `Order #${order._id} paid via MoMo`,
      type: 'payment',
    });
    emitOrderEvent(order, 'payment_success');
  }
  return { payment, success };
};

const confirmCOD = async (orderId, ownerId) => {
  const order = await orderRepository.findById(orderId, {
    populate: 'restaurantId',
  });
  if (!order) throw new ApiError(404, 'Order not found');
  const restaurant = await require('../repositories/restaurant.repository').findById(
    order.restaurantId
  );
  if (restaurant.ownerId.toString() !== ownerId.toString()) {
    throw new ApiError(403, 'Forbidden');
  }
  order.paymentStatus = 'paid';
  await order.save();
  const payment = await paymentRepository.findOne({ orderId });
  if (payment) {
    payment.paymentStatus = 'success';
    await payment.save();
  }
  return order;
};

module.exports = { createPayment, handleMoMoCallback, confirmCOD };
