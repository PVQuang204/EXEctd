const paymentService = require('../../services/payment.service');
const orderService = require('../../services/order.service');
const userRepository = require('../../repositories/user.repository');
const restaurantRepository = require('../../repositories/restaurant.repository');
const foodRepository = require('../../repositories/food.repository');
const categoryRepository = require('../../repositories/category.repository');
const { verifyVNPayCallback } = require('../../config/vnpay');

jest.mock('../../config/vnpay', () => ({
  ...jest.requireActual('../../config/vnpay'),
  verifyVNPayCallback: jest.fn().mockReturnValue(true),
}));

describe('VNPay callback', () => {
  beforeAll(() => {
    process.env.VNPAY_TMN_CODE = 'TEST';
    process.env.VNPAY_HASH_SECRET = 'SECRETSECRETSECRETSECRETSECRETSE';
    process.env.VNPAY_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    process.env.VNPAY_RETURN_URL = 'http://localhost/cb';
  });

  it('marks payment success', async () => {
    const customer = await userRepository.create({
      fullName: 'C',
      email: 'vnpay@test.com',
      password: 'password123',
      role: 'customer',
    });
    const owner = await userRepository.create({
      fullName: 'O',
      email: 'vnpayo@test.com',
      password: 'password123',
      role: 'restaurant_owner',
    });
    const restaurant = await restaurantRepository.create({
      ownerId: owner._id,
      name: 'VN',
      status: 'approved',
    });
    const cat = await categoryRepository.create({ restaurantId: restaurant._id, name: 'M' });
    const food = await foodRepository.create({
      restaurantId: restaurant._id,
      categoryId: cat._id,
      name: 'F',
      price: 50000,
      stock: 5,
    });
    const order = await orderService.createOrder(customer._id, {
      restaurantId: restaurant._id,
      items: [{ foodId: food._id, quantity: 1 }],
      deliveryAddress: 'X',
    });
    const { payment } = await paymentService.createPayment(order._id, customer._id, {
      paymentMethod: 'vnpay',
    });
    const result = await paymentService.handleVNPayCallback({
      vnp_TxnRef: payment._id.toString(),
      vnp_ResponseCode: '00',
      vnp_TransactionNo: 'TX123',
      vnp_SecureHash: 'mock',
    });
    expect(result.success).toBe(true);
    verifyVNPayCallback.mockReturnValue(false);
    await expect(
      paymentService.handleVNPayCallback({ vnp_TxnRef: payment._id.toString() })
    ).rejects.toThrow();
  });
});
