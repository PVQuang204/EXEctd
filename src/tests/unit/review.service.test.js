const reviewService = require('../../services/review.service');
const orderRepository = require('../../repositories/order.repository');
const restaurantRepository = require('../../repositories/restaurant.repository');
const userRepository = require('../../repositories/user.repository');
const orderService = require('../../services/order.service');
const foodRepository = require('../../repositories/food.repository');
const categoryRepository = require('../../repositories/category.repository');

jest.mock('../../services/order.service', () => ({
  createOrder: jest.fn(),
  transitionStatus: jest.fn(),
}));

describe('Review service', () => {
  it('creates review and updates restaurant rating', async () => {
    const customer = await userRepository.create({
      fullName: 'C',
      email: 'rev2@test.com',
      password: 'password123',
      role: 'customer',
    });
    const owner = await userRepository.create({
      fullName: 'O',
      email: 'revo2@test.com',
      password: 'password123',
      role: 'restaurant_owner',
    });
    const restaurant = await restaurantRepository.create({
      ownerId: owner._id,
      name: 'Rev Resto',
      status: 'approved',
    });
    await categoryRepository.create({ restaurantId: restaurant._id, name: 'M' });
    await foodRepository.create({
      restaurantId: restaurant._id,
      categoryId: restaurant._id,
      name: 'Rice',
      price: 20000,
      stock: 5,
    });
    const orderId = '507f1f77bcf86cd799439011';
    orderService.createOrder.mockResolvedValue({ _id: orderId });
    orderService.transitionStatus.mockResolvedValue({});
    jest.spyOn(orderRepository, 'findById').mockResolvedValue({
      _id: orderId,
      customerId: customer._id,
      restaurantId: restaurant._id,
      status: 'completed',
      items: [],
    });
    const review = await reviewService.createReview(customer._id, {
      restaurantId: restaurant._id,
      orderId,
      rating: 5,
      comment: 'Great',
    });
    expect(review.rating).toBe(5);
    const updated = await restaurantRepository.findById(restaurant._id);
    expect(updated.averageRating).toBe(5);
  });
});
