# 📊 Tóm Tắt Cấu Hình Project

## 🎵 TuneChain - Hệ Thống Âm Nhạc Blockchain

### 📦 Thành Phần Chính

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          🎵 TuneChain System                             │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│    Frontend      │
│  (React + Vite)  │  http://localhost:5173
│  Port: 5173      │  
└────────┬─────────┘
         │ API Calls
         │ (ethers.js)
         ▼
┌──────────────────┐        ┌──────────────────┐
│   Backend API    │────────│   MySQL (8.0)    │
│ (Express)        │        │ Port: 3306       │
│ Port: 5000       │        │ Password: 123456 │
└────────┬─────────┘        └──────────────────┘
         │ Smart Contract
         │ Interactions
         ▼
┌──────────────────────────────────────────┐
│     Blockchain (Hardhat Local)           │
│  Port: 8545 (http://127.0.0.1:8545)     │
│  Chain ID: 31337                         │
│  Contracts:                              │
│    - TuneChain.sol (Music Management)   │
│    - TuneToken.sol (Token)              │
└──────────────────────────────────────────┘
```

---

## ⚙️ Cấu Hình Chi Tiết

### Frontend Configuration
```
📁 Frontend/
├── 🔌 Port: 5173
├── 🌐 Network: Hardhat Local (Chain ID: 31337)
├── 🔗 Blockchain RPC: http://127.0.0.1:8545
├── 📡 Backend API: http://localhost:5000
└── 🛠️ Build Tool: Vite
```

### Backend Configuration
```
📁 backend/
├── 🔌 Port: 5000
├── 🗄️  Database: MySQL
│   ├── Host: localhost
│   ├── Port: 3306
│   ├── User: root
│   └── Password: 123456
├── 📨 CORS Origin: http://localhost:5173
├── 🔗 Pinata API (IPFS)
│   ├── Needs: PINATA_API_KEY
│   └── Needs: PINATA_SECRET_API_KEY
└── 🛠️ Runtime: Node.js + Express
```

### Blockchain Configuration
```
📁 blockchain/
├── 🔌 Local RPC: http://127.0.0.1:8545
├── 🔗 Network: Hardhat Local Network
├── 📝 Solidity Version: 0.8.28
├── 📦 Dependencies:
│   ├── OpenZeppelin Contracts v5.6.1
│   ├── ethers v6.16.0
│   └── Hardhat v3.4.5
└── 🛠️ Compiler: Solidity 0.8.28
```

### Database Structure
```
MySQL Database: tunechain
├── track_views (Tổng lượt xem)
│   ├── id (PK)
│   ├── track_id (VARCHAR 100, UNIQUE)
│   ├── view_count (BIGINT)
│   ├── created_at
│   └── updated_at
│
└── view_logs (Lịch sử lượt xem - Rate Limit)
    ├── id (PK)
    ├── track_id (VARCHAR 100)
    ├── ip_address (VARCHAR 45)
    └── viewed_at (DATETIME)
```

---

## 🚀 Quy Trình Chạy

### Phase 1: Chuẩn Bị
```bash
npm install                    # Cài dependencies (1-2 phút)
```

### Phase 2: Khởi Động Blockchain
```bash
npm run node -w blockchain     # Mở Terminal #1
# Output: Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545
```

### Phase 3: Deploy Contracts
```bash
npm run deploy:local -w blockchain   # Mở Terminal #2
# Output: 
# TuneChain deployed to: 0x...
# TuneToken deployed to: 0x...
```

### Phase 4: Khởi Động Backend
```bash
npm run dev:backend            # Mở Terminal #3
# Output: 🚀 Server chạy tại: http://localhost:5000
```

### Phase 5: Khởi Động Frontend
```bash
npm run dev:frontend           # Mở Terminal #4
# Output: ➜  Local:   http://localhost:5173/
```

### Phase 6: Sử Dụng Application
```
1. Mở http://localhost:5173
2. Kết nối MetaMask (Chain ID: 31337)
3. Tận hưởng TuneChain! 🎉
```

---

## 📋 Danh Sách Port

| Service | Port | Purpose |
|---------|------|---------|
| Frontend | **5173** | Web Application (Vite Dev Server) |
| Backend API | **5000** | REST API (Express) |
| MySQL | **3306** | Database |
| Hardhat Node | **8545** | Blockchain RPC Endpoint |
| Hardhat Node (WebSocket) | **8545** | WebSocket Endpoint |

**⚠️ Lưu ý:** Đảm bảo các port này không bị chiếm bởi process khác!

---

## 🔌 API Endpoints (Backend)

### Health Check
```
GET /health
```

### View Tracking
```
POST /api/view
{
  "trackId": "track-123",
  "userId": "user-456"
}

GET /api/views/:trackId

POST /api/views/batch
{
  "trackIds": ["track-1", "track-2"]
}
```

### IPFS Upload
```
POST /api/upload/audio
{
  "audioBase64": "data:audio/mp3;base64,..."
}

POST /api/upload/metadata
{
  "title": "Song Name",
  "artist": "Artist Name"
}
```

---

## 🔐 Biến Môi Trường (Environment Variables)

### Backend `.env`
```
# Pinata IPFS API
PINATA_API_KEY=your_api_key_here
PINATA_SECRET_API_KEY=your_secret_key_here
PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs

# MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=123456
DB_NAME=tunechain

# View tracking
VIEW_RATE_LIMIT=5
VIEW_RATE_WINDOW_MS=3600000

# Server
PORT=5000
CORS_ORIGIN=http://localhost:5173
```

---

## 📊 Technology Stack

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Technology Stack                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Frontend Layer:                 Backend Layer:                     │
│  ├─ React 19.2.5                 ├─ Express 5.0.6                 │
│  ├─ TypeScript                   ├─ MySQL 8.0                     │
│  ├─ Vite 8.0.10                  ├─ TypeScript                    │
│  ├─ Tailwind CSS 4.2.4           ├─ Pinata SDK (IPFS)            │
│  ├─ ethers.js 6.16.0             ├─ dotenv                        │
│  └─ MetaMask                      └─ Express Rate Limit            │
│                                                                     │
│  Blockchain Layer:                                                  │
│  ├─ Hardhat 3.4.5                                                  │
│  ├─ Solidity 0.8.28                                                │
│  ├─ OpenZeppelin Contracts 5.6.1                                   │
│  ├─ ethers.js 6.16.0                                               │
│  └─ Mocha (Testing)                                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist Hoàn Thành Setup

- [ ] Node.js v18+ cài đặt
- [ ] npm v9+ cài đặt  
- [ ] MySQL 8.0 cài đặt (hoặc sẽ dùng Docker)
- [ ] `.env` backend cập nhật password
- [ ] `docker-compose.yml` cập nhật password
- [ ] `npm install` chạy thành công
- [ ] Hardhat node khởi động (Terminal #1)
- [ ] Contracts deployed (Terminal #2)
- [ ] Backend chạy (Terminal #3)
- [ ] Frontend chạy (Terminal #4)
- [ ] MetaMask kết nối Hardhat network
- [ ] Mở http://localhost:5173 thành công

---

## 🎯 Tiếp Theo

1. **Chạy project:** Xem [SETUP_GUIDE.md](./SETUP_GUIDE.md)
2. **Hiểu cấu trúc:** Đọc các README trong từng folder
3. **Deploy lên Sepolia testnet:** Cần INFURA_KEY + test ETH
4. **Deploy lên Mainnet:** Cần real ETH

---

**Good luck! 🚀**
