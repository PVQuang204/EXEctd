// Script tạo index cho collections
// Run: node scripts/create-indexes.js

const mongoose = require('mongoose');

async function createIndexes() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  console.log('Tạo indexes...');

  // Foods collection
  await db.collection('foods').createIndex(
    { restaurantId: 1, isAvailable: 1, createdAt: -1 },
    { name: 'idx_foods_list' }
  );
  console.log('✓ Foods: idx_foods_list');

  // Orders collection - thêm index cho các query phổ biến
  await db.collection('orders').createIndex(
    { customerId: 1, createdAt: -1 },
    { name: 'idx_orders_customer' }
  );
  await db.collection('orders').createIndex(
    { 'restaurantId': 1, 'status': 1 },
    { name: 'idx_orders_restaurant_status' }
  );
  console.log('✓ Orders: idx_orders_customer, idx_orders_restaurant_status');

  // Payments collection
  await db.collection('payments').createIndex(
    { orderId: 1, paymentStatus: 1 },
    { name: 'idx_payments_order_status' }
  );
  console.log('✓ Payments: idx_payments_order_status');

  console.log('\n✅ Tất cả indexes đã được tạo!');
  await mongoose.disconnect();
}

createIndexes().catch(console.error);
