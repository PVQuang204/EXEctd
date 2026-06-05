const menuService = require('../../services/menu.service');
const restaurantRepository = require('../../repositories/restaurant.repository');
const userRepository = require('../../repositories/user.repository');

describe('Menu service', () => {
  let owner;
  let restaurant;

  beforeEach(async () => {
    owner = await userRepository.create({
      fullName: 'Owner',
      email: 'menu@test.com',
      password: 'password123',
      role: 'restaurant_owner',
    });
    restaurant = await restaurantRepository.create({
      ownerId: owner._id,
      name: 'Menu Resto',
      status: 'approved',
    });
  });

  it('creates category and food', async () => {
    const cat = await menuService.createCategory(owner._id, restaurant._id, { name: 'Drinks' });
    const food = await menuService.createFood(owner._id, {
      restaurantId: restaurant._id,
      categoryId: cat._id,
      name: 'Tea',
      price: 15000,
      stock: 10,
    });
    expect(food.name).toBe('Tea');
    const list = await menuService.listFoods(restaurant._id);
    expect(list.length).toBe(1);
  });

  it('creates promotion', async () => {
    const promo = await menuService.createPromotion(owner._id, {
      restaurantId: restaurant._id,
      title: 'Sale',
      discountType: 'percent',
      discountValue: 10,
      startDate: new Date(Date.now() - 86400000),
      endDate: new Date(Date.now() + 86400000),
      code: 'SALE10',
    });
    expect(promo.code).toBe('SALE10');
  });
});
