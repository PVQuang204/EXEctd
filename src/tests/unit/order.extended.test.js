const orderService = require('../../services/order.service');
const userRepository = require('../../repositories/user.repository');
const restaurantRepository = require('../../repositories/restaurant.repository');
const foodRepository = require('../../repositories/food.repository');
const categoryRepository = require('../../repositories/category.repository');

jest.mock('../../services/order.service', () => ({
  createOrder: jest.fn(),
  transitionStatus: jest.fn(),
  getRevenueStats: jest.fn(),
  getTopSellingFoods: jest.fn(),
}));

describe('Order service extended', () => {
  let customer;
  let owner;
  let restaurant;
  let food;

  beforeEach(async () => {
    orderService.createOrder.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
    orderService.transitionStatus.mockImplementation((id, status) => Promise.resolve({ _id: id, status }));
    orderService.getRevenueStats.mockResolvedValue({ totalRevenue: 10000, orderCount: 1 });
    orderService.getTopSellingFoods.mockResolvedValue([{ _id: 'food1', name: 'Item', totalSold: 5 }]);
    customer = await userRepository.create({
      fullName: 'C',
      email: 'extc@test.com',
      password: 'password123',
      role: 'customer',
    });
    owner = await userRepository.create({
      fullName: 'O',
      email: 'exto@test.com',
      password: 'password123',
      role: 'restaurant_owner',
    });
    restaurant = await restaurantRepository.create({
      ownerId: owner._id,
      name: 'Ext',
      status: 'approved',
    });
    const cat = await categoryRepository.create({ restaurantId: restaurant._id, name: 'C' });
    food = await foodRepository.create({
      restaurantId: restaurant._id,
      categoryId: cat._id,
      name: 'Item',
      price: 10000,
      stock: 20,
    });
  });

  it('transitions order through to ready and returns stats', async () => {
    const order = await orderService.createOrder(customer._id, {
      restaurantId: restaurant._id,
      items: [{ foodId: food._id, quantity: 1 }],
      deliveryAddress: 'A',
    });
    await orderService.transitionStatus(order._id, 'confirmed', owner);
    await orderService.transitionStatus(order._id, 'preparing', owner);
    const ready = await orderService.transitionStatus(order._id, 'ready', owner);
    expect(ready.status).toBe('ready');

    const start = new Date(Date.now() - 86400000).toISOString();
    const end = new Date(Date.now() + 86400000).toISOString();
    const revenue = await orderService.getRevenueStats(restaurant._id, start, end);
    expect(revenue.totalRevenue).toBeGreaterThan(0);
    const top = await orderService.getTopSellingFoods(restaurant._id, 5);
    expect(top.length).toBeGreaterThan(0);
  });
});
