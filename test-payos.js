/**
 * Test PayOS Payment Integration
 * 
 * Script này sẽ:
 * 1. Đăng nhập tài khoản customer
 * 2. Tạo order mới (hoặc dùng order có sẵn)
 * 3. Tạo thanh toán PayOS → nhận checkout URL
 * 
 * Chạy: node test-payos.js
 */

const BASE_URL = 'http://localhost:5000/api';

// ========== CẤU HÌNH ==========
// Điền thông tin tài khoản customer của bạn
const CUSTOMER_EMAIL = 'customer@example.com';
const CUSTOMER_PASSWORD = 'password123';

// Nếu đã có orderId, điền vào đây (bỏ qua bước tạo order)
const EXISTING_ORDER_ID = ''; // Ví dụ: '6654abc123def456789'
// ===============================

async function request(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json();

  if (!res.ok) {
    console.error(`❌ ${method} ${path} → ${res.status}`);
    console.error('   Response:', JSON.stringify(data, null, 2));
    return null;
  }
  return data;
}

async function main() {
  console.log('🔷 ========== TEST PAYOS PAYMENT ==========\n');

  // --- Step 1: Đăng nhập ---
  console.log('📌 Step 1: Đăng nhập customer...');
  const loginRes = await request('POST', '/auth/login', {
    email: CUSTOMER_EMAIL,
    password: CUSTOMER_PASSWORD,
  });

  if (!loginRes) {
    console.error('\n⚠️  Không đăng nhập được. Hãy kiểm tra email/password trong script.');
    console.log('   Hoặc tạo tài khoản mới: POST /api/auth/register');
    console.log('   { "fullName": "Test", "email": "test@test.com", "password": "123456", "phone": "0901234567", "role": "customer" }');
    return;
  }

  const token = loginRes.data?.accessToken || loginRes.data?.token;
  console.log('✅ Đăng nhập thành công!\n');

  // --- Step 2: Lấy hoặc tạo order ---
  let orderId = EXISTING_ORDER_ID;

  if (!orderId) {
    console.log('📌 Step 2: Tìm order chưa thanh toán...');
    const ordersRes = await request('GET', '/orders/my', null, token);
    
    if (ordersRes?.data?.length > 0) {
      // Tìm order chưa thanh toán
      const unpaidOrder = ordersRes.data.find(o => o.paymentStatus === 'unpaid');
      if (unpaidOrder) {
        orderId = unpaidOrder._id;
        console.log(`✅ Tìm thấy order chưa thanh toán: ${orderId}`);
        console.log(`   Tổng tiền: ${unpaidOrder.totalAmount.toLocaleString()}đ\n`);
      }
    }

    if (!orderId) {
      console.log('⚠️  Không có order chưa thanh toán.');
      console.log('   Bạn cần tạo order trước qua Postman hoặc app.');
      console.log('   POST /api/orders với body:');
      console.log('   {');
      console.log('     "restaurantId": "<restaurant_id>",');
      console.log('     "items": [{ "foodId": "<food_id>", "quantity": 1 }],');
      console.log('     "deliveryAddress": "123 Test St",');
      console.log('     "deliveryName": "Test User",');
      console.log('     "deliveryPhone": "0901234567"');
      console.log('   }');
      return;
    }
  }

  // --- Step 3: Tạo thanh toán PayOS ---
  console.log('📌 Step 3: Tạo thanh toán PayOS...');
  const paymentRes = await request('POST', `/payments/${orderId}`, {
    paymentMethod: 'payos',
  }, token);

  if (!paymentRes) {
    console.error('❌ Tạo thanh toán thất bại!');
    return;
  }

  console.log('✅ Tạo thanh toán PayOS thành công!\n');
  console.log('📋 Payment Info:');
  console.log(`   Payment ID:  ${paymentRes.data?.payment?._id}`);
  console.log(`   Order Code:  ${paymentRes.data?.payment?.payosOrderCode}`);
  console.log(`   Amount:      ${paymentRes.data?.payment?.amount?.toLocaleString()}đ`);
  console.log(`   Status:      ${paymentRes.data?.payment?.paymentStatus}`);

  if (paymentRes.data?.paymentUrl) {
    console.log('\n🔗 ====================================');
    console.log('🔗  CHECKOUT URL (mở link này để thanh toán):');
    console.log(`🔗  ${paymentRes.data.paymentUrl}`);
    console.log('🔗 ====================================');
    console.log('\n💡 Mở link trên trong trình duyệt → Quét mã QR bằng app ngân hàng để thanh toán.');
  }

  console.log('\n🔷 ========== TEST HOÀN TẤT ==========');
}

main().catch(console.error);
