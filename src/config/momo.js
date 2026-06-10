const crypto = require('crypto');

const momoConfig = {
  partnerCode: process.env.MOMO_PARTNER_CODE || 'MOMO',
  accessKey: process.env.MOMO_ACCESS_KEY || '',
  secretKey: process.env.MOMO_SECRET_KEY || '',
  endpoint: process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api',
  redirectUrl: process.env.MOMO_REDIRECT_URL || 'http://localhost:5000/api/payments/momo/result',
  ipnUrl: process.env.MOMO_IPN_URL || 'http://localhost:5000/api/payments/momo/callback',
  requestType: 'payWithMethod',
};

const createMoMoPaymentUrl = async ({ amount, orderId, orderInfo }) => {
  const { partnerCode, accessKey, secretKey, endpoint, redirectUrl, ipnUrl, requestType } = momoConfig;

  const requestId = `${partnerCode}_${Date.now()}`;
  const extraData = '';

  // Build raw signature string per MoMo v2 spec
  const rawSignature = [
    `accessKey=${accessKey}`,
    `amount=${amount}`,
    `extraData=${extraData}`,
    `ipnUrl=${ipnUrl}`,
    `orderId=${orderId}`,
    `orderInfo=${orderInfo}`,
    `partnerCode=${partnerCode}`,
    `redirectUrl=${redirectUrl}`,
    `requestId=${requestId}`,
    `requestType=${requestType}`,
  ].join('&');

  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(rawSignature)
    .digest('hex');

  const requestBody = {
    partnerCode,
    accessKey,
    requestId,
    amount: Math.round(amount),
    orderId,
    orderInfo,
    redirectUrl,
    ipnUrl,
    extraData,
    requestType,
    signature,
    lang: 'vi',
  };

  const response = await fetch(`${endpoint}/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();

  if (data.resultCode !== 0) {
    throw new Error(`MoMo error: ${data.message || 'Unknown error'} (code: ${data.resultCode})`);
  }

  return data.payUrl;
};

const verifyMoMoCallback = (params) => {
  const { secretKey, accessKey } = momoConfig;

  const rawSignature = [
    `accessKey=${accessKey}`,
    `amount=${params.amount}`,
    `extraData=${params.extraData}`,
    `message=${params.message}`,
    `orderId=${params.orderId}`,
    `orderInfo=${params.orderInfo}`,
    `orderType=${params.orderType}`,
    `partnerCode=${params.partnerCode}`,
    `payType=${params.payType}`,
    `requestId=${params.requestId}`,
    `responseTime=${params.responseTime}`,
    `resultCode=${params.resultCode}`,
    `transId=${params.transId}`,
  ].join('&');

  const checkSignature = crypto
    .createHmac('sha256', secretKey)
    .update(rawSignature)
    .digest('hex');

  return checkSignature === params.signature;
};

module.exports = { momoConfig, createMoMoPaymentUrl, verifyMoMoCallback };
