# DB Templates — MongoDB Atlas Import

Bộ 10 file JSON template để import vào MongoDB Atlas (hoặc Compass), mỗi file = 1 collection.

## Thứ tự import (quan trọng — vì có foreign key)

```
1. users
2. restaurants
3. categories
4. foods
5. combos
6. promotions
7. orders
8. payments
9. reviews
10. notifications
```

## Cách import trong Atlas Web GUI

1. Mở https://cloud.mongodb.com → chọn cluster → **Browse Collections**
2. **Tạo collection trước** (nếu chưa có): click **"+ Create Collection"** → nhập tên (vd `users`) → Create
3. Vào collection vừa tạo → click **"..."** (3 chấm) trên thanh → **"Import Data"**
4. Chọn file JSON tương ứng (vd `01-users.json`)
5. Format: **JSON**
6. Click **Import**

Lặp lại cho 10 collection.

## Cách import trong Compass

1. Connect cluster → chọn database
2. **Create Collection** nếu chưa có
3. Click **"Add Data"** → **"Import JSON"** → chọn file → Import

## Danh sách file

| File | Collection | Số docs mẫu |
|------|-----------|------------|
| `01-users.json` | users | 3 (admin, owner, customer) |
| `02-restaurants.json` | restaurants | 1 (Bếp Việt) |
| `03-categories.json` | categories | 9 (theo menu Bếp Việt) |
| `04-foods.json` | foods | 32 món Best Seller + nhóm giá |
| `05-combos.json` | combos | 2 (Thực đơn set 1-3 người, 4-6 người) |
| `06-promotions.json` | promotions | 2 (BEPVIET10, WELCOME50) |
| `07-orders.json` | orders | 1 (đơn mẫu) |
| `08-payments.json` | payments | 1 (COD) |
| `09-reviews.json` | reviews | 1 (5⭐) |
| `10-notifications.json` | notifications | 2 (cho customer + owner) |

## ID có sẵn (copy/paste khi cần)

### Users
- **Admin**: `6a2d5100c6f0888cdd825700` — admin@exe.vn
- **Owner Bếp Việt**: `6a2d5100c6f0888cdd825701` — owner.bepviet@exe.vn
- **Customer mẫu**: `6a2d5100c6f0888cdd825702` — khach@exe.vn

### Restaurant
- **Bếp Việt**: `6a2d512ec6f0888cdd825828` (Quán Ốc, Lẩu & Nướng, Cơm Niêu, FoodCourt cũng đã tồn tại với ID tương tự)

### Categories (Bếp Việt)
- Thực đơn set: `6a3233000000000000000100`
- Món Best Seller: `6a3233000000000000000101`
- Gà - Vịt: `6a3233000000000000000102`
- Bò - Heo - Dê: `6a3233000000000000000103`
- Hải sản: `6a3233000000000000000104`
- Gỏi - Khai vị: `6a3233000000000000000105`
- Cơm: `6a3233000000000000000106`
- Lẩu: `6a3233000000000000000107`
- Soup: `6a3233000000000000000108`

## ⚠️ Quan trọng: Password

Trong `01-users.json` mật khẩu đang là **placeholder hash không login được**. Cần tạo hash thật bằng:

```bash
node db-templates/scripts/hash-password.js 123456
```

Rồi paste hash vào file `01-users.json` thay thế 3 dòng `"password": ...`.

Mật khẩu khuyên dùng cho tài khoản mẫu: `Admin@123`, `Owner@123`, `Customer@123`.

## Cú pháp MongoDB Extended JSON

- ObjectId: `{ "$oid": "65f1c2..." }`
- Date: `{ "$date": "2026-06-17T00:00:00.000Z" }`

Nếu Atlas báo lỗi parse, mở file và kiểm tra:
- Tất cả ObjectId phải bọc trong `{ "$oid": "..." }`
- Tất cả Date phải bọc trong `{ "$date": "..." }`
- Không có comment `//` trong file JSON

## Tạo ObjectId mới

Nếu muốn ID khác cho user/nhà hàng mới, tạo 1 document bất kỳ trong collection tương ứng, Atlas sẽ tự sinh `_id`. Hoặc dùng trang generator online (vd https://www.bing.com/search?q=objectid+generator).
