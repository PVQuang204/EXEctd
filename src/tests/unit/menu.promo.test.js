const menuService = require('../../services/menu.service');
const userRepository = require('../../repositories/user.repository');
const restaurantRepository = require('../../repositories/restaurant.repository');

describe('Menu promotion', () => {
  it('applies percent discount', async () => {
    const owner = await userRepository.create({
      fullName: 'O',
      email: 'promo@test.com',
      password: 'password123',
      role: 'restaurant_owner',
    });
    const restaurant = await restaurantRepository.create({
      ownerId: owner._id,
      name: 'Promo',
      status: 'approved',
    });
    await menuService.createPromotion(owner._id, {
      restaurantId: restaurant._id,
      title: 'Off',
      discountType: 'percent',
      discountValue: 20,
      minOrderAmount: 0,
      startDate: new Date(Date.now() - 1000),
      endDate: new Date(Date.now() + 86400000),
      code: 'OFF20',
    });
    const result = await menuService.applyPromotion(restaurant._id, 'OFF20', 100000);
    expect(result.discountAmount).toBe(20000);
  });
});
