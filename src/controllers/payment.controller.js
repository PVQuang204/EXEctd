const paymentService = require('../services/payment.service');
const asyncHandler = require('../utils/asyncHandler');

exports.create = asyncHandler(async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const data = await paymentService.createPayment(req.params.orderId, req.user._id, req.body, ip);
  res.json({ success: true, data });
});

exports.vnpayCallback = asyncHandler(async (req, res) => {
  const data = await paymentService.handleVNPayCallback(req.query);
  const redirect = `${process.env.CLIENT_URL}/payment-result?success=${data.success}`;
  res.redirect(redirect);
});

exports.vnpayIpn = asyncHandler(async (req, res) => {
  const data = await paymentService.handleVNPayCallback(req.query);
  res.status(200).json({ RspCode: data.success ? '00' : '99', Message: 'Confirm Success' });
});

exports.confirmCOD = asyncHandler(async (req, res) => {
  const data = await paymentService.confirmCOD(req.params.orderId, req.user._id);
  res.json({ success: true, data });
});
