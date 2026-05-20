# 🎵 TuneChain - Blockchain Music Platform

## 📖 Bắt Đầu Từ Đây!

Anh đã chuẩn bị cho em các tài liệu hướng dẫn **chi tiết bằng tiếng Việt**. 

### 👇 Hãy Chọn Theo Nhu Cầu Của Em:

---

## 🚀 **NHANH - Chỉ cần chạy ngay**
**Đọc:** [QUICK_START.md](./QUICK_START.md)
- ✅ Hướng dẫn **từng bước một**
- ✅ Có screenshot và output kỳ vọng
- ✅ Phù hợp cho người mới bắt đầu
- ⏱️ Đọc: 10-15 phút, Chạy: 5-10 phút

---

## 📚 **CHI TIẾT - Muốn hiểu toàn bộ**
**Đọc:** [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- ✅ Hướng dẫn chi tiết (200+ dòng)
- ✅ Yêu cầu hệ thống
- ✅ Phần Troubleshooting rất chi tiết
- ✅ Các lệnh hữu ích
- ⏱️ Đọc: 20-30 phút

---

## 🏗️ **KỸ THUẬT - Hiểu cấu trúc project**
**Đọc:** [ARCHITECTURE.md](./ARCHITECTURE.md)
- ✅ Cấu trúc hệ thống (diagram)
- ✅ Cấu hình chi tiết từng component
- ✅ Technology stack
- ✅ Database schema
- ✅ API endpoints
- ⏱️ Đọc: 15-20 phút

---

## ⚡ **SCRIPT TỰ ĐỘNG - Chạy tự động**
**Chạy:** 
```bash
# Windows
START_ALL.bat

# Mac/Linux
bash START_ALL.sh
```

- ✅ Tự động kiểm tra Node.js
- ✅ Tự động cài dependencies
- ✅ Hướng dẫn mở 4 terminal

---

## 🎯 **ĐỀ XUẤT: Thứ Tự Đọc Tối Ưu**

### Nếu em là **Beginner** (Mới học)
```
1. QUICK_START.md        (15 phút)
   ↓
2. Chạy project          (10 phút)
   ↓
3. ARCHITECTURE.md       (20 phút)
```

### Nếu em là **Developer** (Có kinh nghiệm)
```
1. ARCHITECTURE.md       (15 phút)
   ↓
2. START_ALL.bat/sh      (chạy ngay)
   ↓
3. SETUP_GUIDE.md        (khi gặp lỗi)
```

---

## 📝 **Tóm Tắt Nhanh - 3 Phút**

### Cài Đặt (Lần Đầu)
```bash
npm install
```

### Chạy (Cần 4 Terminal)

**Terminal 1 - Blockchain:**
```bash
npm run node -w blockchain
```

**Terminal 2 - Deploy Contracts:**
```bash
npm run deploy:local -w blockchain
```

**Terminal 3 - Backend:**
```bash
npm run dev:backend
```

**Terminal 4 - Frontend:**
```bash
npm run dev:frontend
```

### Mở Trình Duyệt
```
http://localhost:5173
```

### Kết Nối MetaMask
- Chain ID: **31337**
- RPC: **http://127.0.0.1:8545**
- Password MySQL: **123456**

---

## 🔧 **Anh Đã Fix Cho Em**

✅ **Backend .env** - Password MySQL: 123456
✅ **docker-compose.yml** - Password MySQL: 123456
✅ **Backend Config** - DB_PASSWORD mặc định: 123456
✅ **Tất cả Documentation** - Viết bằng Tiếng Việt

---

## 📊 **Project Structure**

```
blockchain-project/
├── Frontend/           (React + Vite - Port 5173)
├── backend/            (Express + MySQL - Port 5000)
├── blockchain/         (Hardhat - Port 8545)
├── QUICK_START.md      (📖 Đọc trước!)
├── SETUP_GUIDE.md      (📖 Hướng dẫn chi tiết)
├── ARCHITECTURE.md     (🏗️ Kiến trúc hệ thống)
├── START_ALL.bat       (🪟 Windows)
└── START_ALL.sh        (🍎 Mac/Linux)
```

---

## ⚠️ **Requirements Tối Thiểu**

- **Node.js:** v18+
- **npm:** v9+
- **RAM:** 4GB+
- **Disk:** 5GB+
- **Internet:** Để tải packages

**Optional:**
- **Docker:** Nếu muốn dùng MySQL container
- **MetaMask:** Browser extension
- **MySQL:** Nếu không dùng Docker

---

## 🆘 **Gặp Lỗi?**

1. **Lỗi gì?** → Xem **SETUP_GUIDE.md** phần Troubleshooting
2. **Không hiểu?** → Xem **QUICK_START.md** phần từng bước
3. **Muốn biết thêm?** → Xem **ARCHITECTURE.md**

---

## 📞 **Kiểm Tra Nhanh Services Chạy**

Sau khi chạy cả 4 terminal, kiểm tra:

### Frontend
```
Mở: http://localhost:5173
Kỳ vọng: Thấy UI TuneChain
```

### Backend
```
Mở: http://localhost:5000/health
Kỳ vọng: {"status":"ok",...}
```

### Blockchain
```
Terminal 1: "Started HTTP and WebSocket..."
Kỳ vọng: RPC sẵn sàng
```

### MetaMask
```
Connected Network: Hardhat Local
Balance: 10000 ETH
Kỳ vọng: Kết nối thành công
```

---

## 💡 **Mẹo Hữu Ích**

1. **Không đóng terminal blockchain** - Nó phải chạy liên tục
2. **Mở 4 terminal cùng lúc** - Dùng split terminal hoặc tab
3. **Reset MetaMask** - Nếu có vấn đề kết nối
4. **Xóa cache browser** - Ctrl+Shift+Delete hoặc Cmd+Shift+Delete
5. **Kiểm tra port** - Đảm bảo 5173, 5000, 8545, 3306 không bị chiếm

---

## 🎓 **Learn More**

### Documents
- [QUICK_START.md](./QUICK_START.md) - Chi tiết từng bước
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Hướng dẫn toàn bộ
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Kiến trúc hệ thống

### Frameworks
- **Frontend:** React + Vite + Tailwind
- **Backend:** Express + MySQL
- **Blockchain:** Hardhat + Solidity

### Libraries
- **Web3:** ethers.js v6
- **IPFS:** Pinata SDK
- **Testing:** Jest + Mocha

---

## ✨ **Tính Năng**

- ✅ Upload nhạc lên IPFS
- ✅ Quản lý bài hát trên blockchain
- ✅ Đếm lượt xem (MySQL)
- ✅ Rate limit per IP
- ✅ Kết nối MetaMask
- ✅ Smart contract (TuneChain + TuneToken)

---

## 📊 **Status**

| Component | Status | Port | Notes |
|-----------|--------|------|-------|
| Frontend | ✅ Ready | 5173 | React + Vite |
| Backend | ✅ Ready | 5000 | Express + MySQL |
| Blockchain | ✅ Ready | 8545 | Hardhat Local |
| MySQL | ✅ Ready | 3306 | Password: 123456 |

---

## 🚀 **Bắt Đầu Ngay!**

```bash
# 1. Cài dependencies
npm install

# 2. Đọc hướng dẫn
cat QUICK_START.md

# 3. Mở 4 terminals và chạy 4 lệnh (xem ở trên)

# 4. Mở http://localhost:5173 trong trình duyệt

# 5. Kết nối MetaMask

# 6. Enjoy! 🎉
```

---

**Good luck! Em đã sẵn sàng rồi! 🎵**
```

After setting the variable, you can run the deployment with the Sepolia network:

```shell
npx hardhat ignition deploy --network sepolia ignition/modules/Counter.ts
```
