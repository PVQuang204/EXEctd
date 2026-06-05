const { createVNPayPaymentUrl, verifyVNPayCallback } = require('../../config/vnpay');

describe('VNPay config', () => {
  beforeAll(() => {
    process.env.VNPAY_TMN_CODE = 'TESTCODE';
    process.env.VNPAY_HASH_SECRET = 'TESTSECRETTESTSECRETTESTSECRET';
    process.env.VNPAY_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    process.env.VNPAY_RETURN_URL = 'http://localhost/callback';
  });

  it('creates payment URL with secure hash', () => {
    const url = createVNPayPaymentUrl({
      amount: 100000,
      orderId: '507f1f77bcf86cd799439011',
      orderInfo: 'Test order',
      ipAddr: '127.0.0.1',
    });
    expect(url).toContain('vnp_SecureHash=');
    expect(url).toContain('vnp_TmnCode=TESTCODE');
  });

  it('rejects tampered callback', () => {
    expect(verifyVNPayCallback({ vnp_TxnRef: 'x', vnp_SecureHash: 'invalid' })).toBe(false);
  });
});
