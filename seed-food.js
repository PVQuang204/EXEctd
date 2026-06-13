const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mobile-restaurant';
  await mongoose.connect(uri);
  console.log('MongoDB connected');
};

const foodData = [
  // Thực đơn 1
  { name: 'Thực đơn 1', description: 'Set menu 1', price: 2600000, category: 'menu' },
  { name: 'Thực đơn 2', description: 'Set menu 2', price: 2600000, category: 'menu' },
  { name: 'Thực đơn 3', description: 'Set menu 3', price: 2600000, category: 'menu' },

  // Thực đơn 4,5,6
  { name: 'Thực đơn 4', description: 'Set menu 4', price: 2700000, category: 'menu' },
  { name: 'Thực đơn 5', description: 'Set menu 5', price: 2700000, category: 'menu' },
  { name: 'Thực đơn 6', description: 'Set menu 6', price: 2700000, category: 'menu' },

  // Bảng giá
  { name: 'Gà bọc xôi chiên giòn', description: 'Gà bọc xôi chiên giòn', price: 550000, category: 'chicken' },
  { name: 'Gỏi đồng giá', description: 'Gỏi đồng giá', price: 500000, category: 'salad' },
  { name: 'Tôm nướng muối ớt', description: 'Tôm', price: 600000, category: 'seafood' },
  { name: 'Cá chiên giòn', description: 'Cá', price: 650000, category: 'seafood' },
  { name: 'Mực chiên', description: 'Mực', price: 600000, category: 'seafood' },
  { name: 'Cua nấu', description: 'Cua', price: 650000, category: 'seafood' },
  { name: 'Gà hấp', description: 'Gà', price: 500000, category: 'chicken' },
  { name: 'Vịt nướng', description: 'Vịt', price: 550000, category: 'chicken' },
  { name: 'Bò nướng', description: 'Bò', price: 550000, category: 'beef' },
  { name: 'Thịt heo nấu', description: 'Heo', price: 500000, category: 'pork' },
  { name: 'Thịt dê', description: 'Dê', price: 600000, category: 'meat' },

  // Best Seller
  { name: 'Gà bọc xôi chiên giòn', description: 'Best Seller', price: 550000, category: 'chicken' },
  { name: 'Gỏi ngó sen', description: 'Best Seller', price: 500000, category: 'salad' },
  { name: 'Gỏi cổ hũ dừa', description: 'Best Seller', price: 500000, category: 'salad' },
  { name: 'Gỏi bò thấu', description: 'Best Seller', price: 500000, category: 'salad' },
  { name: 'Chả giò hải sản, sốt mayonaise', description: 'Best Seller', price: 500000, category: 'seafood' },
  { name: 'Bò nướng lá lốt', description: 'Best Seller', price: 500000, category: 'beef' },
  { name: 'Mực chiên giòn', description: 'Best Seller', price: 500000, category: 'seafood' },
  { name: 'Soup cua tóc tiên, bắp hột', description: 'Best Seller', price: 450000, category: 'soup' },
  { name: 'Sườn nấu đậu', description: 'Best Seller', price: 550000, category: 'pork' },
  { name: 'Bò lúc lắc khoai tây', description: 'Best Seller', price: 500000, category: 'beef' },
  { name: 'Bò ragout', description: 'Best Seller', price: 550000, category: 'beef' },
  { name: 'Miến xào cua', description: 'Best Seller', price: 500000, category: 'seafood' },
  { name: 'Cá chẽm sốt chua ngọt', description: 'Best Seller', price: 650000, category: 'seafood' },
  { name: 'Cá Tai Tượng chiên xù', description: 'Best Seller', price: 650000, category: 'seafood' },
  { name: 'Cá Bóng Mú chưng tương', description: 'Best Seller', price: 650000, category: 'seafood' },
  { name: 'Cá Tầm nướng muối ớt', description: 'Best Seller', price: 650000, category: 'seafood' },
  { name: 'Bò nấu pate', description: 'Best Seller', price: 550000, category: 'beef' },
  { name: 'Bò nấu tiêu xanh', description: 'Best Seller', price: 550000, category: 'beef' },
  { name: 'Tôm Hoàng Kim', description: 'Best Seller', price: 600000, category: 'seafood' },
  { name: 'Gà hấp muối', description: 'Best Seller', price: 500000, category: 'chicken' },
  { name: 'Gà hấp lá chanh', description: 'Best Seller', price: 500000, category: 'chicken' },
  { name: 'Tôm chấy tỏi', description: 'Best Seller', price: 600000, category: 'seafood' },
  { name: 'Cơm chiên dương châu', description: 'Best Seller', price: 500000, category: 'rice' },
  { name: 'Cơm chiên cá mặn', description: 'Best Seller', price: 500000, category: 'rice' },
  { name: 'Cơm chiên hải sản', description: 'Best Seller', price: 500000, category: 'rice' },
  { name: 'Lẩu cá chép giòn', description: 'Best Seller', price: 650000, category: 'hotpot' },
  { name: 'Lẩu cá chép nấu ngót', description: 'Best Seller', price: 650000, category: 'hotpot' },
  { name: 'Lẩu cá Chép nấu riêu', description: 'Best Seller', price: 650000, category: 'hotpot' },
  { name: 'Lẩu cua đồng', description: 'Best Seller', price: 650000, category: 'hotpot' },
  { name: 'Lẩu cá thác lác', description: 'Best Seller', price: 600000, category: 'hotpot' },
  { name: 'Lẩu Thái hải sản', description: 'Best Seller', price: 550000, category: 'hotpot' },
  { name: 'Lẩu gà tiềm hạt sen', description: 'Best Seller', price: 550000, category: 'hotpot' },
];

const CATEGORY_NAMES = ['menu', 'chicken', 'seafood', 'salad', 'beef', 'pork', 'meat', 'soup', 'rice', 'hotpot'];

const seedDatabase = async () => {
  try {
    await connectDB();

    const Food = require('./src/models/Food.model');
    const Category = require('./src/models/Category.model');
    const Restaurant = require('./src/models/Restaurant.model');

    // Tìm restaurant đầu tiên (approved) hoặc bất kỳ
    let restaurant = await Restaurant.findOne({ status: 'approved' });
    if (!restaurant) {
      restaurant = await Restaurant.findOne();
    }
    if (!restaurant) {
      console.error('❌ No restaurant found in database. Create a restaurant first (use seed-complete.js).');
      process.exit(1);
    }

    const restaurantId = restaurant._id;
    console.log(`📍 Using restaurant: "${restaurant.name}" (${restaurantId})`);

    // Tạo hoặc tìm categories
    const categoryMap = {};
    for (const catName of CATEGORY_NAMES) {
      let cat = await Category.findOne({ restaurantId, name: catName });
      if (!cat) {
        cat = await Category.create({ restaurantId, name: catName, isActive: true });
        console.log(`  ✅ Created category: ${catName}`);
      }
      categoryMap[catName] = cat._id;
    }

    // Xóa dữ liệu food cũ của restaurant (tuỳ chọn)
    // await Food.deleteMany({ restaurantId });

    // Insert dữ liệu mới với restaurantId và categoryId
    const foodsToInsert = foodData.map((item) => ({
      name: item.name,
      description: item.description,
      price: item.price,
      restaurantId,
      categoryId: categoryMap[item.category],
      stock: 100,
      isAvailable: true,
    }));

    await Food.insertMany(foodsToInsert);

    console.log(`✅ Inserted ${foodsToInsert.length} food items for restaurant "${restaurant.name}"`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
