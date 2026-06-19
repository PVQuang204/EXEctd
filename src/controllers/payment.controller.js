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

// PayOS webhook — called by PayOS server (POST)
exports.payosWebhook = async (req, res) => {
  try {
    const data = await paymentService.handlePayOSWebhook(req.body);
    // PayOS expects a 200 response to acknowledge the webhook
    res.status(200).json({ success: data.success, message: 'ok' });
  } catch (err) {
    console.error('PayOS webhook error:', err.message);
    // Always return 200 so PayOS doesn't retry
    res.status(200).json({ success: false, message: err.message });
  }
};

// PayOS return — user is redirected here after payment (GET)
exports.payosReturn = asyncHandler(async (req, res) => {
  const data = await paymentService.handlePayOSReturn(req.query);
  const redirect = `${process.env.CLIENT_URL}/payment-result?success=${data.success}`;
  res.redirect(redirect);
});

// PayOS cancel — user cancelled payment (GET)
exports.payosCancel = asyncHandler(async (req, res) => {
  const redirect = `${process.env.CLIENT_URL}/payment-result?success=false`;
  res.redirect(redirect);
});

exports.confirmCOD = asyncHandler(async (req, res) => {
  const data = await paymentService.confirmCOD(req.params.orderId, req.user._id);
  res.json({ success: true, data });
});
