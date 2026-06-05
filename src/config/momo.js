module.exports = {
  partnerCode: process.env.MOMO_PARTNER_CODE || 'MOMO',
  accessKey: process.env.MOMO_ACCESS_KEY || '',
  secretKey: process.env.MOMO_SECRET_KEY || '',
  endpoint: process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api',
  redirectUrl: process.env.MOMO_REDIRECT_URL || 'http://localhost:5000/api/payments/momo/result',
  ipnUrl: process.env.MOMO_IPN_URL || 'http://localhost:5000/api/payments/momo/callback',
  requestType: 'payWithMethod',
};
