# 📚 Hướng Dẫn Chi Tiết - Chạy TuneChain Toàn Bộ (Step-by-Step)

## ✅ Phần 1: Chuẩn Bị Ban Đầu

### Bước 1: Kiểm Tra Node.js & npm

Mở **Command Prompt / PowerShell** (Windows) hoặc **Terminal** (Mac/Linux) và chạy:

```bash
node -v
npm -v
```

**Kết quả kỳ vọng:**
```
v20.11.0
10.2.0
```

Nếu chưa cài, hãy tải từ: https://nodejs.org/

---

### Bước 2: Kiểm Tra MySQL

#### Cách 1: Dùng Docker (Recommended)
```bash
docker -v
docker-compose -v
```

Nếu chưa cài Docker, tải từ: https://www.docker.com/

#### Cách 2: MySQL Local
Nếu đã cài MySQL locally, kiểm tra:
```bash
mysql --version
mysql -u root -p123456 -e "SELECT 1"
```

**Password:** `123456` (đã cập nhật)

---

### Bước 3: Kiểm Tra MetaMask

Cài MetaMask extension cho trình duyệt:
- Chrome: https://chrome.google.com/webstore
- Firefox: https://addons.mozilla.org
- Safari: https://apps.apple.com

---

## 🔧 Phần 2: Chuẩn Bị Code

### Bước 4: Mở Folder Project

1. Mở **VS Code**
2. Chọn **File** → **Open Folder**
3. Chọn folder: `d:\source\repos\blockchain-project`

---

### Bước 5: Cài Đặt Dependencies

Mở **Terminal** trong VS Code (Ctrl + `)

```bash
npm install
```

**⏱️ Thời gian:** 2-3 phút

**Output kỳ vọng:**
```
added 500+ packages in 2m30s
```

💡 **Nếu lỗi:** Xóa `node_modules` và thử lại:
```bash
rm -r node_modules package-lock.json
npm install
```

---

## 🚀 Phần 3: Khởi Động Services (Cần 4 Terminal)

### ⚠️ QUAN TRỌNG: Mở 4 Terminal Riêng!

Mỗi service chạy trong một terminal riêng. 

**Hình dung:**
```
┌─────────────────────────────────────────┐
│ VS Code (4 Terminal mở cùng lúc)        │
├─────────────────────────────────────────┤
│ Terminal 1: Hardhat Node    [RUNNING]   │
│ Terminal 2: Deploy Contracts [RUNNING]  │
│ Terminal 3: Backend API     [RUNNING]   │
│ Terminal 4: Frontend        [RUNNING]   │
└─────────────────────────────────────────┘
```

---

### Terminal #1️⃣ : Khởi Động Blockchain Node

```bash
npm run node -w blockchain
```

**Output kỳ vọng:**
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545

Accounts:
Account #0: 0x8ba1f109551bD432803012645Ac136ddd64DBA72
Account #1: 0x3C44CdDdB6a900c8B84640fccaEfb482d361CaCf
Account #2: 0x90F79bf6EB2c4f870365E785982E1f101E93b906
...
```

✅ **Thành công!** Để ý địa chỉ RPC: `http://127.0.0.1:8545`

⚠️ **Không bấm Ctrl+C!** Terminal này phải chạy liên tục!

---

### Terminal #2️⃣ : Deploy Smart Contracts

Mở **terminal mới** trong VS Code:

```bash
npm run deploy:local -w blockchain
```

**Output kỳ vọng:**
```
Nothing to compile
Hardhat Ignition 0.15.5

Deploying [ TuneChain ]

TuneChain[ TuneChain ] (tx: 0x...)
TuneToken[ TuneToken ] (tx: 0x...)

✓ Deployment successful
```

✅ **Thành công!** Ghi nhớ address của contracts (copy từ output)

---

### Terminal #3️⃣ : Khởi Động Backend API

Mở **terminal mới** lần nữa:

```bash
npm run dev:backend
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

📌 Endpoint:
   GET  /health
   POST /api/view
   GET  /api/views/:trackId
   ...
```

✅ **Thành công!** Backend API sẵn sàng tại `http://localhost:5000`

⚠️ **Nếu lỗi MySQL:**
```
[FATAL] Không thể kết nối MySQL
Kiểm tra lại DB_HOST, DB_USER, DB_PASSWORD trong .env
```

**Giải pháp:**
1. Kiểm tra MySQL đang chạy không?
   ```bash
   mysql -u root -p123456 -e "SELECT 1"
   ```
2. Kiểm tra `.env` file:
   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=123456
   ```

---

### Terminal #4️⃣ : Khởi Động Frontend

Mở **terminal mới** cuối cùng:

```bash
npm run dev:frontend
```

**Output kỳ vọng:**
```
  VITE v8.0.10  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

✅ **Thành công!** Frontend sẵn sàng tại `http://localhost:5173`

---

## 🌐 Phần 4: Sử Dụng Application

### Bước 6: Mở Trình Duyệt

1. Mở trình duyệt (Chrome, Firefox, Edge, Safari)
2. Vào: `http://localhost:5173`

**Bạn sẽ thấy:**
```
TuneChain UI
[Connect Wallet]
```

---

### Bước 7: Kết Nối MetaMask

#### Lần Đầu Tiên:

1. Nhấn **"Connect Wallet"**
2. MetaMask sẽ yêu cầu cấp quyền → Nhấn **"Connect"**
3. Chọn **Account #0** (hoặc account nào bạn muốn dùng)
4. Nhấn **"Connect"**

#### MetaMask Sẽ Yêu Cầu Thêm Hardhat Network:

MetaMask sẽ hiển thị:
```
Add Network
Network Name: Hardhat Local
RPC URL: http://127.0.0.1:8545
Chain ID: 31337
Currency: ETH
```

Nhấn **"Approve"** (tự động thêm)

✅ **MetaMask đã kết nối!**

---

### Bước 8: Kiểm Tra Kết Nối

Trong MetaMask:
1. Chọn **"Hardhat Local"** network
2. Kiểm tra balance (phải có ETH)
3. Nếu Account #0 có 10000 ETH → ✅ Kết nối thành công!

---

## 🎵 Phần 5: Test Các Tính Năng

### Feature 1: Upload Nhạc

1. Nhấn **"Upload"** tab
2. Chọn file MP3 (hoặc file audio khác)
3. Nhập thông tin:
   - **Title:** Tên bài hát
   - **Artist:** Tên ca sĩ
4. Nhấn **"Upload to IPFS"**

**Kết quả:**
- ✅ File upload lên IPFS
- ✅ Nhận CID (hash)
- ✅ Metadata lưu trên blockchain

---

### Feature 2: Xem Lượt View

1. Nhấn **"Dashboard"** tab
2. Chọn bài hát
3. View count tăng lên

**Backend sẽ:**
- Lưu view vào MySQL
- Rate limit 5 view/IP/giờ

---

### Feature 3: Smart Contract Interactions

Frontend sẽ gọi contracts:
- `TuneChain.sol` - Quản lý bài hát
- `TuneToken.sol` - Quản lý token

---

## 📱 Phần 6: Troubleshooting

### ❌ Lỗi #1: "Cannot GET /"

**Nguyên nhân:** Frontend chưa chạy

**Giải pháp:**
```bash
# Terminal 4
npm run dev:frontend
```

---

### ❌ Lỗi #2: "MetaMask is not installed"

**Nguyên nhân:** Chưa cài MetaMask

**Giải pháp:**
1. Cài MetaMask extension
2. Reload page (F5 hoặc Ctrl+R)

---

### ❌ Lỗi #3: "Failed to connect to RPC"

**Nguyên nhân:** Hardhat node chưa chạy

**Giải pháp:**
```bash
# Terminal 1
npm run node -w blockchain
# Chờ "Started HTTP and WebSocket..."
```

---

### ❌ Lỗi #4: "CORS error"

**Nguyên nhân:** Backend CORS không đúng

**Kiểm tra** `backend/.env`:
```
CORS_ORIGIN=http://localhost:5173
```

---

### ❌ Lỗi #5: MySQL Connection Error

**Giải pháp:**

**Nếu dùng Docker:**
```bash
docker-compose up -d mysql_db
docker-compose ps  # Kiểm tra container chạy không
```

**Nếu MySQL local:**
```bash
# Windows
net start MySQL80

# Mac
brew services start mysql-server

# Linux
sudo systemctl start mysql
```

**Kiểm tra:**
```bash
mysql -u root -p123456 -e "SELECT 1"
# Output: 1
```

---

## 🔄 Phần 7: Restart lại toàn bộ

Nếu muốn reset lại từ đầu:

### Cách 1: Giữ terminal chạy (nhanh)
```
Bấm F5 trên Frontend
→ Tự động kết nối lại
```

### Cách 2: Restart toàn bộ
```bash
# Bấm Ctrl+C trên tất cả 4 terminals

# Sau đó, từ lần đầu:
npm run node -w blockchain              # Terminal 1
npm run deploy:local -w blockchain      # Terminal 2
npm run dev:backend                     # Terminal 3
npm run dev:frontend                    # Terminal 4
```

---

## ✨ Phần 8: Tips & Tricks

### Tip 1: Xem Logs Chi Tiết
Mở **Developer Tools** trên trình duyệt (F12):
- Console: JavaScript logs
- Network: API calls
- Storage: Blockchain data

### Tip 2: Kiểm Tra Database
```bash
mysql -u root -p123456 tunechain
> SELECT * FROM track_views;
> SELECT * FROM view_logs;
```

### Tip 3: Kiểm Tra Contract State
Trong trình duyệt console:
```javascript
const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
const balance = await provider.getBalance('0x8ba1f109551bD432803012645Ac136ddd64DBA72');
console.log(ethers.formatEther(balance)); // "10000.0"
```

### Tip 4: Sử Dụng Hardhat Test
```bash
npm run test:blockchain
```

---

## 📊 Giám Sát Services

### Kiểm Tra Toàn Bộ Services Chạy

Mở **Terminal mới** (Terminal #5):

```bash
# Kiểm tra các port
netstat -ano | findstr ":5173"  # Frontend
netstat -ano | findstr ":5000"  # Backend
netstat -ano | findstr ":8545"  # Blockchain
netstat -ano | findstr ":3306"  # MySQL
```

**Kết quả kỳ vọng:** 4 port đều LISTENING

---

## 🎓 Hiểu Architecture

```
User (Browser)
    ↓
Frontend (http://localhost:5173)
    ├─ Web3.js → Blockchain
    │              ├─ Contract: TuneChain
    │              └─ Contract: TuneToken
    │
    └─ Fetch API → Backend (http://localhost:5000)
                    └─ MySQL (localhost:3306)
                       ├─ track_views
                       └─ view_logs

Blockchain Node (http://127.0.0.1:8545)
├─ Hardhat Local Network
├─ Chain ID: 31337
└─ 10 Accounts (10000 ETH mỗi account)
```

---

## 🏁 Kết Thúc Setup

Nếu thấy:
- ✅ Frontend: http://localhost:5173 hiển thị
- ✅ MetaMask: Kết nối Hardhat Local (10000 ETH)
- ✅ Backend: http://localhost:5000/health trả về OK
- ✅ Blockchain: 4 terminals chạy liên tục

**Congratulations! 🎉 Bạn đã setup thành công TuneChain!**

---

## 📞 Cần Giúp Thêm?

1. Kiểm tra lại các bước ở phần **Troubleshooting**
2. Đọc **SETUP_GUIDE.md** (gồm hơn 200 dòng hướng dẫn)
3. Đọc **ARCHITECTURE.md** (hiểu cấu trúc toàn bộ)

---

**Happy Coding! 🚀**
