const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mobile-restaurant';
  await mongoose.connect(uri);
  console.log('✅ MongoDB connected');
};

const seedDatabase = async () => {
  try {
    await connectDB();

    const User = require('./src/models/User.model');
    const Restaurant = require('./src/models/Restaurant.model');
    const Category = require('./src/models/Category.model');
    const Food = require('./src/models/Food.model');
    const Combo = require('./src/models/Combo.model');

    // Clear existing data
    await User.deleteMany({});
    await Restaurant.deleteMany({});
    await Category.deleteMany({});
    await Food.deleteMany({});
    await Combo.deleteMany({});

    console.log('🧹 Cleared existing data');

    // Create a sample user (restaurant owner)
    const owner = await User.create({
      fullName: 'Restaurant Owner',
      email: 'owner@example.com',
      password: 'password123',
      phone: '0123456789',
      role: 'restaurant_owner',
    });

    console.log('✅ Created owner user');

    // Create a restaurant
    const restaurant = await Restaurant.create({
      ownerId: owner._id,
      name: 'Nhà Hàng Test',
      description: 'Test Restaurant for Development',
      latitude: 10.7769,
      longitude: 106.7009,
      address: '123 Test Street, Ho Chi Minh City',
      phone: '0987654321',
      status: 'approved',
    });

    console.log('✅ Created restaurant');

    // Create categories
    const categoryNames = [
      'menu',
      'chicken',
      'seafood',
      'salad',
      'beef',
      'pork',
      'meat',
      'soup',
      'rice',
      'hotpot',
    ];

    const categories = await Category.insertMany(
      categoryNames.map((name) => ({
        restaurantId: restaurant._id,
        name: name,
      }))
    );

    console.log(`✅ Created ${categories.length} categories`);

    // Map category names to IDs
    const categoryMap = {};
    categories.forEach((cat) => {
      categoryMap[cat.name] = cat._id;
    });

    // Food items (basic dishes for combos)
    const foodData = [
      {
        name: 'Gà bọc xôi chiên giòn',
        description: 'Gà bọc xôi chiên giòn',
        price: 550000,
        category: 'chicken',
        image: 'https://via.placeholder.com/400x300?text=Gà+bọc+xôi',
      },
      {
        name: 'Gỏi ngó sen',
        description: 'Gỏi ngó sen',
        price: 500000,
        category: 'salad',
        image: 'https://via.placeholder.com/400x300?text=Gỏi+ngó+sen',
      },
      {
        name: 'Tôm nướng muối ớt',
        description: 'Tôm',
        price: 600000,
        category: 'seafood',
        image: 'https://via.placeholder.com/400x300?text=Tôm+nướng',
      },
      {
        name: 'Cá chiên giòn',
        description: 'Cá',
        price: 650000,
        category: 'seafood',
        image: 'https://via.placeholder.com/400x300?text=Cá+chiên',
      },
      {
        name: 'Mực chiên',
        description: 'Mực',
        price: 600000,
        category: 'seafood',
        image: 'https://via.placeholder.com/400x300?text=Mực+chiên',
      },
      {
        name: 'Cua nấu',
        description: 'Cua',
        price: 650000,
        category: 'seafood',
        image: 'https://via.placeholder.com/400x300?text=Cua+nấu',
      },
      {
        name: 'Gà hấp',
        description: 'Gà',
        price: 500000,
        category: 'chicken',
        image: 'https://via.placeholder.com/400x300?text=Gà+hấp',
      },
      {
        name: 'Vịt nướng',
        description: 'Vịt',
        price: 550000,
        category: 'chicken',
        image: 'https://via.placeholder.com/400x300?text=Vịt+nướng',
      },
      {
        name: 'Bò nướng',
        description: 'Bò',
        price: 550000,
        category: 'beef',
        image: 'https://via.placeholder.com/400x300?text=Bò+nướng',
      },
      {
        name: 'Thịt heo nấu',
        description: 'Heo',
        price: 500000,
        category: 'pork',
        image: 'https://via.placeholder.com/400x300?text=Heo+nấu',
      },
      {
        name: 'Thịt dê',
        description: 'Dê',
        price: 600000,
        category: 'meat',
        image: 'https://via.placeholder.com/400x300?text=Thịt+dê',
      },
      {
        name: 'Soup cua tóc tiên',
        description: 'Soup',
        price: 450000,
        category: 'soup',
        image: 'https://via.placeholder.com/400x300?text=Soup+cua',
      },
      {
        name: 'Cơm chiên dương châu',
        description: 'Cơm',
        price: 500000,
        category: 'rice',
        image: 'https://via.placeholder.com/400x300?text=Cơm+chiên',
      },
      {
        name: 'Cơm chiên hải sản',
        description: 'Cơm',
        price: 500000,
        category: 'rice',
        image: 'https://via.placeholder.com/400x300?text=Cơm+hải+sản',
      },
    ];

    // Transform foodData with actual IDs
    const foodsWithIds = foodData.map((food) => ({
      restaurantId: restaurant._id,
      categoryId: categoryMap[food.category],
      name: food.name,
      description: food.description,
      price: food.price,
      image: food.image,
      stock: 100,
      isAvailable: true,
    }));

    // Insert food items
    const foods = await Food.insertMany(foodsWithIds);

    console.log(`✅ Created ${foods.length} food items (as base ingredients)`);

    // CREATE COMBOS (Menu for restaurant - NO RETAIL SALES)
    const comboData = [
      {
        name: 'Thực đơn 1 - Combo Gà',
        description: 'Set menu 1 - Gà bọc xôi + Gà hấp + Gỏi ngó sen + Cơm',
        price: 2600000,
        image: 'https://via.placeholder.com/400x300?text=Menu+1+Gà',
        items: [
          { foodId: foods[0]._id, quantity: 1 }, // Gà bọc xôi
          { foodId: foods[6]._id, quantity: 1 }, // Gà hấp
          { foodId: foods[1]._id, quantity: 1 }, // Gỏi ngó sen
          { foodId: foods[12]._id, quantity: 1 }, // Cơm
        ],
      },
      {
        name: 'Thực đơn 2 - Combo Hải Sản',
        description: 'Set menu 2 - Tôm nướng + Cá chiên + Mực chiên + Cơm',
        price: 2600000,
        image: 'https://via.placeholder.com/400x300?text=Menu+2+Hải+Sản',
        items: [
          { foodId: foods[2]._id, quantity: 1 }, // Tôm
          { foodId: foods[3]._id, quantity: 1 }, // Cá
          { foodId: foods[4]._id, quantity: 1 }, // Mực
          { foodId: foods[12]._id, quantity: 1 }, // Cơm
        ],
      },
      {
        name: 'Thực đơn 3 - Combo Bò',
        description: 'Set menu 3 - Bò nướng + Cua nấu + Gỏi ngó sen + Cơm',
        price: 2600000,
        image: 'https://via.placeholder.com/400x300?text=Menu+3+Bò',
        items: [
          { foodId: foods[8]._id, quantity: 1 }, // Bò
          { foodId: foods[5]._id, quantity: 1 }, // Cua
          { foodId: foods[1]._id, quantity: 1 }, // Gỏi
          { foodId: foods[13]._id, quantity: 1 }, // Cơm
        ],
      },
      {
        name: 'Thực đơn 4 - Combo Lẩu Hải Sản',
        description: 'Set menu 4 - Lẩu hải sản với tôm, cua, mực + Cơm',
        price: 2700000,
        image: 'https://via.placeholder.com/400x300?text=Menu+4+Lẩu',
        items: [
          { foodId: foods[2]._id, quantity: 2 }, // Tôm x2
          { foodId: foods[5]._id, quantity: 1 }, // Cua
          { foodId: foods[4]._id, quantity: 1 }, // Mực
          { foodId: foods[13]._id, quantity: 1 }, // Cơm
        ],
      },
      {
        name: 'Thực đơn 5 - Combo Vịt',
        description: 'Set menu 5 - Vịt nướng + Thịt heo + Soup + Cơm',
        price: 2700000,
        image: 'https://via.placeholder.com/400x300?text=Menu+5+Vịt',
        items: [
          { foodId: foods[7]._id, quantity: 1 }, // Vịt
          { foodId: foods[9]._id, quantity: 1 }, // Heo
          { foodId: foods[11]._id, quantity: 1 }, // Soup
          { foodId: foods[12]._id, quantity: 1 }, // Cơm
        ],
      },
      {
        name: 'Thực đơn 6 - Combo Premium (Gia đình)',
        description: 'Set menu 6 - Gà + Heo + Bò + Hải sản + Soup + Cơm (4-5 người)',
        price: 2700000,
        image: 'https://via.placeholder.com/400x300?text=Menu+6+Premium',
        items: [
          { foodId: foods[0]._id, quantity: 1 }, // Gà bọc xôi
          { foodId: foods[9]._id, quantity: 1 }, // Heo
          { foodId: foods[8]._id, quantity: 1 }, // Bò
          { foodId: foods[3]._id, quantity: 1 }, // Cá
          { foodId: foods[11]._id, quantity: 1 }, // Soup
          { foodId: foods[13]._id, quantity: 2 }, // Cơm x2
        ],
      },
    ];

    // Transform combo data with actual IDs
    const combosWithIds = comboData.map((combo) => ({
      restaurantId: restaurant._id,
      name: combo.name,
      description: combo.description,
      price: combo.price,
      image: combo.image,
      items: combo.items,
      isActive: true,
    }));

    // Insert combos
    const combos = await Combo.insertMany(combosWithIds);

    console.log(`✅ Created ${combos.length} combos (menu packages)`);

    console.log('\n📊 Seeding Complete!');
    console.log(`   - Users: 1`);
    console.log(`   - Restaurants: 1`);
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Food Items: ${foods.length} (base ingredients)`);
    console.log(`   - Combos (Menu): ${combos.length} (for sale)`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
};

seedDatabase();
