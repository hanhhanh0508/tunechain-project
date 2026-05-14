# TuneChain Backend API

## Phân hệ Storage & Database

Hệ thống Backend này chịu trách nhiệm:

- Quản lý cơ sở dữ liệu MySQL
- Theo dõi lượt nghe (View Tracking) chống spam
- Tương tác với mạng lưu trữ phi tập trung IPFS thông qua Pinata
  Dự án thuộc hệ thống **TuneChain**.

---

# 1. Các tính năng đã hoàn thiện

## 📌 Tuần 2 — Xây dựng nền tảng lõi

### ✅ Chuyển đổi Database

- Chuyển từ Firebase sang MySQL
- Chạy thông qua XAMPP
- Quản lý dữ liệu cục bộ an toàn hơn

### ✅ API View Tracking

- Xây dựng hệ thống đếm lượt xem nhạc
- Chặn spam bằng Rate Limit theo IP
- Giới hạn:
  - `5 lượt / giờ`
  - Áp dụng cho môi trường test

### ✅ API Upload IPFS

Tích hợp `pinata-sdk` để:

- Upload file nhạc Base64 lên IPFS
- Upload Metadata JSON
- Trả về CID Hash

### ✅ Tối ưu Payload

Cấu hình Express hỗ trợ upload file lớn:

```ts
70mb
```

Phù hợp cho file `.mp3` dung lượng cao.

---

# 📌 2. Tuần 3 — Tối ưu hóa & Đóng gói

## ✅ Bảo mật & CORS

Cho phép frontend truy cập từ:

```txt
http://localhost:5173
```

---

## ✅ Unit Test với Jest

Phủ test tự động cho:

- API Upload
- API View Tracking

Sử dụng:

- Jest
- Supertest

---

## ✅ Tối ưu Database

Thêm `INDEX` vào MySQL để:

- Tăng tốc truy vấn rate-limit
- Dọn dẹp log hiệu quả hơn

---

## ✅ Docker Compose

Đóng gói:

- Backend
- Database MySQL

Giúp triển khai dễ dàng trên mọi môi trường.

---

# 🛠️ 3. Yêu cầu môi trường

## Cần cài đặt

### Node.js

- Version `18.x` trở lên

### Database

Một trong hai lựa chọn:

- XAMPP
- Docker Desktop

### Dịch vụ IPFS

Cần tài khoản Pinata:

- API Key
- Secret Key

---

# 📦 4. Cài đặt thư viện

Chạy tại thư mục:

```bash
backend/
```

---

## 📌 Thư viện lõi (Tuần 2)

```bash
# Express + MySQL + Pinata + ENV
npm install express dotenv cors pinata-sdk mysql2 --ignore-scripts
```

### TypeScript

```bash
npm install -g typescript ts-node
```

---

## 📌 Thư viện kiểm thử (Tuần 3)

```bash
# Jest + Supertest
npm install --save-dev jest ts-jest @types/jest supertest @types/supertest --ignore-scripts
```

---

# ⚙️ 5. Thiết lập & Khởi chạy dự án

## Bước 1 — Tạo file `.env`

Tạo file:

```txt
backend/.env
```

Dựa trên:

```txt
.env.example
```

### ⚠️ Lưu ý XAMPP mặc định

Nếu dùng MySQL của XAMPP:

```env
DB_PASSWORD=
```

Để trống hoàn toàn.

---

## Bước 2 — Khởi tạo Database

### Nếu KHÔNG dùng Docker

### 1. Mở XAMPP

Start dịch vụ:

- Apache
- MySQL

---

### 2. Truy cập phpMyAdmin

```txt
http://localhost/phpmyadmin/
```

---

### 3. Import Database

- Mở file:

```txt
init_database.sql
```

- Copy toàn bộ nội dung
- Dán vào tab SQL
- Execute

Hệ thống sẽ tự tạo:

- Database `tunechain`
- Các bảng dữ liệu cần thiết

---

# ▶️ 6. Các lệnh thao tác chính

| Lệnh                   | Chức năng                        |
| ---------------------- | -------------------------------- |
| `npx tsx src/index.ts` | Khởi động Backend Server         |
| `npx jest`             | Chạy toàn bộ Unit Test           |
| `docker-compose up -d` | Chạy Backend + MySQL bằng Docker |

---

# 🌐 7. API Endpoints chính

## 🎵 Upload APIs

### Upload Audio

```http
POST /api/upload/audio
```

Gửi file nhạc Base64 và nhận về CID.

---

### Upload Metadata

```http
POST /api/upload/metadata
```

Tạo Metadata JSON cho bài hát trên IPFS.

---

## 👁️ View Tracking APIs

### Ghi nhận lượt xem

```http
POST /api/view
```

- Ghi nhận lượt nghe
- Có kiểm tra IP chống spam

---

### Lấy view của 1 bài hát

```http
GET /api/views/:trackId
```

---

### Lấy view nhiều bài hát

```http
POST /api/views/batch
```

Dùng cho:

- Trang chủ
- Danh sách bài hát
- Ranking

---

# 🐳 8. Docker

Khởi chạy toàn bộ hệ thống:

```bash
docker-compose up -d
```

Docker sẽ tự động:

- Tải MySQL
- Khởi tạo database
- Chạy Backend Server

---

# ✅ Công nghệ sử dụng

- Node.js
- Express.js
- TypeScript
- MySQL
- Docker
- Jest
- Supertest
- IPFS
- Pinata SDK

---

# 👨‍💻 Author

Developed for the **TuneChain Project**.
