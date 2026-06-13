const paymentService = require('../../services/payment.service');
const orderService = require('../../services/order.service');
const orderRepository = require('../../repositories/order.repository');
const userRepository = require('../../repositories/user.repository');
const restaurantRepository = require('../../repositories/restaurant.repository');
const foodRepository = require('../../repositories/food.repository');
const categoryRepository = require('../../repositories/category.repository');
const { verifyVNPayCallback } = require('../../config/vnpay');

jest.mock('../../config/vnpay', () => ({
  ...jest.requireActual('../../config/vnpay'),
  verifyVNPayCallback: jest.fn().mockReturnValue(true),
}));

jest.mock('../../services/order.service', () => ({
  createOrder: jest.fn(),
  transitionStatus: jest.fn(),
}));

jest.mock('../../services/notification.service', () => ({
  createNotification: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../sockets', () => ({
  emitOrderEvent: jest.fn(),
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
      email: 'vnpay2@test.com',
      password: 'password123',
      role: 'customer',
    });
    const owner = await userRepository.create({
      fullName: 'O',
      email: 'vnpayo2@test.com',
      password: 'password123',
      role: 'restaurant_owner',
    });
    const restaurant = await restaurantRepository.create({
      ownerId: owner._id,
      name: 'VN',
      status: 'approved',
    });
    await categoryRepository.create({ restaurantId: restaurant._id, name: 'M' });
    await foodRepository.create({
      restaurantId: restaurant._id,
      categoryId: restaurant._id,
      name: 'F',
      price: 50000,
      stock: 5,
    });
    const orderId = '507f1f77bcf86cd799439011';
    const paymentId = '607f1f77bcf86cd799439011';
    orderService.createOrder.mockResolvedValue({ _id: orderId });
    orderService.transitionStatus.mockResolvedValue({});
    const mockOrder = {
      _id: orderId,
      customerId: customer._id,
      restaurantId: restaurant._id,
      totalAmount: 50000,
      save: jest.fn().mockResolvedValue(true),
    };
    jest.spyOn(orderRepository, 'findById').mockResolvedValue(mockOrder);
    // createPayment saves a payment doc with _id; handleVNPayReturn finds it by id
    const { payment } = await paymentService.createPayment(orderId, customer._id, {
      paymentMethod: 'vnpay',
    });
    // handleVNPayReturn is the function called on return from VNPay
    const result = await paymentService.handleVNPayReturn({
      vnp_TxnRef: payment._id.toString(),
      vnp_ResponseCode: '00',
      vnp_TransactionNo: 'TX123',
      vnp_SecureHash: 'mock',
    });
    expect(result.success).toBe(true);
    verifyVNPayCallback.mockReturnValue(false);
    await expect(
      paymentService.handleVNPayReturn({ vnp_TxnRef: payment._id.toString() })
    ).rejects.toThrow();
  });
});
