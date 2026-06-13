# Backend API

Node.js + Express + MongoDB + Socket.IO

## Cấu trúc

```
backend/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── repositories/
│   ├── routes/
│   ├── services/
│   ├── sockets/
│   └── tests/
├── uploads/          # Ảnh local (dev)
├── .env
└── package.json
```

## Chạy

```bash
npm install
copy .env.example .env
npm run dev
```

> Mở terminal trong thư mục `backend` này.

- API: `http://localhost:5000/api`
- Swagger: `http://localhost:5000/api-docs`

## Biến môi trường (.env)

| Biến | Mô tả |
|------|--------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_ACCESS_SECRET` | Access token secret |
| `JWT_REFRESH_SECRET` | Refresh token secret |
| `CLIENT_URL` | URL frontend (CORS), ví dụ `http://localhost:5173` |
| `CLOUDINARY_*` | Upload ảnh production |
| `SMTP_*` | Email forgot password |
| `MOMO_*` | Thanh toán MoMo |

Hỗ trợ legacy: `MONGO_URI`, `JWT_SECRET`

## Tạo Admin (MongoDB Atlas)

1. `POST /api/auth/register` — tạo user + password hash
2. Atlas → database → `users` → sửa `role` = `admin`, `status` = `active`
3. Login bằng email/password đã đăng ký

## Scripts

| Lệnh | Mô tả |
|------|--------|
| `npm run dev` | Nodemon |
| `npm start` | Production |
| `npm test` | Jest + coverage |
| `npm run test:requirements` | Checklist 50 mục |

## Postman

`Mobile-Restaurant-API.postman_collection.json`

## Docker

```bash
docker-compose up --build
```

## Chạy với Frontend

Folder anh em: `../frontend` — mở terminal riêng, `npm run dev` → http://localhost:5173
