const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mobile-restaurant';
  await mongoose.connect(uri);
  console.log(`✅ MongoDB connected: ${uri.replace(/\/\/[^:]+:[^@]+@/, '//<credentials>@')}`);
};

// ===================== DATA =====================

const CATEGORY_DATA = {
  'Quán Ốc Ngon': [
    'Ốc', 'Ốc đặc biệt', 'Hải sản', 'Món thêm', 'Nước giải khát',
  ],
  'Bếp Việt Restaurant': [
    'Món gà', 'Món bò', 'Món hải sản', 'Món lẩu', 'Món xào', 'Cơm', 'Món thêm', 'Tráng miệng',
  ],
  'Lẩu & Nướng Phố': [
    'Lẩu', 'Nướng', 'Đồ nhắm', 'Món thêm', 'Nước uống',
  ],
  'Cơm Niêu House': [
    'Cơm niêu', 'Món nước', 'Món chiên', 'Món hấp', 'Món thêm', 'Tráng miệng',
  ],
  'FoodCourt 54': [
    'Burger', 'Pizza', 'Mì Ý', 'Nước uống', 'Món thêm',
  ],
};

const FOOD_DATA = {
  'Quán Ốc Ngon': {
    'Ốc': [
      { name: 'Ốc mỡ hấp sả', price: 45000, desc: 'Ốc mỡ tươi hấp cùng sả thơm lừng, ăn kèm nước mắm gừng' },
      { name: 'Ốc len xào dừa', price: 50000, desc: 'Ốc len tươi xào với nước cốt dừa, rau mồng tơi' },
      { name: 'Ốc bươu hấp thái', price: 55000, desc: 'Ốc bươu hấp kiểu Thái chua cay đậm đà' },
      { name: 'Ốc cà na', price: 35000, desc: 'Ốc cà na rang muối ớt giòn tan' },
      { name: 'Ốc tỏi', price: 60000, desc: 'Ốc hấp tỏi thơm phức, béo ngậy' },
      { name: 'Ốc mỡ nướng', price: 50000, desc: 'Ốc mỡ nướng than hồng, giòn ngọt' },
      { name: 'Ốc bông hấp gừng', price: 48000, desc: 'Ốc bông tươi hấp gừng sả thơm lừng' },
      { name: 'Ốc điếm', price: 40000, desc: 'Ốc điếm xào me phong cách miền Nam' },
    ],
    'Ốc đặc biệt': [
      { name: 'Combo Ốc đặc biệt (4 người)', price: 280000, desc: 'Bao gồm: Ốc mỡ, ốc len, ốc tỏi, ốc bươu - đủ cho 4 người ăn' },
      { name: 'Tách ốc mỡ nướng phô mai', price: 70000, desc: 'Ốc mỡ nướng phủ phô mai mozzarella béo ngậy' },
      { name: 'Ốc các loại mix nướng', price: 180000, desc: 'Đĩa ốc nướng đa dạng: mỡ, bươu, cà na (phục vụ 3-4 người)' },
    ],
    'Hải sản': [
      { name: 'Tôm sú nướng muối ớt', price: 180000, desc: 'Tôm sú to nướng muối ớt thơm nức mũi' },
      { name: 'Cá lóc nướng', price: 150000, desc: 'Cá lóc nướng trui da vàng giòn' },
      { name: 'Mực một nắng nướng', price: 160000, desc: 'Mực một nắng nướng than hoa giòn dai' },
      { name: 'Sò điệp nướng mỡ hành', price: 90000, desc: 'Sò điệp nướng phủ mỡ hành thơm phức' },
      { name: 'Nghêu hấp sả', price: 60000, desc: 'Nghêu tươi hấp sả, ăn với nước mắm chua ngọt' },
    ],
    'Món thêm': [
      { name: 'Khoai tây chiên', price: 30000, desc: 'Khoai tây chiên giòn vàng, giòn rụm' },
      { name: 'Trứng cút lòng đào', price: 25000, desc: 'Trứng cút rang me chua ngọt' },
      { name: 'Rau muống xào tỏi', price: 30000, desc: 'Rau muống xào tỏi giòn ngon' },
      { name: 'Đậu hũ chiên giòn', price: 25000, desc: 'Đậu hũ chiên vàng giòn, ăn kèm nước tương' },
      { name: 'Chả giò', price: 35000, desc: 'Chả giò giòn rụm nhân thịt và rau củ' },
    ],
    'Nước giải khát': [
      { name: 'Sữa đậu nành', price: 15000, desc: 'Sữa đậu nành nóng/lạnh nguyên chất' },
      { name: 'Nước cam', price: 20000, desc: 'Nước cam vắt tươi mát' },
      { name: 'Trà đá', price: 8000, desc: 'Trà đá mát lạnh' },
      { name: 'Xí muội', price: 12000, desc: 'Nước xí muội mát lạnh giải khát' },
      { name: ' Bia tiger (lon)', price: 18000, desc: 'Tiger lon lạnh ngụm đậm đà' },
    ],
  },
  'Bếp Việt Restaurant': {
    'Món gà': [
      { name: 'Gà bọc xôi chiên giòn', price: 550000, desc: 'Gà bọc xôi chiên vàng giòn, thịt mềm ngọt' },
      { name: 'Gà hấp muối', price: 500000, desc: 'Gà hấp muối thơm lừng, da giòn mềm' },
      { name: 'Gà hấp lá chanh', price: 500000, desc: 'Gà hấp cùng lá chanh thơm ngát' },
      { name: 'Vịt nướng', price: 550000, desc: 'Vịt nướng than hoa da giòn thơm' },
      { name: 'Gà ta chiên mắm', price: 520000, desc: 'Gà ta chiên giòn rồi rim mắm đường đậm đà' },
      { name: 'Gà tiềm hạt sen', price: 580000, desc: 'Gà tiềm hạt sen bùi bùi, nước dùng ngọt thanh' },
    ],
    'Món bò': [
      { name: 'Bò nướng lá lốt', price: 500000, desc: 'Thịt bò bọc lá lốt nướng than hoa thơm nức' },
      { name: 'Bò lúc lắc khoai tây', price: 500000, desc: 'Bò lúc lắc chiên giòn khoai tây' },
      { name: 'Bò ragout', price: 550000, desc: 'Bò hầm ragout kiểu Pháp đậm đà' },
      { name: 'Bò nấu pate', price: 550000, desc: 'Bò nấu pate mềm tan trong miệng' },
      { name: 'Bò nấu tiêu xanh', price: 550000, desc: 'Bò hầm tiêu xanh thơm cay ấm bụng' },
      { name: 'Bò nướng mỡ hành', price: 520000, desc: 'Bò nướng phủ mỡ hành béo ngậy' },
    ],
    'Món hải sản': [
      { name: 'Tôm nướng muối ớt', price: 600000, desc: 'Tôm sú nướng muối ớt đỏ au thơm lừng' },
      { name: 'Cá chẽm sốt chua ngọt', price: 650000, desc: 'Cá chẽm chiên giòn sốt chua ngọt đậm vị' },
      { name: 'Cá tai tượng chiên xù', price: 650000, desc: 'Cá tai tượng chiên xù giòn rụm' },
      { name: 'Cá bóng mú chưng tương', price: 650000, desc: 'Cá bóng mú chưng tương hấp dẫn' },
      { name: 'Cá tầm nướng muối ớt', price: 650000, desc: 'Cá tầm nướng muối ớt thơm nức mũi' },
      { name: 'Mực chiên giòn', price: 500000, desc: 'Mực one nắng chiên giòn tan' },
      { name: 'Miến xào cua', price: 500000, desc: 'Miến xào cùng thịt cua tươi ngon' },
      { name: 'Chả giò hải sản', price: 500000, desc: 'Chả giò nhân hải sản sốt mayonnaise' },
      { name: 'Tôm hoàng kim', price: 600000, desc: 'Tôm hoàng kim chiên giòn phủ phô mai' },
      { name: 'Tôm chấy tỏi', price: 600000, desc: 'Tôm chiên giòn xào tỏi thơm lừng' },
    ],
    'Món lẩu': [
      { name: 'Lẩu cá chép giòn', price: 650000, desc: 'Lẩu cá chép giòn đặc sản miền Bắc' },
      { name: 'Lẩu cá chép nấu ngót', price: 650000, desc: 'Lẩu cá chép nấu ngót chua nhẹ' },
      { name: 'Lẩu cá chép nấu riêu', price: 650000, desc: 'Lẩu cá chép nấu riêu thơm ngon' },
      { name: 'Lẩu cua đồng', price: 650000, desc: 'Lẩu cua đồng rau muống thanh mát' },
      { name: 'Lẩu cá thác lác', price: 600000, desc: 'Lẩu cá thác lác nấu bún ăn nóng hổi' },
      { name: 'Lẩu thái hải sản', price: 550000, desc: 'Lẩu Thái chua cay đậm vị' },
      { name: 'Lẩu gà tiềm hạt sen', price: 550000, desc: 'Lẩu gà tiềm hạt sen bùi ngọt' },
    ],
    'Món xào': [
      { name: 'Sườn nấu đậu', price: 550000, desc: 'Sườn heo hầm đậu phụ mềm tan' },
      { name: 'Rau muống xào tỏi', price: 50000, desc: 'Rau muống xào tỏi giòn ngon' },
      { name: 'Đậu hũ non sốt cà', price: 80000, desc: 'Đậu hũ non chiên sốt cà chua' },
    ],
    'Cơm': [
      { name: 'Cơm chiên dương châu', price: 500000, desc: 'Cơm chiên dương châu thơm ngon' },
      { name: 'Cơm chiên cá mặn', price: 500000, desc: 'Cơm chiên với cá mặn thơm lừng' },
      { name: 'Cơm chiên hải sản', price: 500000, desc: 'Cơm chiên hải sản đầy đặn' },
    ],
    'Món thêm': [
      { name: 'Gỏi ngó sen', price: 500000, desc: 'Gỏi ngó sen giòn ngọt thanh mát' },
      { name: 'Gỏi cổ hũ dừa', price: 500000, desc: 'Gỏi cổ hũ dừa giòn chua ngọt' },
      { name: 'Gỏi bò thấu', price: 500000, desc: 'Gỏi bò thấu cay thơm đặc trưng' },
      { name: 'Soup cua tóc tiên', price: 450000, desc: 'Soup cua tóc tiên bắp hột thơm ngon' },
      { name: 'Chả giò', price: 80000, desc: 'Chả giò chiên giòn vàng' },
    ],
    'Tráng miệng': [
      { name: 'Chè ba màu', price: 30000, desc: 'Chè ba màu mát lạnh' },
      { name: 'Trái cây dầm', price: 40000, desc: 'Trái cây dầm sữa đặc' },
      { name: 'Bánh flan', price: 25000, desc: 'Bánh flan caramel mịn màng' },
    ],
  },
  'Lẩu & Nướng Phố': {
    'Lẩu': [
      { name: 'Lẩu bò nhúng dấm', price: 350000, desc: 'Bò nhúng dấm chua cay đậm đà' },
      { name: 'Lẩu hải sản Thái', price: 400000, desc: 'Lẩu hải sản kiểu Thái chua cay' },
      { name: 'Lẩu gà lá giang', price: 320000, desc: 'Lẩu gà nấu lá giang chua ngọt' },
      { name: 'Lẩu mắm', price: 380000, desc: 'Lẩu mắm thơm nồng đậm vị miền Tây' },
      { name: 'Lẩu cá kèo', price: 350000, desc: 'Lẩu cá kèo măng chua ăn cực đã' },
      { name: 'Lẩu riêu cua', price: 300000, desc: 'Lẩu riêu cua đồng thơm ngon' },
      { name: 'Lẩu nấm', price: 280000, desc: 'Lẩu nấm rau củ thanh đạm' },
    ],
    'Nướng': [
      { name: 'Ba chỉ bò nướng', price: 180000, desc: 'Ba chỉ bò Mỹ nướng than hoa' },
      { name: 'Bạc tình bò', price: 200000, desc: 'Bạc tình bò Úc mềm ngọt' },
      { name: 'Bò wagyū nướng', price: 350000, desc: 'Bò wagyū Nhật nướng phô mai' },
      { name: 'Tôm nướng', price: 150000, desc: 'Tôm sú nướng muối ớt' },
      { name: 'Mực nướng', price: 120000, desc: 'Mực one nắng nướng giòn' },
      { name: 'Cá viên chiên', price: 60000, desc: 'Cá viên chiên giòn vàng' },
      { name: 'Đùi gà nướng', price: 100000, desc: 'Đùi gà nướng than hoa' },
      { name: 'Bao tử nướng', price: 90000, desc: 'Bao tử bò nướng giòn' },
    ],
    'Đồ nhắm': [
      { name: 'Chả ram', price: 50000, desc: 'Chả ram giòn tan' },
      { name: 'Đậu phộng rang', price: 20000, desc: 'Đậu phộng rang muối giòn bùi' },
      { name: 'Khoai tây lắc', price: 30000, desc: 'Khoai tây lắc phô mai' },
      { name: 'Khô gà lá chanh', price: 60000, desc: 'Khô gà xé sợi lá chanh thơm' },
      { name: 'Bò khô', price: 80000, desc: 'Bò khô cay giòn dai' },
    ],
    'Món thêm': [
      { name: 'Mì gói', price: 10000, desc: 'Mì gói nấu ăn kèm lẩu' },
      { name: 'Bún tươi', price: 15000, desc: 'Bún tươi ăn với nước lẩu' },
      { name: 'Rau nhúng lẩu', price: 50000, desc: 'Đĩa rau tươi nhúng lẩu đa dạng' },
      { name: 'Nấm các loại', price: 60000, desc: 'Nấm đùi gà, nấm kim châm, nấm bào ngư' },
    ],
    'Nước uống': [
      { name: 'Trà đá', price: 8000, desc: 'Trà đá mát lạnh' },
      { name: 'Sữa đậu nành', price: 15000, desc: 'Sữa đậu nành nóng hoặc lạnh' },
      { name: 'Nước suối', price: 10000, desc: 'Nước suối lavie 500ml' },
      { name: 'Nước ép dưa hấu', price: 25000, desc: 'Nước ép dưa hấu tươi mát' },
      { name: 'Bia hơi', price: 15000, desc: 'Bia hơi Sài Gòn mát lạnh' },
      { name: 'Rượu vang đỏ', price: 80000, desc: 'Ly rượu vang đỏ Chile' },
    ],
  },
  'Cơm Niêu House': {
    'Cơm niêu': [
      { name: 'Cơm niêu gà xối mỡ', price: 85000, desc: 'Cơm niêu gà xối mỡ giòn rụm' },
      { name: 'Cơm niêu ba rọi chiên', price: 80000, desc: 'Cơm niêu ba rọi chiên giòn' },
      { name: 'Cơm niêu đùi gà chiên', price: 90000, desc: 'Cơm niêu đùi gà chiên vàng' },
      { name: 'Cơm niêu cá basa kho', price: 78000, desc: 'Cơm niêu cá basa kho tộ' },
      { name: 'Cơm niêu thịt kho trứng', price: 75000, desc: 'Cơm niêu thịt kho trứng đậm đà' },
      { name: 'Cơm niêu gà teriyaki', price: 95000, desc: 'Cơ niêu gà teriyaki Nhật Bản' },
      { name: 'Cơm niêu sườn nướng', price: 88000, desc: 'Cơm niêu sườn nướng BBQ' },
      { name: 'Cơm niêu đặc biệt', price: 120000, desc: 'Cơm niêu đặc biệt nhiều topping' },
    ],
    'Món nước': [
      { name: 'Canh chua cá lóc', price: 60000, desc: 'Canh chua cá lóc chua ngọt' },
      { name: 'Canh khổ qua nhồi', price: 55000, desc: 'Canh khổ qua nhồi thịt băm' },
      { name: 'Canh bạc hà', price: 50000, desc: 'Canh bạc hà mát lành' },
      { name: 'Súp cua', price: 45000, desc: 'Súp cua bắp hột béo ngậy' },
    ],
    'Món chiên': [
      { name: 'Đùi gà chiên giòn', price: 70000, desc: 'Đùi gà chiên giòn vàng rụm' },
      { name: 'Cánh gà chiên', price: 60000, desc: 'Cánh gà chiên nước mắm' },
      { name: 'Tôm chiên giòn', price: 80000, desc: 'Tôm chiên bột giòn tan' },
      { name: 'Cá chiên giòn', price: 75000, desc: 'Cá chiên giòn da vàng' },
    ],
    'Món hấp': [
      { name: 'Cá hấp gừng', price: 80000, desc: 'Cá hấp gừng thơm lừng' },
      { name: 'Gà hấp muối', price: 85000, desc: 'Gà hấp muối da giòn' },
      { name: 'Tôm hấp bia', price: 90000, desc: 'Tôm hấp bia thơm ngọt' },
    ],
    'Món thêm': [
      { name: 'Rau muống xào tỏi', price: 35000, desc: 'Rau muống xào tỏi giòn ngon' },
      { name: 'Đậu hũ chiên sốt cà', price: 30000, desc: 'Đậu hũ chiên sốt cà chua' },
      { name: 'Trứng chiên', price: 15000, desc: 'Trứng chiên vàng đẹp mắt' },
      { name: 'Salad rau trộn', price: 30000, desc: 'Salad rau trộn sốt mayonnaise' },
    ],
    'Tráng miệng': [
      { name: 'Chè đậu đỏ', price: 20000, desc: 'Chè đậu đỏ nóng mát' },
      { name: 'Bánh flan', price: 20000, desc: 'Bánh flan caramel' },
      { name: 'Thanh long', price: 25000, desc: 'Thanh long đỏ tươi ngọt' },
    ],
  },
  'FoodCourt 54': {
    'Burger': [
      { name: 'Classic Beef Burger', price: 65000, desc: 'Bò beef patty phô mai, rau xà lách, cà chua' },
      { name: 'Cheese Burger', price: 58000, desc: 'Bánh burger phô mai cheddar tan chảy' },
      { name: 'Chicken Burger', price: 55000, desc: 'Ức gà chiên giòn, sốt BBQ' },
      { name: 'Double Burger', price: 95000, desc: '2 lớp bò beef patty siêu to khổng lồ' },
      { name: 'Fish Burger', price: 62000, desc: 'Fish fillet chiên giòn, sốt tartar' },
      { name: 'Veggie Burger', price: 52000, desc: 'Burger chay với đậu hũ và rau củ' },
    ],
    'Pizza': [
      { name: 'Pepperoni Pizza (M)', price: 120000, desc: 'Pizza pepperoni phô mai mozzarella' },
      { name: 'Hawaiian Pizza (M)', price: 115000, desc: 'Pizza dứa, giăm bông, phô mai' },
      { name: 'Cheese Pizza (M)', price: 100000, desc: 'Pizza phô mai 4 loại' },
      { name: 'Seafood Pizza (M)', price: 145000, desc: 'Pizza hải sản tươi ngon' },
      { name: 'BBQ Chicken Pizza (M)', price: 130000, desc: 'Pizza gà nướng sốt BBQ' },
      { name: 'Margherita Pizza (M)', price: 95000, desc: 'Pizza cà chua, phô mai, basil' },
    ],
    'Mì Ý': [
      { name: 'Spaghetti Bolognese', price: 85000, desc: 'Mì Ý sốt bolognese thịt bò' },
      { name: 'Carbonara', price: 90000, desc: 'Mì Ý carbonara kem trứng bacon' },
      { name: 'Penne Arrabiata', price: 80000, desc: 'Mì Ý penne sốt cà chua cay Ý' },
      { name: 'Fettuccine Alfredo', price: 95000, desc: 'Mì Ý fettuccine sốt kem Alfredo' },
      { name: 'Lasagna', price: 110000, desc: 'Lasagna bò phô mai Ý chính hiệu' },
    ],
    'Nước uống': [
      { name: 'Coca Cola', price: 20000, desc: 'Coca Cola lon 330ml' },
      { name: 'Sprite', price: 20000, desc: 'Sprite lon 330ml' },
      { name: 'Trà sữa trân châu', price: 35000, desc: 'Trà sữa trân châu đường đen' },
      { name: 'Trà đào', price: 28000, desc: 'Trà đào cam xả mát lạnh' },
      { name: 'Smoothie dâu', price: 40000, desc: 'Smoothie dâu tây tươi' },
      { name: 'Cà phê sữa', price: 25000, desc: 'Cà phê sữa đá Việt Nam' },
      { name: 'Nước suối', price: 12000, desc: 'Nước suối aquafina 500ml' },
    ],
    'Món thêm': [
      { name: 'Khoai tây chiên', price: 35000, desc: 'Khoai tây chiên French fries' },
      { name: 'Onion rings', price: 40000, desc: 'Hành tím chiên giòn' },
      { name: 'Chicken nuggets', price: 55000, desc: 'Chicken nuggets 6 miếng' },
      { name: 'Mozzarella sticks', price: 50000, desc: 'Que phô mai mozzarella giòn tan' },
      { name: 'Coleslaw', price: 25000, desc: 'Salad bắp cải trộn' },
    ],
  },
};

const COMBO_DATA = {
  'Bếp Việt Restaurant': [
    {
      name: 'Combo Gia Đình 1 (4-5 người)',
      desc: 'Gà bọc xôi + Bò nướng + Hải sản + Soup + Cơm chiên',
      price: 2800000,
      items: ['Gà bọc xôi chiên giòn', 'Bò nướng lá lốt', 'Tôm nướng muối ớt', 'Soup cua tóc tiên', 'Cơm chiên dương châu'],
    },
    {
      name: 'Combo Gia Đình 2 (4-5 người)',
      desc: 'Gà hấp + Bò lúc lắc + Gỏi ngó sen + Lẩu cá chép + Cơm',
      price: 2900000,
      items: ['Gà hấp muối', 'Bò lúc lắc khoai tây', 'Gỏi ngó sen', 'Lẩu cá chép giòn', 'Cơm chiên hải sản'],
    },
    {
      name: 'Combo Lẩu Đặc Biệt (3-4 người)',
      desc: 'Lẩu hải sản Thái + Tôm + Mực + Cá + Rau nhúng',
      price: 2400000,
      items: ['Lẩu thái hải sản', 'Tôm nướng muối ớt', 'Mực chiên giòn', 'Cá chẽm sốt chua ngọt', 'Rau muống xào tỏi'],
    },
    {
      name: 'Combo Bò Premium (2-3 người)',
      desc: 'Bò wagyū nướng + Bò nấu tiêu + Bò ragout + Cơm',
      price: 2200000,
      items: ['Bò nướng lá lốt', 'Bò nấu tiêu xanh', 'Bò ragout', 'Gỏi cổ hũ dừa', 'Cơm chiên dương châu'],
    },
    {
      name: 'Combo Tiệc Cưới (10-12 người)',
      desc: 'Full bàn tiệc: Gà, Bò, Hải sản, Lẩu, Xào, Tráng miệng',
      price: 8500000,
      items: [
        'Gà bọc xôi chiên giòn', 'Bò nướng lá lốt', 'Tôm hoàng kim', 'Cá tai tượng chiên xù',
        'Lẩu cá chép giòn', 'Miến xào cua', 'Sườn nấu đậu', 'Gỏi ngó sen',
        'Soup cua tóc tiên', 'Cơm chiên hải sản', 'Chè ba màu', 'Trái cây dầm',
      ],
    },
    {
      name: 'Combo Vịt Đặc Trưng (3-4 người)',
      desc: 'Vịt nướng + Gà hấp + Soup + Cơm + Salad',
      price: 2100000,
      items: ['Vịt nướng', 'Gà hấp lá chanh', 'Soup cua tóc tiên', 'Cơm chiên cá mặn', 'Gỏi bò thấu'],
    },
  ],
  'Quán Ốc Ngon': [
    {
      name: 'Combo Ốc Ngon (3-4 người)',
      desc: 'Ốc mỡ + Ốc len + Ốc tỏi + Ốc bươu + Khoai + Bia',
      price: 450000,
      items: ['Ốc mỡ hấp sả', 'Ốc len xào dừa', 'Ốc tỏi', 'Ốc bươu hấp thái', 'Khoai tây chiên', ' Bia tiger (lon)'],
    },
    {
      name: 'Combo Đặc Biệt (5-6 người)',
      desc: 'Tất cả loại ốc + Hải sản + Bia + Nước ngọt',
      price: 800000,
      items: [
        'Ốc mỡ hấp sả', 'Ốc len xào dừa', 'Ốc tỏi', 'Ốc bươu hấp thái', 'Ốc cà na',
        'Tôm sú nướng muối ớt', 'Mực một nắng nướng', ' Bia tiger (lon)', 'Nước cam',
      ],
    },
  ],
  'Lẩu & Nướng Phố': [
    {
      name: 'Combo Nướng 3 người',
      desc: 'Ba chỉ bò + Đùi gà + Tôm + Mực + Đồ nhắm',
      price: 650000,
      items: ['Ba chỉ bò nướng', 'Đùi gà nướng', 'Tôm nướng', 'Mực nướng', 'Chả ram'],
    },
    {
      name: 'Combo Lẩu 4 người',
      desc: 'Lẩu hải sản + Bò + Tôm + Mực + Rau + Mì',
      price: 800000,
      items: ['Lẩu hải sản Thái', 'Ba chỉ bò nướng', 'Tôm nướng', 'Rau nhúng lẩu', 'Mì gói'],
    },
    {
      name: 'Combo VIP (6-8 người)',
      desc: 'Lẩu bò + Nướng bò wagyū + Hải sản + Đồ nhắm + Bia',
      price: 1500000,
      items: [
        'Lẩu bò nhúng dấm', 'Bò wagyū nướng', 'Bạc tình bò', 'Tôm nướng', 'Mực nướng',
        'Bao tử nướng', 'Khô gà lá chanh', 'Bò khô', ' Bia tiger (lon)', 'Rượu vang đỏ',
      ],
    },
  ],
  'Cơm Niêu House': [
    {
      name: 'Combo Cơm Niêu (2 người)',
      desc: '2 Cơm niêu + 2 Canh + 1 Tráng miệng',
      price: 220000,
      items: ['Cơm niêu gà xối mỡ', 'Cơm niêu thịt kho trứng', 'Canh chua cá lóc', 'Chè đậu đỏ'],
    },
    {
      name: 'Combo Gia Đình (4 người)',
      desc: '4 Cơm niêu + 2 Canh + 2 Món thêm + Tráng miệng',
      price: 450000,
      items: ['Cơm niêu gà xối mỡ', 'Cơm niêu ba rọi chiên', 'Cơm niêu cá basa kho', 'Cơm niêu đùi gà chiên', 'Canh chua cá lóc', 'Đùi gà chiên giòn', 'Rau muống xào tỏi', 'Bánh flan'],
    },
  ],
  'FoodCourt 54': [
    {
      name: 'Burger Meal',
      desc: 'Classic Burger + Khoai tây + Nước ngọt',
      price: 95000,
      items: ['Classic Beef Burger', 'Khoai tây chiên', 'Coca Cola'],
    },
    {
      name: 'Pizza Party (2-3 người)',
      desc: '2 Pizza + Khoai tây + Nước',
      price: 320000,
      items: ['Pepperoni Pizza (M)', 'Hawaiian Pizza (M)', 'Khoai tây chiên', 'Coca Cola'],
    },
    {
      name: 'Pasta Combo',
      desc: 'Spaghetti + Carbonara + Khoai + Nước',
      price: 240000,
      items: ['Spaghetti Bolognese', 'Carbonara', 'Onion rings', 'Sprite'],
    },
    {
      name: 'Kids Meal',
      desc: 'Chicken Nuggets + Khoai + Nước + Toy',
      price: 85000,
      items: ['Chicken nuggets', 'Khoai tây chiên', 'Sprite'],
    },
  ],
};

const USER_DATA = [
  // Admin
  { fullName: 'Quản Trị Viên', email: 'admin@exe.vn', password: 'Admin@123', phone: '0901000001', role: 'admin' },
  // Restaurant Owners
  { fullName: 'Nguyễn Văn Minh', email: 'owner1@exe.vn', password: 'Owner@123', phone: '0902000001', role: 'restaurant_owner' },
  { fullName: 'Trần Thị Lan', email: 'owner2@exe.vn', password: 'Owner@123', phone: '0902000002', role: 'restaurant_owner' },
  { fullName: 'Lê Hoàng Nam', email: 'owner3@exe.vn', password: 'Owner@123', phone: '0902000003', role: 'restaurant_owner' },
  { fullName: 'Phạm Thu Hà', email: 'owner4@exe.vn', password: 'Owner@123', phone: '0902000004', role: 'restaurant_owner' },
  { fullName: 'Đặng Quốc Việt', email: 'owner5@exe.vn', password: 'Owner@123', phone: '0902000005', role: 'restaurant_owner' },
  // Delivery Staff
  { fullName: 'Ngô Đức Anh', email: 'driver1@exe.vn', password: 'Driver@123', phone: '0903000001', role: 'delivery_staff' },
  { fullName: 'Bùi Minh Tuấn', email: 'driver2@exe.vn', password: 'Driver@123', phone: '0903000002', role: 'delivery_staff' },
  { fullName: 'Hoàng Phương Thảo', email: 'driver3@exe.vn', password: 'Driver@123', phone: '0903000003', role: 'delivery_staff' },
  // Customers
  { fullName: 'Lê Thị Mai Anh', email: 'customer1@exe.vn', password: 'Customer@123', phone: '0904000001', role: 'customer' },
  { fullName: 'Phạm Đức Minh', email: 'customer2@exe.vn', password: 'Customer@123', phone: '0904000002', role: 'customer' },
  { fullName: 'Trần Hoàng Sơn', email: 'customer3@exe.vn', password: 'Customer@123', phone: '0904000003', role: 'customer' },
  { fullName: 'Nguyễn Thị Thu Hương', email: 'customer4@exe.vn', password: 'Customer@123', phone: '0904000004', role: 'customer' },
  { fullName: 'Võ Ngọc Linh', email: 'customer5@exe.vn', password: 'Customer@123', phone: '0904000005', role: 'customer' },
  { fullName: 'Đỗ Mạnh Hùng', email: 'customer6@exe.vn', password: 'Customer@123', phone: '0904000006', role: 'customer' },
  { fullName: 'Trịnh Minh Châu', email: 'customer7@exe.vn', password: 'Customer@123', phone: '0904000007', role: 'customer' },
  { fullName: 'Lý Thanh Hà', email: 'customer8@exe.vn', password: 'Customer@123', phone: '0904000008', role: 'customer' },
];

const RESTAURANT_DATA = [
  { name: 'Quán Ốc Ngon', ownerIdx: 1, address: '123 Đường Nguyễn Trãi, Quận 1, TP.HCM', phone: '02812345678', lat: 10.7769, lng: 106.7009, desc: 'Quán Ốc Ngon - Chuyên các món ốc tươi sống, hải sản nướng ngon miệng. Không gian thoáng mát, giá cả hợp lý.' },
  { name: 'Bếp Việt Restaurant', ownerIdx: 2, address: '456 Đường Lê Lợi, Quận 3, TP.HCM', phone: '02823456789', lat: 10.7829, lng: 106.6839, desc: 'Nhà hàng Bếp Việt - Chuyên các món ăn Việt Nam đậm đà. Thực đơn phong phú từ gà, bò, hải sản đến lẩu các loại.' },
  { name: 'Lẩu & Nướng Phố', ownerIdx: 3, address: '789 Đường Đề Thám, Quận 1, TP.HCM', phone: '02834567890', lat: 10.7755, lng: 106.6980, desc: 'Lẩu & Nướng Phố - Địa điểm lý tưởng cho những buổi tiệc cuối tuần. Lẩu đa dạng, nướng ngon, không gian rộng rãi.' },
  { name: 'Cơm Niêu House', ownerIdx: 4, address: '321 Đường Võ Văn Tần, Quận 3, TP.HCM', phone: '02845678901', lat: 10.7840, lng: 106.6900, desc: 'Cơm Niêu House - Cơm niêu giòn rụm, món ăn gia dụng đậm đà. Phục vụ nhanh chóng, chất lượng đảm bảo.' },
  { name: 'FoodCourt 54', ownerIdx: 5, address: '555 Đường 3/2, Quận 10, TP.HCM', phone: '02856789012', lat: 10.7780, lng: 106.6720, desc: 'FoodCourt 54 - Fast food hiện đại với burger, pizza, mì Ý ngon. Phù hợp cho gia đình và nhóm bạn trẻ.' },
];

const ORDER_STATUSES_SAMPLE = ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'completed', 'completed', 'completed', 'completed', 'completed', 'cancelled'];
const PAYMENT_METHODS_SAMPLE = ['cod', 'momo', 'cod', 'cod', 'cod', 'momo', 'cod'];
const DELIVERY_ADDRESSES = [
  '123 Lý Thường Kiệt, Quận 10, TP.HCM',
  '456 Nguyễn Thị Minh Khai, Quận 3, TP.HCM',
  '789 Pasteur, Quận 1, TP.HCM',
  '321 Điện Biên Phủ, Quận Bình Thạnh, TP.HCM',
  '654 Võ Văn Ngân, Thủ Đức, TP.HCM',
  '987 Trần Hưng Đạo, Quận 5, TP.HCM',
  '147 Quang Trung, Quận Gò Vấp, TP.HCM',
  '258 Phạm Văn Chiêu, Gò Vấp, TP.HCM',
];

// ===================== SEED FUNCTIONS =====================

async function seedDatabase() {
  try {
    await connectDB();

    const User = require('./src/models/User.model');
    const Restaurant = require('./src/models/Restaurant.model');
    const Category = require('./src/models/Category.model');
    const Food = require('./src/models/Food.model');
    const Combo = require('./src/models/Combo.model');
    const Order = require('./src/models/Order.model');
    const Promotion = require('./src/models/Promotion.model');
    const Review = require('./src/models/Review.model');
    const Payment = require('./src/models/Payment.model');
    const Notification = require('./src/models/Notification.model');

    // Clear all data
    await Promise.all([
      User.deleteMany({}),
      Restaurant.deleteMany({}),
      Category.deleteMany({}),
      Food.deleteMany({}),
      Combo.deleteMany({}),
      Order.deleteMany({}),
      Promotion.deleteMany({}),
      Review.deleteMany({}),
      Payment.deleteMany({}),
      Notification.deleteMany({}),
    ]);
    console.log('🧹 Cleared all existing data\n');

    // ---- Create Users ----
    const users = await User.insertMany(USER_DATA.map(u => ({
      fullName: u.fullName,
      email: u.email,
      password: u.password,
      phone: u.phone,
      role: u.role,
      status: 'active',
    })));
    console.log(`✅ Created ${users.length} users`);

    // ---- Create Restaurants ----
    const restaurants = [];
    for (const r of RESTAURANT_DATA) {
      const restaurant = await Restaurant.create({
        ownerId: users[r.ownerIdx]._id,
        name: r.name,
        description: r.desc,
        address: r.address,
        phone: r.phone,
        latitude: r.lat,
        longitude: r.lng,
        status: 'approved',
        averageRating: Number((4 + Math.random()).toFixed(1)),
        totalReviews: Math.floor(Math.random() * 50) + 5,
      });
      restaurants.push(restaurant);
    }
    console.log(`✅ Created ${restaurants.length} restaurants`);

    // ---- Create Categories, Foods, Combos for each restaurant ----
    let totalCategories = 0;
    let totalFoods = 0;
    let totalCombos = 0;

    for (let i = 0; i < restaurants.length; i++) {
      const rest = restaurants[i];
      const restName = rest.name;
      const categoriesForRest = CATEGORY_DATA[restName];
      if (!categoriesForRest) continue;

      // Categories
      const categories = await Category.insertMany(
        categoriesForRest.map((name, idx) => ({
          restaurantId: rest._id,
          name,
          sortOrder: idx,
          isActive: true,
        }))
      );
      totalCategories += categories.length;

      // Build category map
      const catMap = {};
      categories.forEach(c => { catMap[c.name] = c._id; });

      // Foods
      const foodDataForRest = FOOD_DATA[restName];
      if (foodDataForRest) {
        const foodsToInsert = [];
        for (const catName of categoriesForRest) {
          const foodsOfCat = foodDataForRest[catName];
          if (!foodsOfCat) continue;
          for (const f of foodsOfCat) {
            foodsToInsert.push({
              restaurantId: rest._id,
              categoryId: catMap[catName],
              name: f.name,
              description: f.desc,
              price: f.price,
              stock: Math.floor(Math.random() * 100) + 20,
              isAvailable: true,
              soldCount: Math.floor(Math.random() * 200),
              ratingAverage: Number((3.5 + Math.random() * 1.5).toFixed(1)),
              ratingCount: Math.floor(Math.random() * 30),
            });
          }
        }
        if (foodsToInsert.length > 0) {
          const insertedFoods = await Food.insertMany(foodsToInsert);
          totalFoods += insertedFoods.length;

          // Combos
          const comboDataForRest = COMBO_DATA[restName];
          if (comboDataForRest) {
            const combosToInsert = [];
            for (const combo of comboDataForRest) {
              const items = [];
              for (const foodName of combo.items) {
                const matchedFood = insertedFoods.find(f => f.name === foodName.trim());
                if (matchedFood) {
                  items.push({ foodId: matchedFood._id, quantity: 1 });
                }
              }
              if (items.length >= 2) {
                combosToInsert.push({
                  restaurantId: rest._id,
                  name: combo.name,
                  description: combo.desc,
                  price: combo.price,
                  items,
                  isActive: true,
                  soldCount: Math.floor(Math.random() * 50),
                });
              }
            }
            if (combosToInsert.length > 0) {
              const insertedCombos = await Combo.insertMany(combosToInsert);
              totalCombos += insertedCombos.length;
            }
          }
        }
      }
    }
    console.log(`✅ Created ${totalCategories} categories`);
    console.log(`✅ Created ${totalFoods} food items`);
    console.log(`✅ Created ${totalCombos} combos`);

    // ---- Create Promotions ----
    const promotions = await Promotion.insertMany([
      {
        restaurantId: restaurants[0]._id,
        title: 'Giảm 15% cho đơn từ 200K',
        description: 'Áp dụng cho tất cả các món ốc',
        discountType: 'percent',
        discountValue: 15,
        maxDiscount: 50000,
        minOrderAmount: 200000,
        code: 'OCNGON15',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
        usedCount: 5,
        maxUsage: 100,
      },
      {
        restaurantId: restaurants[1]._id,
        title: 'Giảm 20% - Cuối tuần sale',
        description: 'Khuyến mãi cuối tuần tại Bếp Việt',
        discountType: 'percent',
        discountValue: 20,
        maxDiscount: 100000,
        minOrderAmount: 500000,
        code: 'BEPVIET20',
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        isActive: true,
        usedCount: 12,
        maxUsage: 200,
      },
      {
        restaurantId: restaurants[2]._id,
        title: 'Freeship cho đơn từ 300K',
        description: 'Miễn phí giao hàng cho đơn từ 300K',
        discountType: 'fixed',
        discountValue: 30000,
        minOrderAmount: 300000,
        code: 'LAUNUONG_FREESHIP',
        startDate: new Date(),
        endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        isActive: true,
        usedCount: 8,
        maxUsage: null,
      },
      {
        restaurantId: restaurants[3]._id,
        title: 'Giảm 10K cho đơn đầu tiên',
        description: 'Ưu đãi khách hàng mới',
        discountType: 'fixed',
        discountValue: 10000,
        minOrderAmount: 50000,
        code: 'NEU_FRESH10',
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        isActive: true,
        usedCount: 20,
        maxUsage: 500,
      },
      {
        restaurantId: restaurants[4]._id,
        title: 'Combo burger giảm 20%',
        description: 'Giảm 20% khi mua Burger Meal',
        discountType: 'percent',
        discountValue: 20,
        minOrderAmount: 0,
        code: 'BURGER20',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
        usedCount: 15,
        maxUsage: 100,
      },
    ]);
    console.log(`✅ Created ${promotions.length} promotions`);

    // ---- Create Orders with related Reviews, Payments, Notifications ----
    const customers = users.filter(u => u.role === 'customer');
    const drivers = users.filter(u => u.role === 'delivery_staff');

    // Get all foods and combos for orders
    const allFoods = await Food.find().limit(200);
    const allCombos = await Combo.find().limit(50);

    let totalOrders = 0;
    let totalReviews = 0;
    let totalPayments = 0;
    let totalNotifications = 0;

    for (let i = 0; i < 30; i++) {
      const customer = customers[i % customers.length];
      const restaurant = restaurants[Math.floor(Math.random() * restaurants.length)];
      const driver = drivers[Math.floor(Math.random() * drivers.length)];
      const orderStatus = ORDER_STATUSES_SAMPLE[Math.floor(Math.random() * ORDER_STATUSES_SAMPLE.length)];
      const paymentMethod = PAYMENT_METHODS_SAMPLE[Math.floor(Math.random() * PAYMENT_METHODS_SAMPLE.length)];
      const deliveryAddr = DELIVERY_ADDRESSES[Math.floor(Math.random() * DELIVERY_ADDRESSES.length)];

      // Pick items (mix of food and combos)
      const itemCount = Math.floor(Math.random() * 4) + 1;
      const items = [];
      let totalAmount = 0;

      for (let j = 0; j < itemCount; j++) {
        const useCombo = Math.random() > 0.6 && allCombos.length > 0;
        if (useCombo) {
          const combo = allCombos[Math.floor(Math.random() * allCombos.length)];
          const price = combo.price;
          const quantity = Math.floor(Math.random() * 2) + 1;
          items.push({ comboId: combo._id, name: combo.name, price, quantity, subtotal: price * quantity });
          totalAmount += price * quantity;
        } else {
          const food = allFoods[Math.floor(Math.random() * allFoods.length)];
          const price = food.price;
          const quantity = Math.floor(Math.random() * 2) + 1;
          items.push({ foodId: food._id, name: food.name, price, quantity, subtotal: price * quantity });
          totalAmount += price * quantity;
        }
      }

      // Apply discount occasionally
      let discountAmount = 0;
      if (Math.random() > 0.7 && promotions.length > 0) {
        const promo = promotions[Math.floor(Math.random() * promotions.length)];
        if (promo.restaurantId.toString() === restaurant._id.toString()) {
          if (promo.discountType === 'percent') {
            discountAmount = Math.min((totalAmount * promo.discountValue) / 100, promo.maxDiscount || Infinity);
          } else {
            discountAmount = promo.discountValue;
          }
        }
      }

      const statusHistory = [
        { status: 'pending', note: 'Đơn hàng đã được tạo', changedAt: new Date() },
      ];
      if (['confirmed', 'preparing', 'ready', 'delivering', 'completed'].includes(orderStatus)) {
        statusHistory.push({ status: 'confirmed', note: 'Đơn hàng đã được xác nhận', changedAt: new Date(Date.now() + 5 * 60 * 1000) });
      }
      if (['preparing', 'ready', 'delivering', 'completed'].includes(orderStatus)) {
        statusHistory.push({ status: 'preparing', note: 'Nhà hàng đang chuẩn bị', changedAt: new Date(Date.now() + 15 * 60 * 1000) });
      }
      if (['ready', 'delivering', 'completed'].includes(orderStatus)) {
        statusHistory.push({ status: 'ready', note: 'Món ăn đã sẵn sàng', changedAt: new Date(Date.now() + 30 * 60 * 1000) });
      }
      if (['delivering', 'completed'].includes(orderStatus)) {
        statusHistory.push({ status: 'delivering', note: 'Đang giao hàng', changedBy: driver._id, changedAt: new Date(Date.now() + 45 * 60 * 1000) });
      }
      if (orderStatus === 'completed') {
        statusHistory.push({ status: 'completed', note: 'Giao hàng thành công', changedBy: driver._id, changedAt: new Date(Date.now() + 75 * 60 * 1000) });
      }
      if (orderStatus === 'cancelled') {
        statusHistory.push({ status: 'cancelled', note: 'Khách hủy đơn', changedAt: new Date(Date.now() + 10 * 60 * 1000) });
      }

      const order = await Order.create({
        customerId: customer._id,
        restaurantId: restaurant._id,
        driverId: ['delivering', 'completed'].includes(orderStatus) ? driver._id : null,
        items,
        totalAmount,
        discountAmount,
        deliveryAddress: deliveryAddr,
        deliveryLocation: { type: 'Point', coordinates: [restaurant.longitude + (Math.random() - 0.5) * 0.02, restaurant.latitude + (Math.random() - 0.5) * 0.02] },
        status: orderStatus,
        paymentStatus: ['completed'].includes(orderStatus) ? 'paid' : 'unpaid',
        paymentMethod,
        promotionCode: discountAmount > 0 ? promotions.find(p => p.restaurantId.toString() === restaurant._id.toString())?.code : null,
        statusHistory,
        note: Math.random() > 0.7 ? 'Giao giúp em đi, cảm ơn nhiều ạ!' : null,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 15) * 24 * 60 * 60 * 1000),
      });
      totalOrders++;

      // Payment
      const payment = await Payment.create({
        orderId: order._id,
        amount: totalAmount - discountAmount,
        paymentMethod,
        paymentStatus: ['completed'].includes(orderStatus) ? 'paid' : 'unpaid',
        transactionId: ['completed'].includes(orderStatus) ? `TXN${Date.now()}${i}` : null,
      });
      totalPayments++;

      // Reviews for completed orders
      if (orderStatus === 'completed' && Math.random() > 0.3) {
        const rating = Math.floor(Math.random() * 2) + 4;
        const review = await Review.create({
          customerId: customer._id,
          restaurantId: restaurant._id,
          orderId: order._id,
          rating,
          comment: [
            'Món ăn ngon, giao hàng nhanh, sẽ ủng hộ lần sau!',
            'Đồ ăn chất lượng, đóng gói cẩn thận, nhân viên thân thiện.',
            'Tuyệt vời! Đã order nhiều lần và lần nào cũng hài lòng.',
            'Món ăn tươi ngon, giá cả hợp lý, giao đúng giờ.',
            'Cơm niêu giòn rụm, món ăn đậm đà. Rất đáng thử!',
            'Ốc tươi ngon, chế biến vừa miệng. Không gian quán sạch sẽ.',
            'Lẩu ngon, nước dùng đậm đà. Sẽ quay lại!',
            'Burger to, phô mai ngậy. Con gái rất thích!',
            'Hài lòng về chất lượng và dịch vụ. Cảm ơn nhà hàng!',
            'Món ăn đúng như hình, không gian đẹp, giá ok.',
          ][Math.floor(Math.random() * 10)],
          images: [],
        });
        totalReviews++;

        // Update restaurant rating
        const reviews = await Review.find({ restaurantId: restaurant._id });
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        await Restaurant.findByIdAndUpdate(restaurant._id, {
          averageRating: Number(avgRating.toFixed(1)),
          totalReviews: reviews.length,
        });
      }

      // Notifications
      const notifications = [];
      if (['confirmed', 'preparing', 'ready', 'delivering', 'completed'].includes(orderStatus)) {
        notifications.push({ userId: customer._id, title: 'Đơn hàng đã được xác nhận', content: `Đơn hàng #${order._id.toString().slice(-6)} đã được xác nhận và đang được chuẩn bị.`, type: 'order' });
      }
      if (['ready', 'delivering', 'completed'].includes(orderStatus)) {
        notifications.push({ userId: customer._id, title: 'Món ăn đã sẵn sàng', content: `Đơn hàng #${order._id.toString().slice(-6)} đã sẵn sàng để giao.`, type: 'order' });
      }
      if (orderStatus === 'delivering' || orderStatus === 'completed') {
        notifications.push({ userId: driver._id, title: 'Bạn có đơn hàng mới cần giao', content: `Đơn hàng #${order._id.toString().slice(-6)} tại ${restaurant.name}.`, type: 'delivery' });
      }
      if (orderStatus === 'completed') {
        notifications.push({ userId: customer._id, title: 'Đơn hàng đã hoàn thành', content: `Cảm ơn bạn đã đặt hàng tại ${restaurant.name}! Đơn hàng đã được giao thành công.`, type: 'order' });
        notifications.push({ userId: restaurant.ownerId, title: 'Đơn hàng mới đã hoàn thành', content: `Đơn hàng #${order._id.toString().slice(-6)} đã được giao thành công.`, type: 'order' });
      }
      if (notifications.length > 0) {
        await Notification.insertMany(notifications.map(n => ({ ...n, isRead: false })));
        totalNotifications += notifications.length;
      }
    }
    console.log(`✅ Created ${totalOrders} orders`);
    console.log(`✅ Created ${totalPayments} payments`);
    console.log(`✅ Created ${totalReviews} reviews`);
    console.log(`✅ Created ${totalNotifications} notifications`);

    // ---- Summary ----
    console.log('\n========================================');
    console.log('📊 SEEDING SUMMARY');
    console.log('========================================');
    console.log(`   👤 Users:          ${users.length}`);
    console.log(`   🏪 Restaurants:    ${restaurants.length}`);
    console.log(`   📂 Categories:     ${totalCategories}`);
    console.log(`   🍽️  Foods:          ${totalFoods}`);
    console.log(`   📦 Combos:         ${totalCombos}`);
    console.log(`   🎫 Promotions:     ${promotions.length}`);
    console.log(`   📋 Orders:         ${totalOrders}`);
    console.log(`   💳 Payments:       ${totalPayments}`);
    console.log(`   ⭐ Reviews:        ${totalReviews}`);
    console.log(`   🔔 Notifications: ${totalNotifications}`);
    console.log('========================================');
    console.log('\n✅ Database seeded successfully!');
    console.log('\n📋 Sample accounts:');
    console.log('   Admin:              admin@exe.vn / Admin@123');
    console.log('   Restaurant Owner:   owner1@exe.vn - owner5@exe.vn / Owner@123');
    console.log('   Delivery Staff:     driver1@exe.vn - driver3@exe.vn / Driver@123');
    console.log('   Customer:           customer1@exe.vn - customer8@exe.vn / Customer@123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
}

seedDatabase();
