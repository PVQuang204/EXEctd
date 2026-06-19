const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://admin:admin123@cluster0.7fah3rr.mongodb.net/?appName=Cluster0';

async function main() {
  await mongoose.connect(MONGO_URI);

  const db = mongoose.connection.db;

  // 1. Tìm user quang1
  const user = await db.collection('users').findOne({ email: 'quang1@gmail.com' });
  if (!user) {
    console.log('Khong tim thay user: quang1@gmail.com');
    process.exit(1);
  }
  console.log('User:', user._id, user.email, user.role);

  // 2. Tìm restaurant
  const restaurants = await db.collection('restaurants').find({}).toArray();
  if (restaurants.length === 0) {
    console.log('Khong co restaurant nao.');
    process.exit(1);
  }
  console.log('\nRestaurant(s):');
  restaurants.forEach(r => console.log(' ', r._id, r.name, 'ownerId:', r.ownerId));

  // 3. Link user vao restaurant(s)
  const ownerId = user._id;
  const result = await db.collection('restaurants').updateMany(
    {},
    { $set: { ownerId } }
  );
  console.log(`\nDa link ${result.modifiedCount} restaurant(s) voi user ${ownerId}`);

  // Verify
  const updated = await db.collection('restaurants').find({}).toArray();
  console.log('\nSau khi link:');
  updated.forEach(r => console.log(' ', r._id, r.name, 'ownerId:', r.ownerId));

  await mongoose.disconnect();
  console.log('\nDone!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
