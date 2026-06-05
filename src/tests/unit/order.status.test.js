const orderService = require('../../services/order.service');
const orderRepository = require('../../repositories/order.repository');
const restaurantRepository = require('../../repositories/restaurant.repository');
const foodRepository = require('../../repositories/food.repository');
const categoryRepository = require('../../repositories/category.repository');
const userRepository = require('../../repositories/user.repository');

describe('Order status transitions', () => {
  let customer;
  let owner;
  let restaurant;
  let food;

  beforeEach(async () => {
    customer = await userRepository.create({
      fullName: 'C',
      email: 'c@test.com',
      password: 'password123',
      role: 'customer',
    });
    owner = await userRepository.create({
      fullName: 'O',
      email: 'o@test.com',
      password: 'password123',
      role: 'restaurant_owner',
    });
    restaurant = await restaurantRepository.create({
      ownerId: owner._id,
      name: 'R1',
      status: 'approved',
      latitude: 10,
      longitude: 106,
      location: { type: 'Point', coordinates: [106, 10] },
    });
    const cat = await categoryRepository.create({
      restaurantId: restaurant._id,
      name: 'Main',
    });
    food = await foodRepository.create({
      restaurantId: restaurant._id,
      categoryId: cat._id,
      name: 'Pho',
      price: 50000,
      stock: 100,
    });
  });

  it('creates order and transitions status', async () => {
    const order = await orderService.createOrder(customer._id, {
      restaurantId: restaurant._id,
      items: [{ foodId: food._id, quantity: 1 }],
      deliveryAddress: '123 Street',
    });
    expect(order.status).toBe('pending');

    let updated = await orderService.transitionStatus(order._id, 'confirmed', owner);
    expect(updated.status).toBe('confirmed');

    updated = await orderService.transitionStatus(order._id, 'preparing', owner);
    expect(updated.status).toBe('preparing');

    updated = await orderService.transitionStatus(order._id, 'ready', owner);
    expect(updated.status).toBe('ready');
  });
});
