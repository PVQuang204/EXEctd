const reviewService = require('../../services/review.service');
const restaurantRepository = require('../../repositories/restaurant.repository');
const userRepository = require('../../repositories/user.repository');
const orderService = require('../../services/order.service');
const foodRepository = require('../../repositories/food.repository');
const categoryRepository = require('../../repositories/category.repository');

describe('Review service', () => {
  it('creates review and updates restaurant rating', async () => {
    const customer = await userRepository.create({
      fullName: 'C',
      email: 'rev@test.com',
      password: 'password123',
      role: 'customer',
    });
    const owner = await userRepository.create({
      fullName: 'O',
      email: 'revo@test.com',
      password: 'password123',
      role: 'restaurant_owner',
    });
    const restaurant = await restaurantRepository.create({
      ownerId: owner._id,
      name: 'Rev Resto',
      status: 'approved',
    });
    const cat = await categoryRepository.create({ restaurantId: restaurant._id, name: 'M' });
    const food = await foodRepository.create({
      restaurantId: restaurant._id,
      categoryId: cat._id,
      name: 'Rice',
      price: 20000,
      stock: 5,
    });
    const order = await orderService.createOrder(customer._id, {
      restaurantId: restaurant._id,
      items: [{ foodId: food._id, quantity: 1 }],
      deliveryAddress: 'Addr',
    });
    for (const status of ['confirmed', 'preparing', 'ready', 'delivering', 'completed']) {
      await orderService.transitionStatus(order._id, status, owner);
    }
    const review = await reviewService.createReview(customer._id, {
      restaurantId: restaurant._id,
      orderId: order._id,
      rating: 5,
      comment: 'Great',
    });
    expect(review.rating).toBe(5);
    const updated = await restaurantRepository.findById(restaurant._id);
    expect(updated.averageRating).toBe(5);
  });
});
