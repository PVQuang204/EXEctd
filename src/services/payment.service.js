const paymentRepository = require('../repositories/payment.repository');
const orderRepository = require('../repositories/order.repository');
const { createPayOSPaymentLink, verifyPayOSWebhook, getPayOSPaymentInfo } = require('../config/payos');
const { createNotification } = require('./notification.service');
const { emitOrderEvent } = require('../sockets');
const { PAYMENT_METHODS, PAYMENT_STATUSES, getDepositAmount } = require('../constants');
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
  if (payment) {
    throw new ApiError(400, 'Payment already initiated for this order');
  }

  const depositAmt = getDepositAmount(order.totalAmount);
  const remainingAmt = order.totalAmount - depositAmt;

  // Update order with deposit info
  await orderRepository.updateById(orderId, {
    depositAmount: depositAmt,
    remainingAmount: remainingAmt,
    paymentPhase: 'deposit',
  });

  if (paymentMethod === PAYMENT_METHODS.COD) {
    payment = await paymentRepository.create({
      orderId,
      amount: depositAmt,
      paymentMethod,
      paymentStatus: PAYMENT_STATUSES.UNPAID,
      paymentPhase: 'deposit',
    });
    await orderRepository.updateById(orderId, { paymentStatus: PAYMENT_STATUSES.UNPAID });
    return {
      payment,
      depositAmount: depositAmt,
      remainingAmount: remainingAmt,
      totalAmount: order.totalAmount,
      message: `Thanh toán cọc ${Math.round((depositAmt / order.totalAmount) * 100)}% (${depositAmt.toLocaleString()}đ) khi nhận hàng. Còn lại: ${remainingAmt.toLocaleString()}đ`,
    };
  }

  if (paymentMethod === PAYMENT_METHODS.PAYOS) {
    const orderCode = Number(
      `${Date.now()}`.slice(-10) + `${Math.floor(Math.random() * 1000)}`.padStart(3, '0')
    );

    const items = order.items.map((item) => ({
      name: item.name.substring(0, 50),
      quantity: item.quantity,
      price: Math.round(item.price),
    }));

    const payosResult = await createPayOSPaymentLink({
      orderCode,
      amount: depositAmt,
      description: `Coc ${orderId}`.substring(0, 25),
      items,
    });

    payment = await paymentRepository.create({
      orderId,
      amount: depositAmt,
      paymentMethod,
      paymentStatus: PAYMENT_STATUSES.UNPAID,
      paymentPhase: 'deposit',
      payosOrderCode: orderCode,
      payosResponse: payosResult,
    });

    return {
      payment,
      paymentUrl: payosResult.checkoutUrl,
      depositAmount: depositAmt,
      remainingAmount: remainingAmt,
      totalAmount: order.totalAmount,
      depositPercent: Math.round((depositAmt / order.totalAmount) * 100),
      message: `Vui lòng thanh toán cọc ${Math.round((depositAmt / order.totalAmount) * 100)}% (${depositAmt.toLocaleString()}đ). Số tiền còn lại: ${remainingAmt.toLocaleString()}đ sẽ thanh toán khi nhận hàng.`,
    };
  }

  throw new ApiError(400, 'Invalid payment method');
};

const handlePayOSWebhook = async (webhookBody) => {
  let verifiedData;
  try {
    verifiedData = verifyPayOSWebhook(webhookBody);
  } catch (err) {
    throw new ApiError(400, `Invalid PayOS webhook signature: ${err.message}`);
  }

  const orderCode = verifiedData.orderCode;
  const payment = await paymentRepository.findOne({ payosOrderCode: orderCode });
  if (!payment) {
    return { success: false, message: 'Payment not found' };
  }

  if (payment.paymentStatus === PAYMENT_STATUSES.PAID) {
    return { payment, success: true };
  }

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
      order.paymentPhase = 'deposit';
      await order.save();
      await createNotification({
        userId: order.customerId,
        title: 'Đặt cọc thành công',
        content: `Đơn hàng #${order._id} đã đặt cọc thành công. Vui lòng thanh toán ${order.remainingAmount.toLocaleString()}đ khi nhận hàng.`,
        type: 'payment',
      });
      emitOrderEvent(order, 'payment_success');
    }
  }

  return { payment, success };
};

const handlePayOSReturn = async (query) => {
  const { orderCode, code, status, cancel } = query;

  if (!orderCode) {
    throw new ApiError(400, 'Missing orderCode');
  }

  const payment = await paymentRepository.findOne({ payosOrderCode: Number(orderCode) });
  if (!payment) {
    return { success: false, message: 'Payment not found' };
  }

  if (payment.paymentStatus === PAYMENT_STATUSES.PAID) {
    return { payment, success: true };
  }

  if (cancel === 'true' || status === 'CANCELLED') {
    payment.paymentStatus = PAYMENT_STATUSES.FAILED;
    await payment.save();
    return { payment, success: false };
  }

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
          order.paymentPhase = 'deposit';
          await order.save();
          await createNotification({
            userId: order.customerId,
            title: 'Đặt cọc thành công',
            content: `Đơn hàng #${order._id} đã đặt cọc thành công. Vui lòng thanh toán ${order.remainingAmount.toLocaleString()}đ khi nhận hàng.`,
            type: 'payment',
          });
          emitOrderEvent(order, 'payment_success');
        }

        return { payment, success: true };
      }
    } catch (err) {
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
