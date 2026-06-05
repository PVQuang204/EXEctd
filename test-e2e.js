require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./src/models/User.model');

const API_URL = 'http://localhost:5000/api';

const generateId = () => Math.random().toString(36).substring(7);

const runTest = async () => {
  console.log('--- Bắt đầu E2E Test ---');

  // Khởi tạo data random
  const ownerData = {
    name: 'Owner Test',
    email: `owner_${generateId()}@test.com`,
    password: 'password123',
  };

  const customerData = {
    name: 'Customer Test',
    email: `customer_${generateId()}@test.com`,
    password: 'password123',
  };

  let ownerToken, customerToken;
  let ownerId, customerId;
  let restaurantId, foodId, orderId;

  try {
    // 1. Kết nối DB để hỗ trợ set role
    console.log('Đang kết nối MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Đã kết nối MongoDB.');

    // 2. Đăng ký & Đăng nhập Owner
    console.log('\n--- Bước 1: Auth & Role ---');
    console.log(`Đăng ký chủ nhà hàng: ${ownerData.email}`);
    let res = await axios.post(`${API_URL}/auth/register`, ownerData);
    ownerId = res.data.data.user._id;
    ownerToken = res.data.data.token;

    console.log('Cập nhật role owner trong DB...');
    await User.findByIdAndUpdate(ownerId, { role: 'owner' });

    // Đăng nhập lại để lấy token có role owner (nếu token lưu payload) 
    // Thực ra token hiện tại decode user ID, DB lookup vẫn ra role mới, nhưng cứ login lại
    res = await axios.post(`${API_URL}/auth/login`, {
      email: ownerData.email,
      password: ownerData.password,
    });
    ownerToken = res.data.data.token;
    console.log('Owner login thành công.');

    // 3. Đăng ký & Đăng nhập Customer
    console.log(`Đăng ký khách hàng: ${customerData.email}`);
    res = await axios.post(`${API_URL}/auth/register`, customerData);
    customerId = res.data.data.user._id;
    customerToken = res.data.data.token;
    console.log('Customer login thành công.');

    const ownerAxios = axios.create({
      baseURL: API_URL,
      headers: { Authorization: `Bearer ${ownerToken}` },
    });

    const customerAxios = axios.create({
      baseURL: API_URL,
      headers: { Authorization: `Bearer ${customerToken}` },
    });

    // 4. Tạo nhà hàng
    console.log('\n--- Bước 2: Restaurant & Food ---');
    console.log('Tạo nhà hàng...');
    res = await ownerAxios.post('/restaurants', {
      name: 'Nhà Hàng Test E2E',
      address: '123 Đường Test, Quận 1',
      phone: '0901234567',
      category: 'Vietnamese',
      openTime: '08:00',
      closeTime: '22:00',
      isActive: true,
    });
    restaurantId = res.data.data._id;
    console.log(`Nhà hàng tạo thành công (ID: ${restaurantId})`);

    // 5. Tạo món ăn
    console.log('Tạo món ăn...');
    res = await ownerAxios.post(`/restaurants/${restaurantId}/foods`, {
      name: 'Phở Bò Test',
      description: 'Phở bò E2E đặc biệt',
      price: 55000,
      category: 'Noodle',
      isAvailable: true,
      options: [{ name: 'Thêm bánh', price: 5000 }],
    });
    foodId = res.data.data._id;
    console.log(`Món ăn tạo thành công (ID: ${foodId})`);

    // 6. Khách hàng đặt món
    console.log('\n--- Bước 3: Đặt hàng ---');
    console.log('Khách hàng tạo đơn...');
    res = await customerAxios.post('/orders', {
      restaurantId,
      items: [
        {
          foodId,
          quantity: 2,
          options: ['Thêm bánh'],
        },
      ],
      deliveryAddress: '456 Đường Khách, Quận 2',
      note: 'Ít hành nha shop',
      paymentMethod: 'momo',
    });
    orderId = res.data.data._id;
    console.log(`Đơn hàng tạo thành công (ID: ${orderId}), Tổng: ${res.data.data.totalAmount}`);

    // 7. Tạo thanh toán MoMo
    console.log('\n--- Bước 4: Thanh toán ---');
    console.log('Khách hàng tạo request thanh toán MoMo...');
    try {
      res = await customerAxios.post('/payments/momo', { orderId });
      console.log('MoMo Payment URL tạo thành công:', res.data.data.payUrl);
    } catch (err) {
      console.log('Lưu ý: Gọi MoMo thực tế có thể fail nếu config chưa chuẩn, báo lỗi:', err.response?.data?.message || err.message);
    }

    // 8. Cập nhật trạng thái đơn (Owner)
    console.log('\n--- Bước 5: Cập nhật đơn hàng ---');
    console.log('Owner xác nhận đơn hàng...');
    res = await ownerAxios.put(`/orders/${orderId}/status`, { status: 'confirmed' });
    console.log(`Trạng thái đơn hàng: ${res.data.data.status}`);

    console.log('Owner báo đang chuẩn bị món...');
    res = await ownerAxios.put(`/orders/${orderId}/status`, { status: 'preparing' });
    console.log(`Trạng thái đơn hàng: ${res.data.data.status}`);

    // 9. Kiểm tra thông báo
    console.log('\n--- Bước 6: Thông báo ---');
    res = await customerAxios.get('/notifications');
    console.log(`Khách hàng có ${res.data.pagination.total} thông báo.`);
    if (res.data.data.length > 0) {
      console.log(`Thông báo mới nhất: "${res.data.data[0].title}" - ${res.data.data[0].message}`);
    }

    res = await ownerAxios.get('/notifications');
    console.log(`Chủ nhà hàng có ${res.data.pagination.total} thông báo.`);
    if (res.data.data.length > 0) {
      console.log(`Thông báo mới nhất: "${res.data.data[0].title}" - ${res.data.data[0].message}`);
    }

    console.log('\n✅ E2E TEST HOÀN TẤT THÀNH CÔNG!');

  } catch (error) {
    console.error('\n❌ E2E TEST THẤT BẠI!');
    if (error.response) {
      console.error('API Error Response:', error.response.data);
    } else {
      console.error(error);
    }
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
};

runTest();
