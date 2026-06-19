const paymentService = require('../services/payment.service');
const asyncHandler = require('../utils/asyncHandler');

exports.create = asyncHandler(async (req, res) => {
  const ipAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;
  const data = await paymentService.createPayment(req.params.orderId, req.user._id, req.body, ipAddr);
  res.json({ success: true, data });
});

// PayOS webhook — called by PayOS server (POST)
exports.payosWebhook = asyncHandler(async (req, res) => {
  let data;
  try {
    data = await paymentService.handlePayOSWebhook(req.body);
  } catch (err) {
    console.error('PayOS webhook error:', err.message);
    return res.status(200).json({ success: false, message: err.message });
  }
  res.status(200).json({ success: data.success, message: 'ok' });
});

// PayOS return — user is redirected here after payment (GET)
exports.payosReturn = asyncHandler(async (req, res) => {
  const data = await paymentService.handlePayOSReturn(req.query);
  const payment = data.payment;
  const params = new URLSearchParams({
    success: String(data.success),
    orderId: payment?.orderId || '',
    cancel: 'false',
  });
  res.redirect(`${process.env.CLIENT_URL}/payment-result?${params.toString()}`);
});

// PayOS cancel — user cancelled payment (GET)
exports.payosCancel = asyncHandler(async (req, res) => {
  const { orderId } = req.query;
  const params = new URLSearchParams({ success: 'false', cancel: 'true', orderId: orderId || '' });
  res.redirect(`${process.env.CLIENT_URL}/payment-result?${params.toString()}`);
});

exports.confirmCOD = asyncHandler(async (req, res) => {
  const data = await paymentService.confirmCOD(req.params.orderId, req.user._id);
  res.json({ success: true, data });
});
