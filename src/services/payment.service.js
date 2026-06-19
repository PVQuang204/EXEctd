const paymentRepository = require('../repositories/payment.repository');
const orderRepository = require('../repositories/order.repository');
const { createPayOSPaymentLink, verifyPayOSWebhook, getPayOSPaymentInfo } = require('../config/payos');
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

  if (paymentMethod === PAYMENT_METHODS.PAYOS) {
    // Generate a unique numeric order code for PayOS (max 9007199254740991)
    // Use timestamp + random digits to avoid collision
    const orderCode = Number(`${Date.now()}`.slice(-10) + `${Math.floor(Math.random() * 1000)}`.padStart(3, '0'));

    // Build items list for PayOS
    const items = order.items.map((item) => ({
      name: item.name.substring(0, 50), // PayOS limits item name
      quantity: item.quantity,
      price: Math.round(item.price),
    }));

    const payosResult = await createPayOSPaymentLink({
      orderCode,
      amount: Math.round(order.totalAmount),
      description: `DH ${orderId}`.substring(0, 25),
      items,
    });

    // Save the PayOS order code for later webhook matching
    payment.payosOrderCode = orderCode;
    payment.payosResponse = payosResult;
    await payment.save();

    return { payment, paymentUrl: payosResult.checkoutUrl };
  }

  throw new ApiError(400, 'Invalid payment method');
};

const handlePayOSWebhook = async (webhookBody) => {
  // Verify the webhook signature
  let verifiedData;
  try {
    verifiedData = verifyPayOSWebhook(webhookBody);
  } catch (err) {
    throw new ApiError(400, `Invalid PayOS webhook signature: ${err.message}`);
  }

  const orderCode = verifiedData.orderCode;

  // Find the payment by payosOrderCode
  const payment = await paymentRepository.findOne({ payosOrderCode: orderCode });
  if (!payment) {
    // Could be a test webhook or unknown payment — just acknowledge
    return { success: false, message: 'Payment not found' };
  }

  if (payment.paymentStatus === PAYMENT_STATUSES.PAID) {
    return { payment, success: true };
  }

  // PayOS webhook code: "00" means success
  const webhookCode = webhookBody.code || verifiedData.code;
  const success = webhookCode === '00' || webhookCode === 0;

  payment.paymentStatus = success ? PAYMENT_STATUSES.PAID : PAYMENT_STATUSES.FAILED;
  payment.transactionId = verifiedData.reference || String(verifiedData.paymentLinkId || '');
  payment.payosResponse = verifiedData;
  await payment.save();

  if (success) {
    const order = await orderRepository.findById(payment.orderId);
    if (order) {
      order.paymentStatus = PAYMENT_STATUSES.PAID;
      await order.save();
      await createNotification({
        userId: order.customerId,
        title: 'Thanh toán thành công',
        content: `Đơn hàng #${order._id} đã thanh toán qua PayOS`,
        type: 'payment',
      });
      emitOrderEvent(order, 'payment_success');
    }
  }

  return { payment, success };
};

/**
 * Handle PayOS return URL (GET redirect after payment).
 * PayOS redirects with query params: ?code=00&id=xxx&cancel=false&status=PAID&orderCode=xxx
 */
const handlePayOSReturn = async (query) => {
  const { orderCode, code, status, cancel } = query;

  if (!orderCode) {
    throw new ApiError(400, 'Missing orderCode');
  }

  const payment = await paymentRepository.findOne({ payosOrderCode: Number(orderCode) });
  if (!payment) {
    return { success: false, message: 'Payment not found' };
  }

  // If already paid, just return success
  if (payment.paymentStatus === PAYMENT_STATUSES.PAID) {
    return { payment, success: true };
  }

  // Check if canceled
  if (cancel === 'true' || status === 'CANCELLED') {
    payment.paymentStatus = PAYMENT_STATUSES.FAILED;
    await payment.save();
    return { payment, success: false };
  }

  // Verify with PayOS API for security
  const success = code === '00' && status === 'PAID';

  if (success) {
    try {
      const payosInfo = await getPayOSPaymentInfo(Number(orderCode));
      if (payosInfo.status === 'PAID') {
        payment.paymentStatus = PAYMENT_STATUSES.PAID;
        payment.transactionId = payosInfo.id || String(payosInfo.paymentLinkId || '');
        payment.payosResponse = payosInfo;
        await payment.save();

        const order = await orderRepository.findById(payment.orderId);
        if (order && order.paymentStatus !== PAYMENT_STATUSES.PAID) {
          order.paymentStatus = PAYMENT_STATUSES.PAID;
          await order.save();
          await createNotification({
            userId: order.customerId,
            title: 'Thanh toán thành công',
            content: `Đơn hàng #${order._id} đã thanh toán qua PayOS`,
            type: 'payment',
          });
          emitOrderEvent(order, 'payment_success');
        }

        return { payment, success: true };
      }
    } catch (err) {
      // If PayOS API fails, fall through
      console.error('PayOS getPaymentInfo error:', err.message);
    }
  }

  return { payment, success: false };
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
  handlePayOSWebhook,
  handlePayOSReturn,
  confirmCOD,
};
