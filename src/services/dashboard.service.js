const userRepository = require('../repositories/user.repository');
const restaurantRepository = require('../repositories/restaurant.repository');
const orderRepository = require('../repositories/order.repository');

const getAdminDashboard = async () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const [totalUsers, totalRestaurants, totalOrders, monthlyRevenue] = await Promise.all([
    userRepository.count(),
    restaurantRepository.count({ status: 'approved' }),
    orderRepository.count(),
    orderRepository.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: startOfMonth },
        },
      },
      { $group: { _id: null, revenue: { $sum: '$totalAmount' } } },
    ]),
  ]);

  const ordersByMonth = await orderRepository.aggregate([
    { $match: { createdAt: { $gte: twelveMonthsAgo } } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const revenueByMonth = await orderRepository.aggregate([
    { $match: { status: 'completed', createdAt: { $gte: twelveMonthsAgo } } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        revenue: { $sum: '$totalAmount' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const topFoods = await orderRepository.aggregate([
    { $match: { status: 'completed' } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.foodId',
        name: { $first: '$items.name' },
        totalSold: { $sum: '$items.quantity' },
      },
    },
    { $sort: { totalSold: -1 } },
    { $limit: 10 },
  ]);

  const topRestaurants = await orderRepository.aggregate([
    { $match: { status: 'completed' } },
    {
      $group: {
        _id: '$restaurantId',
        revenue: { $sum: '$totalAmount' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'restaurants',
        localField: '_id',
        foreignField: '_id',
        as: 'restaurant',
      },
    },
    { $unwind: '$restaurant' },
    {
      $project: {
        restaurantId: '$_id',
        name: '$restaurant.name',
        revenue: 1,
        orders: 1,
      },
    },
  ]);

  return {
    stats: {
      totalUsers,
      totalRestaurants,
      totalOrders,
      monthlyRevenue: monthlyRevenue[0]?.revenue || 0,
    },
    charts: {
      ordersByMonth,
      revenueByMonth,
      topFoods,
      topRestaurants,
    },
  };
};

module.exports = { getAdminDashboard };
