const crypto = require('crypto');
const querystring = require('querystring');

const sortObject = (obj) => {
  const sorted = {};
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      sorted[key] = obj[key];
    });
  return sorted;
};

const createVNPayPaymentUrl = ({ amount, orderId, orderInfo, ipAddr, locale = 'vn' }) => {
  const date = new Date();
  const createDate = date
    .toISOString()
    .replace(/[-:TZ.]/g, '')
    .slice(0, 14);
  const expireDate = new Date(date.getTime() + 15 * 60 * 1000)
    .toISOString()
    .replace(/[-:TZ.]/g, '')
    .slice(0, 14);

  let vnpParams = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: process.env.VNPAY_TMN_CODE,
    vnp_Locale: locale,
    vnp_CurrCode: 'VND',
    vnp_TxnRef: String(orderId),
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: 'other',
    vnp_Amount: Math.round(amount * 100),
    vnp_ReturnUrl: process.env.VNPAY_RETURN_URL,
    vnp_IpAddr: ipAddr || '127.0.0.1',
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate,
  };

  vnpParams = sortObject(vnpParams);
  const signData = querystring.stringify(vnpParams, { encode: false });
  const hmac = crypto.createHmac('sha512', process.env.VNPAY_HASH_SECRET);
  const secureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  vnpParams.vnp_SecureHash = secureHash;

  return `${process.env.VNPAY_URL}?${querystring.stringify(vnpParams, { encode: false })}`;
};

const verifyVNPayCallback = (vnpParams) => {
  const secureHash = vnpParams.vnp_SecureHash;
  delete vnpParams.vnp_SecureHash;
  delete vnpParams.vnp_SecureHashType;

  const sorted = sortObject(vnpParams);
  const signData = querystring.stringify(sorted, { encode: false });
  const hmac = crypto.createHmac('sha512', process.env.VNPAY_HASH_SECRET);
  const checkHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  return secureHash === checkHash;
};

module.exports = { createVNPayPaymentUrl, verifyVNPayCallback };
