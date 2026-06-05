const orderService = require('../../services/order.service');
const userRepository = require('../../repositories/user.repository');
const restaurantRepository = require('../../repositories/restaurant.repository');
const foodRepository = require('../../repositories/food.repository');
const categoryRepository = require('../../repositories/category.repository');

describe('Order service extended', () => {
  let customer;
  let owner;
  let driver;
  let restaurant;
  let food;

  beforeEach(async () => {
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
    driver = await userRepository.create({
      fullName: 'D',
      email: 'extd@test.com',
      password: 'password123',
      role: 'delivery_staff',
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

  it('assigns driver and returns stats', async () => {
    const order = await orderService.createOrder(customer._id, {
      restaurantId: restaurant._id,
      items: [{ foodId: food._id, quantity: 1 }],
      deliveryAddress: 'A',
    });
    await orderService.transitionStatus(order._id, 'confirmed', owner);
    await orderService.transitionStatus(order._id, 'preparing', owner);
    await orderService.transitionStatus(order._id, 'ready', owner);
    const assigned = await orderService.assignDriver(order._id, driver._id);
    expect(assigned.driverId.toString()).toBe(driver._id.toString());

    await orderService.transitionStatus(order._id, 'delivering', driver);
    await orderService.transitionStatus(order._id, 'completed', driver);

    const start = new Date(Date.now() - 86400000).toISOString();
    const end = new Date(Date.now() + 86400000).toISOString();
    const revenue = await orderService.getRevenueStats(restaurant._id, start, end);
    expect(revenue.totalRevenue).toBeGreaterThan(0);
    const top = await orderService.getTopSellingFoods(restaurant._id, 5);
    expect(top.length).toBeGreaterThan(0);
  });
});
