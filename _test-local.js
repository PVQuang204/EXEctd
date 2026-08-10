// Test admin APIs against LOCAL code
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');

(async () => {
  try {
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'UNDEFINED');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const restaurantService = require('./src/services/restaurant.service');
    const orderService = require('./src/services/order.service');
    const reviewService = require('./src/services/review.service');

    // 1. Admin list restaurants
    console.log('\n=== 1. ADMIN LIST RESTAURANTS ===');
    const restaurants = await restaurantService.getAllRestaurants({ page: 1, limit: 5 });
    console.log('  Success: true | Total:', restaurants.pagination.total);

    // 2. Admin list orders
    console.log('\n=== 2. ADMIN LIST ORDERS ===');
    const orders = await orderService.getAllOrders({ page: 1, limit: 5 });
    console.log('  Success: true | Total:', orders.pagination.total);

    // 3. Admin list reviews
    console.log('\n=== 3. ADMIN LIST REVIEWS ===');
    const reviews = await reviewService.listAllReviews({ page: 1, limit: 5 });
    console.log('  Success: true | Total:', reviews.pagination.total);

    // 4. Revenue by restaurant
    console.log('\n=== 4. REVENUE BY RESTAURANT ===');
    const revenue = await orderService.getRevenueByRestaurant({});
    console.log('  Success: true | Count:', revenue.length);

    // 5. Total revenue
    console.log('\n=== 5. TOTAL REVENUE STATS ===');
    const totalRev = await orderService.getRevenueStats(null, null, null);
    console.log('  totalRevenue:', totalRev.totalRevenue, '| orderCount:', totalRev.orderCount);

    await mongoose.disconnect();
    console.log('\nAll local tests passed!');
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
