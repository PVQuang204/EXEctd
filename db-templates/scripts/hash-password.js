// Helper: tạo password hash bcrypt để paste vào template users.json
// Chạy: node db-templates/scripts/hash-password.js <password>
const bcrypt = require('bcryptjs');

const input = process.argv[2] || '123456';
bcrypt.hash(input, 12).then((hash) => {
  console.log(`\nPlain:  ${input}`);
  console.log(`Hash:   ${hash}\n`);
  console.log('Paste vào field "password" trong file 01-users.json:');
  console.log(`"password": "${hash}",\n`);
  process.exit(0);
});
