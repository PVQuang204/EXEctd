const fs = require('fs');
const path = 'db-templates/04-foods.json';
const arr = JSON.parse(fs.readFileSync(path, 'utf8'));
arr.forEach(f => {
  f.tags = ['best_seller'];
});
fs.writeFileSync(path, JSON.stringify(arr, null, 2));
console.log('Updated', arr.length, 'foods with tags: best_seller');
