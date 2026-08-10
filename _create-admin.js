// Create admin user in MongoDB (shared between local and server)
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const crypto = require('crypto');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const User = require('./src/models/User.model');

  // Check if admin already exists
  let admin = await User.findOne({ role: 'admin' });
  if (admin) {
    console.log('Admin already exists:', admin.email, '| role:', admin.role);
  } else {
    // Create admin
    admin = await User.create({
      fullName: 'Super Admin',
      email: 'admin@exectd.com',
      password: 'Admin123456',
      role: 'admin',
      status: 'active'
    });
    console.log('Admin created:', admin.email, '| role:', admin.role);
  }

  // Generate access token for this admin
  const { generateAccessToken } = require('./src/utils/token');
  const token = generateAccessToken(admin._id);
  console.log('\nAdmin ID:', admin._id.toString());
  console.log('Access Token:', token);
  console.log('\n--- COPY THIS TOKEN FOR TESTING ---');

  // Save to a temp file
  require('fs').writeFileSync('._admin_token.txt', JSON.stringify({
    token,
    adminId: admin._id.toString(),
    email: admin.email
  }));

  await mongoose.disconnect();
  console.log('Done!');
})().catch(e => console.error('Error:', e.message));
