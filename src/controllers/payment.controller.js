const paymentService = require('../services/payment.service');
const asyncHandler = require('../utils/asyncHandler');

exports.create = asyncHandler(async (req, res) => {
  const ipAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;
  const data = await paymentService.createPayment(req.params.orderId, req.user._id, req.body, ipAddr);
  res.json({ success: true, data });
});

exports.momoCallback = asyncHandler(async (req, res) => {
  const data = await paymentService.handleMoMoCallback(req.query);
  const redirect = `${process.env.CLIENT_URL}/payment-result?success=${data.success}`;
  res.redirect(redirect);
});

exports.momoIpn = asyncHandler(async (req, res) => {
  const data = await paymentService.handleMoMoCallback(req.body);
  res.status(200).json({ resultCode: data.success ? 0 : 1, message: 'ok' });
});

exports.vnpayReturn = asyncHandler(async (req, res) => {
  const data = await paymentService.handleVNPayReturn(req.query);
  const redirect = `${process.env.CLIENT_URL}/payment-result?success=${data.success}`;
  res.redirect(redirect);
});

exports.vnpayIpn = asyncHandler(async (req, res) => {
  const result = await paymentService.handleVNPayIPN(req.query);
  res.status(200).json(result);
});

exports.confirmCOD = asyncHandler(async (req, res) => {
  const data = await paymentService.confirmCOD(req.params.orderId, req.user._id);
  res.json({ success: true, data });
});
