const paymentService = require('../../services/payment.service');
const orderService = require('../../services/order.service');
const orderRepository = require('../../repositories/order.repository');
const userRepository = require('../../repositories/user.repository');
const restaurantRepository = require('../../repositories/restaurant.repository');
const foodRepository = require('../../repositories/food.repository');
const categoryRepository = require('../../repositories/category.repository');

jest.mock('../../services/order.service', () => ({
  createOrder: jest.fn(),
  transitionStatus: jest.fn(),
}));

describe('Payment COD', () => {
  it('creates COD payment', async () => {
    const customer = await userRepository.create({
      fullName: 'C',
      email: 'paycod@test.com',
      password: 'password123',
      role: 'customer',
    });
    const owner = await userRepository.create({
      fullName: 'O',
      email: 'paycodo@test.com',
      password: 'password123',
      role: 'restaurant_owner',
    });
    const restaurant = await restaurantRepository.create({
      ownerId: owner._id,
      name: 'Pay Resto',
      status: 'approved',
    });
    const cat = await categoryRepository.create({ restaurantId: restaurant._id, name: 'M' });
    await foodRepository.create({
      restaurantId: restaurant._id,
      categoryId: cat._id,
      name: 'Soup',
      price: 40000,
      stock: 10,
    });
    orderService.createOrder.mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      customerId: customer._id,
      restaurantId: restaurant._id,
    });
    const mockOrder = {
      _id: '507f1f77bcf86cd799439011',
      customerId: customer._id,
      restaurantId: restaurant._id,
      totalAmount: 40000,
    };
    jest.spyOn(orderRepository, 'findById').mockImplementation((id, opts) => {
      if (opts?.populate === 'restaurantId') {
        return Promise.resolve({
          _id: mockOrder._id,
          customerId: customer._id,
          restaurantId: restaurant._id,
          paymentStatus: 'unpaid',
          save: jest.fn().mockResolvedValue(true),
        });
      }
      return Promise.resolve(mockOrder);
    });
    jest.spyOn(restaurantRepository, 'findById').mockResolvedValue({
      _id: restaurant._id,
      ownerId: owner._id,
    });
    const result = await paymentService.createPayment(mockOrder._id, customer._id, {
      paymentMethod: 'cod',
    });
    expect(result.payment.paymentMethod).toBe('cod');
    const confirmed = await paymentService.confirmCOD(mockOrder._id, owner._id);
    expect(confirmed.paymentStatus).toBe('paid');
  });
});
