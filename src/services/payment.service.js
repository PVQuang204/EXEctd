const paymentRepository = require('../repositories/payment.repository');
const orderRepository = require('../repositories/order.repository');
const { createVNPayPaymentUrl, verifyVNPayCallback } = require('../config/vnpay');
const { createNotification } = require('./notification.service');
const { emitOrderEvent } = require('../sockets');
const ApiError = require('../utils/ApiError');

const createPayment = async (orderId, customerId, { paymentMethod }, ipAddr) => {
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
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
    });
  }

  if (paymentMethod === 'cod') {
    await orderRepository.updateById(orderId, { paymentStatus: 'unpaid' });
    return { payment, message: 'Pay on delivery' };
  }

  if (paymentMethod === 'vnpay') {
    const url = createVNPayPaymentUrl({
      amount: order.totalAmount,
      orderId: payment._id.toString(),
      orderInfo: `Thanh toan don hang ${orderId}`,
      ipAddr,
    });
    return { payment, paymentUrl: url };
  }

  throw new ApiError(400, 'Invalid payment method');
};

const handleVNPayCallback = async (query) => {
  if (!verifyVNPayCallback({ ...query })) {
    throw new ApiError(400, 'Invalid VNPay signature');
  }
  const payment = await paymentRepository.findById(query.vnp_TxnRef);
  if (!payment) throw new ApiError(404, 'Payment not found');

  const success = query.vnp_ResponseCode === '00';
  payment.paymentStatus = success ? 'success' : 'failed';
  payment.transactionId = query.vnp_TransactionNo;
  payment.vnpayResponse = query;
  await payment.save();

  const order = await orderRepository.findById(payment.orderId);
  if (success && order) {
    order.paymentStatus = 'paid';
    await order.save();
    await createNotification({
      userId: order.customerId,
      title: 'Payment successful',
      content: `Order #${order._id} paid via VNPay`,
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

module.exports = { createPayment, handleVNPayCallback, confirmCOD };
