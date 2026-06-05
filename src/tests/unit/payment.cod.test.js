const paymentService = require('../../services/payment.service');
const orderService = require('../../services/order.service');
const userRepository = require('../../repositories/user.repository');
const restaurantRepository = require('../../repositories/restaurant.repository');
const foodRepository = require('../../repositories/food.repository');
const categoryRepository = require('../../repositories/category.repository');

describe('Payment COD', () => {
  it('creates COD payment', async () => {
    const customer = await userRepository.create({
      fullName: 'C',
      email: 'pay@test.com',
      password: 'password123',
      role: 'customer',
    });
    const owner = await userRepository.create({
      fullName: 'O',
      email: 'payo@test.com',
      password: 'password123',
      role: 'restaurant_owner',
    });
    const restaurant = await restaurantRepository.create({
      ownerId: owner._id,
      name: 'Pay Resto',
      status: 'approved',
    });
    const cat = await categoryRepository.create({ restaurantId: restaurant._id, name: 'M' });
    const food = await foodRepository.create({
      restaurantId: restaurant._id,
      categoryId: cat._id,
      name: 'Soup',
      price: 40000,
      stock: 10,
    });
    const order = await orderService.createOrder(customer._id, {
      restaurantId: restaurant._id,
      items: [{ foodId: food._id, quantity: 1 }],
      deliveryAddress: 'Here',
    });
    const result = await paymentService.createPayment(order._id, customer._id, {
      paymentMethod: 'cod',
    });
    expect(result.payment.paymentMethod).toBe('cod');
    const confirmed = await paymentService.confirmCOD(order._id, owner._id);
    expect(confirmed.paymentStatus).toBe('paid');
  });
});
