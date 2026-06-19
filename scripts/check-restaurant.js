const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://admin:admin123@cluster0.7fah3rr.mongodb.net/?appName=Cluster0';

async function main() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  const restaurant = await db.collection('restaurants').findOne({ _id: new mongoose.Types.ObjectId('6a2d512ec6f0888cdd825828') });
  console.log('Restaurant:', JSON.stringify(restaurant, null, 2));

  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
