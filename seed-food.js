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
  { name: 'Thực đơn 1', description: 'Set menu 1', price: 2600000, category: 'menu', restaurant: null },
  { name: 'Thực đơn 2', description: 'Set menu 2', price: 2600000, category: 'menu', restaurant: null },
  { name: 'Thực đơn 3', description: 'Set menu 3', price: 2600000, category: 'menu', restaurant: null },

  // Thực đơn 4,5,6
  { name: 'Thực đơn 4', description: 'Set menu 4', price: 2700000, category: 'menu', restaurant: null },
  { name: 'Thực đơn 5', description: 'Set menu 5', price: 2700000, category: 'menu', restaurant: null },
  { name: 'Thực đơn 6', description: 'Set menu 6', price: 2700000, category: 'menu', restaurant: null },

  // Bảng giá
  { name: 'Gà bọc xôi chiên giòn', description: 'Gà bọc xôi chiên giòn', price: 550000, category: 'chicken', restaurant: null },
  { name: 'Gỏi đồng giá', description: 'Gỏi đồng giá', price: 500000, category: 'salad', restaurant: null },
  { name: 'Tôm nướng muối ớt', description: 'Tôm', price: 600000, category: 'seafood', restaurant: null },
  { name: 'Cá chiên giòn', description: 'Cá', price: 650000, category: 'seafood', restaurant: null },
  { name: 'Mực chiên', description: 'Mực', price: 600000, category: 'seafood', restaurant: null },
  { name: 'Cua nấu', description: 'Cua', price: 650000, category: 'seafood', restaurant: null },
  { name: 'Gà hấp', description: 'Gà', price: 500000, category: 'chicken', restaurant: null },
  { name: 'Vịt nướng', description: 'Vịt', price: 550000, category: 'chicken', restaurant: null },
  { name: 'Bò nướng', description: 'Bò', price: 550000, category: 'beef', restaurant: null },
  { name: 'Thịt heo nấu', description: 'Heo', price: 500000, category: 'pork', restaurant: null },
  { name: 'Thịt dê', description: 'Dê', price: 600000, category: 'meat', restaurant: null },

  // Best Seller
  { name: 'Gà bọc xôi chiên giòn', description: 'Best Seller', price: 550000, category: 'chicken', restaurant: null },
  { name: 'Gỏi ngó sen', description: 'Best Seller', price: 500000, category: 'salad', restaurant: null },
  { name: 'Gỏi cổ hũ dừa', description: 'Best Seller', price: 500000, category: 'salad', restaurant: null },
  { name: 'Gỏi bò thấu', description: 'Best Seller', price: 500000, category: 'salad', restaurant: null },
  { name: 'Chả giò hải sản, sốt mayonaise', description: 'Best Seller', price: 500000, category: 'seafood', restaurant: null },
  { name: 'Bò nướng lá lốt', description: 'Best Seller', price: 500000, category: 'beef', restaurant: null },
  { name: 'Mực chiên giòn', description: 'Best Seller', price: 500000, category: 'seafood', restaurant: null },
  { name: 'Soup cua tóc tiên, bắp hột', description: 'Best Seller', price: 450000, category: 'soup', restaurant: null },
  { name: 'Sườn nấu đậu', description: 'Best Seller', price: 550000, category: 'pork', restaurant: null },
  { name: 'Bò lúc lắc khoai tây', description: 'Best Seller', price: 500000, category: 'beef', restaurant: null },
  { name: 'Bò ragout', description: 'Best Seller', price: 550000, category: 'beef', restaurant: null },
  { name: 'Miến xào cua', description: 'Best Seller', price: 500000, category: 'seafood', restaurant: null },
  { name: 'Cá chẽm sốt chua ngọt', description: 'Best Seller', price: 650000, category: 'seafood', restaurant: null },
  { name: 'Cá Tai Tượng chiên xù', description: 'Best Seller', price: 650000, category: 'seafood', restaurant: null },
  { name: 'Cá Bóng Mú chưng tương', description: 'Best Seller', price: 650000, category: 'seafood', restaurant: null },
  { name: 'Cá Tầm nướng muối ớt', description: 'Best Seller', price: 650000, category: 'seafood', restaurant: null },
  { name: 'Bò nấu pate', description: 'Best Seller', price: 550000, category: 'beef', restaurant: null },
  { name: 'Bò nấu tiêu xanh', description: 'Best Seller', price: 550000, category: 'beef', restaurant: null },
  { name: 'Tôm Hoàng Kim', description: 'Best Seller', price: 600000, category: 'seafood', restaurant: null },
  { name: 'Gà hấp muối', description: 'Best Seller', price: 500000, category: 'chicken', restaurant: null },
  { name: 'Gà hấp lá chanh', description: 'Best Seller', price: 500000, category: 'chicken', restaurant: null },
  { name: 'Tôm chấy tỏi', description: 'Best Seller', price: 600000, category: 'seafood', restaurant: null },
  { name: 'Cơm chiên dương châu', description: 'Best Seller', price: 500000, category: 'rice', restaurant: null },
  { name: 'Cơm chiên cá mặn', description: 'Best Seller', price: 500000, category: 'rice', restaurant: null },
  { name: 'Cơm chiên hải sản', description: 'Best Seller', price: 500000, category: 'rice', restaurant: null },
  { name: 'Lẩu cá chép giòn', description: 'Best Seller', price: 650000, category: 'hotpot', restaurant: null },
  { name: 'Lẩu cá chép nấu ngót', description: 'Best Seller', price: 650000, category: 'hotpot', restaurant: null },
  { name: 'Lẩu cá Chép nấu riêu', description: 'Best Seller', price: 650000, category: 'hotpot', restaurant: null },
  { name: 'Lẩu cua đồng', description: 'Best Seller', price: 650000, category: 'hotpot', restaurant: null },
  { name: 'Lẩu cá thác lác', description: 'Best Seller', price: 600000, category: 'hotpot', restaurant: null },
  { name: 'Lẩu Thái hải sản', description: 'Best Seller', price: 550000, category: 'hotpot', restaurant: null },
  { name: 'Lẩu gà tiềm hạt sen', description: 'Best Seller', price: 550000, category: 'hotpot', restaurant: null },
];

const seedDatabase = async () => {
  try {
    await connectDB();
    
    const Food = require('./src/models/Food.model');
    
    // Xóa dữ liệu cũ (tuỳ chọn)
    // await Food.deleteMany({});
    
    // Insert dữ liệu mới
    await Food.insertMany(foodData);
    
    console.log(`✅ Inserted ${foodData.length} food items successfully`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
