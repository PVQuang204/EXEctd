const paymentRepository = require('../repositories/payment.repository');
const orderRepository = require('../repositories/order.repository');
const { createPayOSPaymentLink, verifyPayOSWebhook, getPayOSPaymentInfo } = require('../config/payos');
const { createNotification } = require('./notification.service');
const { emitOrderEvent } = require('../sockets');
const { PAYMENT_METHODS, PAYMENT_STATUSES, ORDER_STATUSES, getDepositAmount } = require('../constants');
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

  let payment = await paymentRepository.findOne({ orderId, paymentStatus: PAYMENT_STATUSES.UNPAID });
  if (payment && payment.paymentMethod === paymentMethod) {
    // Nếu đã có payment chưa thanh toán cùng phương thức, trả về luôn (tránh tạo nhiều link PayOS)
    if (paymentMethod === PAYMENT_METHODS.PAYOS && payment.payosResponse?.checkoutUrl) {
      return {
        payment,
        paymentUrl: payment.payosResponse.checkoutUrl,
        depositAmount: order.depositAmount,
        remainingAmount: order.remainingAmount,
        totalAmount: order.totalAmount,
        message: 'Tiếp tục thanh toán cọc',
      };
    }
  }

  const depositAmt = order.depositAmount;
  const remainingAmt = order.remainingAmount;

  // PayOS: thanh toán full (không cọc)
  if (paymentMethod === PAYMENT_METHODS.PAYOS) {
    const amount = order.totalAmount;
    const orderCode = Number(
      `${Date.now()}`.slice(-10) + `${Math.floor(Math.random() * 1000)}`.padStart(3, '0')
    );

    const payosResult = await createPayOSPaymentLink({
      orderCode,
      amount,
      description: `Thanh toan don hang ${order.orderCode}`.substring(0, 25),
      cancelUrl: `${process.env.CLIENT_URL}/payment-result?cancel=true&orderId=${orderId}`,
      returnUrl: `${process.env.CLIENT_URL}/payment-result?success=true&orderId=${orderId}`,
    });

    payment = await paymentRepository.create({
      orderId,
      amount,
      paymentMethod,
      paymentStatus: PAYMENT_STATUSES.UNPAID,
      paymentPhase: 'full',
      payosOrderCode: orderCode,
      payosResponse: payosResult,
    });

    return {
      payment,
      paymentUrl: payosResult.checkoutUrl,
      totalAmount: order.totalAmount,
      message: 'Thanh toán toàn bộ đơn hàng qua PayOS.',
    };
  }

  // COD: cần cọc trước qua PayOS, phần còn lại thu khi nhận
  if (depositAmt > 0 && order.paymentPhase === 'deposit') {
    if (paymentMethod === PAYMENT_METHODS.COD) {
      const orderCode = Number(
        `${Date.now()}`.slice(-10) + `${Math.floor(Math.random() * 1000)}`.padStart(3, '0')
      );

      const payosResult = await createPayOSPaymentLink({
        orderCode,
        amount: depositAmt,
        description: `Coc don hang ${order.orderCode}`.substring(0, 25),
        cancelUrl: `${process.env.CLIENT_URL}/payment-result?cancel=true&orderId=${orderId}`,
        returnUrl: `${process.env.CLIENT_URL}/payment-result?success=true&orderId=${orderId}`,
      });

      payment = await paymentRepository.create({
        orderId,
        amount: depositAmt,
        paymentMethod: PAYMENT_METHODS.PAYOS,
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
        message: `Thanh toán cọc ${Math.round((depositAmt / order.totalAmount) * 100)}% (${depositAmt.toLocaleString()}đ) qua PayOS. Phần còn lại ${remainingAmt.toLocaleString()}đ sẽ thu COD khi nhận hàng.`,
      };
    }
  }

  // COD không cần cọc (đơn nhỏ)
  if (paymentMethod === PAYMENT_METHODS.COD) {
    await orderRepository.updateById(orderId, {
      paymentMethod: PAYMENT_METHODS.COD,
      paymentStatus: PAYMENT_STATUSES.UNPAID
    });

    return {
      success: true,
      message: 'Đơn hàng sẽ được thanh toán bằng tiền mặt khi nhận hàng (COD).',
      totalAmount: order.totalAmount
    };
  }

  throw new ApiError(400, 'Invalid payment method');
};

const handlePayOSWebhook = async (webhookBody) => {
  console.log('[PayOS Webhook] Body:', JSON.stringify(webhookBody));
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
      if (order.status === ORDER_STATUSES.PENDING) {
        order.status = ORDER_STATUSES.CONFIRMED;
      }
      await order.save();

      const isDeposit = payment.paymentPhase === 'deposit';
      await createNotification({
        userId: order.customerId,
        title: isDeposit ? 'Đặt cọc thành công' : 'Thanh toán thành công',
        content: isDeposit
          ? `Đơn hàng #${order._id} đã đặt cọc thành công. Vui lòng thanh toán ${order.remainingAmount.toLocaleString()}đ khi nhận hàng.`
          : `Đơn hàng #${order._id} đã thanh toán toàn bộ qua PayOS.`,
        type: 'payment',
      });
      emitOrderEvent(order, 'payment_success');
    }
  }

  return {
    payment,
    success,
    order: order ? { totalAmount: order.totalAmount, depositAmount: order.depositAmount, remainingAmount: order.remainingAmount } : null,
  };
};

const handlePayOSReturn = async (query) => {
  console.log('[PayOS Return] Query params:', query);
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

  // PayOS redirect có thể gửi success=true hoặc cancel=true
  // Hoặc có thể gửi kèm orderCode để verify
  const isCancelled = cancel === 'true' || status === 'CANCELLED';
  
  if (isCancelled) {
    payment.paymentStatus = PAYMENT_STATUSES.FAILED;
    await payment.save();
    return { payment, success: false };
  }

  // Gọi PayOS API để lấy trạng thái thực (bất kể query params)
  try {
    const payosInfo = await getPayOSPaymentInfo(Number(orderCode));
    console.log('[PayOS Return] PayOS info:', payosInfo);
    
    if (payosInfo.status === 'PAID') {
      payment.paymentStatus = PAYMENT_STATUSES.PAID;
      payment.transactionId = payosInfo.id || String(payosInfo.paymentLinkId || '');
      payment.payosResponse = payosInfo;
      await payment.save();

      const order = await orderRepository.findById(payment.orderId);
      if (order && order.paymentStatus !== PAYMENT_STATUSES.PAID) {
        order.paymentStatus = PAYMENT_STATUSES.PAID;
        if (order.status === ORDER_STATUSES.PENDING) {
          order.status = ORDER_STATUSES.CONFIRMED;
        }
        await order.save();

        const isDeposit = payment.paymentPhase === 'deposit';
        await createNotification({
          userId: order.customerId,
          title: isDeposit ? 'Đặt cọc thành công' : 'Thanh toán thành công',
          content: isDeposit
            ? `Đơn hàng #${order._id} đã đặt cọc thành công. Vui lòng thanh toán ${order.remainingAmount.toLocaleString()}đ khi nhận hàng.`
            : `Đơn hàng #${order._id} đã thanh toán toàn bộ qua PayOS.`,
          type: 'payment',
        });
        emitOrderEvent(order, 'payment_success');
      }

      return {
        payment,
        success: true,
        order: order ? { totalAmount: order.totalAmount, depositAmount: order.depositAmount, remainingAmount: order.remainingAmount } : null,
      };
    }
  } catch (err) {
    console.error('PayOS getPaymentInfo error:', err.message);
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
