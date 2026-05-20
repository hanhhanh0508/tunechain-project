# 🎵 TuneChain - Hướng Dẫn Chạy Toàn Bộ Project

## 📋 Yêu Cầu Hệ Thống

- **Node.js**: v18+ (kiểm tra: `node -v`)
- **npm**: v9+ (kiểm tra: `npm -v`)
- **MySQL**: v8.0+ (hoặc dùng Docker)
- **MetaMask Browser Extension** (cho Frontend)

---

## 🚀 Bước 1: Cài Đặt Dependencies

Chạy lệnh sau trong thư mục gốc của project:

```bash
npm install
```

Lệnh này sẽ cài dependencies cho:
- ✅ Frontend (./Frontend)
- ✅ Backend (./backend)
- ✅ Blockchain (./blockchain)

---

## 🔷 Bước 2: Khởi Động Blockchain Local (Hardhat Node)

Mở **Terminal #1** và chạy:

```bash
npm run node -w blockchain
```

Hoặc nếu lệnh trên không hoạt động:

```bash
cd blockchain
npm run node
```

**Output kỳ vọng:**
```
> hardhat node
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545
Accounts:
Account #0: 0x...
Account #1: 0x...
...
```

✅ Để ý địa chỉ RPC: `http://127.0.0.1:8545`

---

## 🔗 Bước 3: Deploy Smart Contracts

Mở **Terminal #2** và chạy:

```bash
npm run deploy:local -w blockchain
```

Hoặc:

```bash
cd blockchain
npm run deploy:local
```

**Output kỳ vọng:**
```
Compiled 2 Solidity files successfully
TuneChain deployed to: 0x...
TuneToken deployed to: 0x...
```

✅ Ghi nhớ các địa chỉ contract này (sẽ cần cho Frontend)

---

## 🔧 Bước 4: Khởi Động Backend

### 4a. Kiểm Tra MySQL

**Nếu dùng Docker:**
```bash
docker-compose up -d mysql_db
```

**Hoặc nếu MySQL chạy locally:**
- Đảm bảo MySQL đang chạy trên port 3306
- Password: `123456` (đã cập nhật trong `.env`)

### 4b. Chạy Backend Server

Mở **Terminal #3** và chạy:

```bash
npm run dev:backend
```

Hoặc:

```bash
cd backend
npm run dev
```

**Output kỳ vọng:**
```
==================================================
  TuneChain Backend - Đang khởi động...
==================================================
✅ Kết nối MySQL thành công
✅ Pinata OK
🧹 Cleanup job started
🚀 Server chạy tại: http://localhost:5000
```

✅ Backend API sẵn sàng tại: `http://localhost:5000`

---

## 💻 Bước 5: Khởi Động Frontend

Mở **Terminal #4** và chạy:

```bash
npm run dev:frontend
```

Hoặc:

```bash
cd Frontend
npm run dev
```

**Output kỳ vọng:**
```
  VITE v8.0.10  ready in 500 ms
  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

✅ Frontend sẵn sàng tại: `http://localhost:5173`

---

## 🌐 Bước 6: Sử Dụng Application

1. **Mở trình duyệt** và đi đến: `http://localhost:5173`

2. **Kết nối MetaMask:**
   - Nhấn "Connect Wallet"
   - Nếu chưa có Hardhat network, MetaMask sẽ tự thêm:
     - **Network:** Hardhat Local
     - **RPC URL:** http://127.0.0.1:8545
     - **Chain ID:** 31337

3. **Import tài khoản Hardhat:**
   - Copy private key từ Terminal #1 (Account #0)
   - Vào MetaMask → Import Account → Dán private key

4. **Sử dụng Features:**
   - ✅ Upload nhạc
   - ✅ Xem view counter
   - ✅ Giao dịch blockchain

---

## 🐛 Troubleshooting

### ❌ Lỗi: "Cannot find module"
```bash
rm -rf node_modules package-lock.json
npm install
```

### ❌ MySQL Connection Error
```
[FATAL] Không thể kết nối MySQL
```

**Kiểm tra:**
- Cảng 3306 có mở không?
- Password đúng chưa? (mặc định: `123456`)
- MySQL đã khởi động?

```bash
# Kiểm tra MySQL status
docker ps | grep mysql

# Hoặc nếu MySQL local
mysql -u root -p123456 -e "SHOW DATABASES;"
```

### ❌ Port đã được sử dụng
```
Error: listen EADDRINUSE :::5000
```

Tìm process sử dụng port:
```bash
# Trên Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Trên Mac/Linux
lsof -i :5000
kill -9 <PID>
```

### ❌ Hardhat Network không kết nối
```
Error: connect ECONNREFUSED 127.0.0.1:8545
```

Đảm bảo Terminal #1 chạy `npm run node -w blockchain`

### ❌ Frontend không thấy Backend
Kiểm tra `.env` của Backend:
```
CORS_ORIGIN=http://localhost:5173
```

---

## 📦 Cấu Trúc Dependencies

```
├── /Frontend (React + Vite)
│   ├── ethers v6.16.0 (Web3 library)
│   └── react v19
│
├── /backend (Express + MySQL)
│   ├── express v5.0.6
│   ├── cors
│   ├── dotenv
│   └── @pinata/sdk (IPFS)
│
└── /blockchain (Hardhat + Solidity)
    ├── hardhat v3.4.5
    ├── @openzeppelin/contracts
    └── ethers v6.16.0
```

---

## 🔄 Các Lệnh Hữu Ích

| Mục Đích | Lệnh |
|----------|------|
| Cài đặt dependencies | `npm install` |
| Chạy tất cả test | `npm run test` |
| Build toàn bộ | `npm run build` |
| Lint code | `npm run lint` |
| Biên dịch Solidity | `npm run compile -w blockchain` |
| Xóa artifacts | `rm -rf blockchain/artifacts blockchain/cache` |

---

## ✅ Checklist Hoàn Tất

- [ ] Node.js + npm đã cài
- [ ] Chạy `npm install` thành công
- [ ] MySQL đã khởi động (password: 123456)
- [ ] Terminal #1: Hardhat node chạy ✅
- [ ] Terminal #2: Contracts deployed ✅
- [ ] Terminal #3: Backend chạy tại port 5000 ✅
- [ ] Terminal #4: Frontend chạy tại port 5173 ✅
- [ ] Mở http://localhost:5173 thành công ✅
- [ ] MetaMask kết nối Hardhat network ✅

---

## 📞 Cần Giúp?

Nếu gặp lỗi:
1. Kiểm tra logs trong terminal
2. Xem phần **Troubleshooting** ở trên
3. Đảm bảo ports (5000, 5173, 8545, 3306) không bị chiếm

---

**Happy Coding! 🎉**
