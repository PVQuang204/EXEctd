const paymentRepository = require('../repositories/payment.repository');
const orderRepository = require('../repositories/order.repository');
const { createMoMoPaymentUrl, verifyMoMoCallback } = require('../config/momo');
const { createVNPayPaymentUrl, verifyVNPayCallback } = require('../config/vnpay');
const { createNotification } = require('./notification.service');
const { emitOrderEvent } = require('../sockets');
const { PAYMENT_METHODS, PAYMENT_STATUSES } = require('../constants');
const ApiError = require('../utils/ApiError');

const createPayment = async (orderId, customerId, { paymentMethod }, ipAddr) => {
  const order = await orderRepository.findById(orderId);
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.customerId.toString() !== customerId.toString()) {
    throw new ApiError(403, 'Not your order');
  }
  if (order.paymentStatus === PAYMENT_STATUSES.PAID) {
    throw new ApiError(400, 'Order already paid');
  }

  let payment = await paymentRepository.findOne({ orderId });
  if (!payment) {
    payment = await paymentRepository.create({
      orderId,
      amount: order.totalAmount,
      paymentMethod,
      paymentStatus: PAYMENT_STATUSES.UNPAID,
    });
  }

  if (paymentMethod === PAYMENT_METHODS.COD) {
    await orderRepository.updateById(orderId, { paymentStatus: PAYMENT_STATUSES.UNPAID });
    return { payment, message: 'Pay on delivery' };
  }

  if (paymentMethod === PAYMENT_METHODS.MOMO) {
    const paymentUrl = await createMoMoPaymentUrl({
      amount: Math.round(order.totalAmount),
      orderId: payment._id.toString(),
      orderInfo: `Thanh toan don hang ${orderId}`,
    });
    return { payment, paymentUrl };
  }

  if (paymentMethod === PAYMENT_METHODS.VNPAY) {
    const paymentUrl = createVNPayPaymentUrl({
      amount: order.totalAmount,
      orderId: payment._id.toString(),
      orderInfo: `Thanh toan don hang ${orderId}`,
      ipAddr: ipAddr || '127.0.0.1',
    });
    return { payment, paymentUrl };
  }

  throw new ApiError(400, 'Invalid payment method');
};

const handleMoMoCallback = async (params) => {
  if (!verifyMoMoCallback(params)) {
    throw new ApiError(400, 'Invalid MoMo signature');
  }

  const payment = await paymentRepository.findById(params.orderId);
  if (!payment) throw new ApiError(404, 'Payment not found');
  if (payment.paymentStatus === PAYMENT_STATUSES.PAID) {
    return { payment, success: true };
  }

  const success = params.resultCode === 0 || params.resultCode === '0';
  payment.paymentStatus = success ? PAYMENT_STATUSES.PAID : PAYMENT_STATUSES.FAILED;
  payment.transactionId = String(params.transId);
  payment.momoResponse = params;
  await payment.save();

  if (success) {
    const order = await orderRepository.findById(payment.orderId);
    if (order) {
      order.paymentStatus = PAYMENT_STATUSES.PAID;
      await order.save();
      await createNotification({
        userId: order.customerId,
        title: 'Payment successful',
        content: `Order #${order._id} paid via MoMo`,
        type: 'payment',
      });
      emitOrderEvent(order, 'payment_success');
    }
  }
  return { payment, success };
};

const handleVNPayReturn = async (vnpParams) => {
  const isValid = verifyVNPayCallback({ ...vnpParams });
  if (!isValid) throw new ApiError(400, 'Invalid VNPay signature');

  const payment = await paymentRepository.findById(vnpParams.vnp_TxnRef);
  if (!payment) throw new ApiError(404, 'Payment not found');
  if (payment.paymentStatus === PAYMENT_STATUSES.PAID) {
    return { payment, success: true };
  }

  const success = vnpParams.vnp_ResponseCode === '00';
  payment.paymentStatus = success ? PAYMENT_STATUSES.PAID : PAYMENT_STATUSES.FAILED;
  payment.transactionId = vnpParams.vnp_TransactionNo || null;
  payment.vnpayResponse = vnpParams;
  await payment.save();

  if (success) {
    const order = await orderRepository.findById(payment.orderId);
    if (order) {
      order.paymentStatus = PAYMENT_STATUSES.PAID;
      await order.save();
      await createNotification({
        userId: order.customerId,
        title: 'Payment successful',
        content: `Order #${order._id} paid via VNPay`,
        type: 'payment',
      });
      emitOrderEvent(order, 'payment_success');
    }
  }
  return { payment, success };
};

const handleVNPayIPN = async (vnpParams) => {
  const isValid = verifyVNPayCallback({ ...vnpParams });
  if (!isValid) return { RspCode: '97', Message: 'Invalid signature' };

  const payment = await paymentRepository.findById(vnpParams.vnp_TxnRef);
  if (!payment) return { RspCode: '01', Message: 'Order not found' };
  if (payment.paymentStatus === PAYMENT_STATUSES.PAID) {
    return { RspCode: '02', Message: 'Already confirmed' };
  }

  const success = vnpParams.vnp_ResponseCode === '00';
  payment.paymentStatus = success ? PAYMENT_STATUSES.PAID : PAYMENT_STATUSES.FAILED;
  payment.transactionId = vnpParams.vnp_TransactionNo || null;
  payment.vnpayResponse = vnpParams;
  await payment.save();

  if (success) {
    const order = await orderRepository.findById(payment.orderId);
    if (order) {
      order.paymentStatus = PAYMENT_STATUSES.PAID;
      await order.save();
      await createNotification({
        userId: order.customerId,
        title: 'Payment successful',
        content: `Order #${order._id} paid via VNPay`,
        type: 'payment',
      });
      emitOrderEvent(order, 'payment_success');
    }
  }
  return { RspCode: '00', Message: 'Confirm Success' };
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
  order.paymentStatus = PAYMENT_STATUSES.PAID;
  await order.save();
  const payment = await paymentRepository.findOne({ orderId });
  if (payment) {
    payment.paymentStatus = PAYMENT_STATUSES.PAID;
    await payment.save();
  }
  return order;
};

module.exports = {
  createPayment,
  handleMoMoCallback,
  handleVNPayReturn,
  handleVNPayIPN,
  confirmCOD,
};
