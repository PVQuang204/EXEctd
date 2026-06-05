const { syncFoodRatingsFromReview } = require('../../services/foodRating.service');
const foodRepository = require('../../repositories/food.repository');
const userRepository = require('../../repositories/user.repository');
const restaurantRepository = require('../../repositories/restaurant.repository');
const categoryRepository = require('../../repositories/category.repository');

describe('Food rating service', () => {
  it('updates ratingAverage and ratingCount', async () => {
    const owner = await userRepository.create({
      fullName: 'O',
      email: `fr_${Date.now()}@test.com`,
      password: 'password123',
      role: 'restaurant_owner',
    });
    const restaurant = await restaurantRepository.create({
      ownerId: owner._id,
      name: 'R',
      status: 'approved',
    });
    const cat = await categoryRepository.create({ restaurantId: restaurant._id, name: 'C' });
    const food = await foodRepository.create({
      restaurantId: restaurant._id,
      categoryId: cat._id,
      name: 'Item',
      price: 10000,
      stock: 5,
    });

    await syncFoodRatingsFromReview({ foodId: food._id, rating: 4 });
    const updated = await foodRepository.findById(food._id);
    expect(updated.ratingAverage).toBe(4);
    expect(updated.ratingCount).toBe(1);

    await syncFoodRatingsFromReview({ foodId: food._id, rating: 5 });
    const again = await foodRepository.findById(food._id);
    expect(again.ratingCount).toBe(2);
    expect(again.ratingAverage).toBe(4.5);
  });
});
