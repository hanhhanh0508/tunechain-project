# TuneChain — Hướng Dẫn Test (M4 Week 3)

**Dự án:** TuneChain — Web3 Music Platform  
**Stack:** Solidity 0.8.28 · Hardhat v3 · Ethers.js v6 · Chai v6 · TypeScript  
**Người soạn:** M4 — Tích hợp + Docs  
**Ngày:** 2026-05-17  

---

## 1. Cài Đặt

```bash
# Từ thư mục gốc dự án
cd blockchain-project-main

# Cài dependencies (nếu chưa có)
npm install
```

**Yêu cầu:** Node.js ≥ 18, npm ≥ 9.

---

## 2. Chạy Test

### Chạy toàn bộ test
```bash
npx hardhat test
```

### Chạy từng nhóm riêng lẻ
```bash
# Unit tests (3 hàm mới của tuần 3)
npx hardhat test test/TuneChain.test.ts

# E2E test (luồng đầy đủ Upload→Tip→Withdraw)
npx hardhat test test/e2e/fullFlow.test.ts

# Integration tests (Frontend↔Contract)
npx hardhat test test/integration/frontend-contract.test.ts

# Test skeleton tuần 1 (deploy + role check)
npx hardhat test test/integration.test.ts
```

### Chạy với coverage (nếu cài solidity-coverage)
```bash
npx hardhat test --coverage

```

---

## 3. Giải Thích Các Nhóm Test

### 3.1 Unit Tests — `test/TuneChain.test.ts`

Test từng hàm riêng lẻ, cô lập, deploy fresh contract cho mỗi test.

| Nhóm | Hàm | Số TC |
|------|-----|-------|
| `uploadTrack()` | Upload bài hát | 5 TC |
| `tipTrack()` | Tip ETH escrow | 5 TC |
| `withdrawTips()` | Rút ETH sau 24h | 7 TC |
| `getAllTracks()` | View function | 2 TC |

### 3.2 E2E Tests — `test/e2e/fullFlow.test.ts`

Mô phỏng luồng thực tế từ đầu đến cuối:

| Test | Mô tả |
|------|-------|
| E2E-01 | Deploy → Upload → Tip → Try withdraw (revert) → Wait 24h → Withdraw (success) |
| E2E-02 | Nhiều fan tip tích lũy → artist rút một lần |
| E2E-03 | Tip mới reset đồng hồ 24h → phải đợi lại |

### 3.3 Integration Tests — `test/integration/frontend-contract.test.ts`

Giả lập cách frontend React gọi contract (dùng Hardhat signer như MetaMask):

| Nhóm | Scenario |
|------|----------|
| UploadPage | uploadTrack() → txHash, event, navigation |
| DashboardPage | escrowBalance display, withdrawTips() sau 24h |
| HomePage | getAllTracks() → feed format, getCreatorTracks() filter |

---

## 4. Cấu Trúc Thư Mục Test

```
test/
├── TuneChain.test.ts              ← Unit tests (17 TC)
├── integration.test.ts            ← Skeleton tuần 1 (8 TC)
├── TuneToken.test.ts              ← TuneToken unit tests
├── e2e/
│   └── fullFlow.test.ts           ← E2E tests (3 TC)
└── integration/
    └── frontend-contract.test.ts  ← Frontend integration (11 TC)
```

---

## 5. Hàm Đã Implement (Tuần 3)

### `uploadTrack(string ipfsHash, string title)`
- Validate: `ipfsHash` và `title` không rỗng
- Tạo Track mới với `trackId` tăng dần
- Emit `TrackUploaded(trackId, creator, ipfsHash, title)`

### `tipTrack(uint256 trackId) payable`
- Validate: `msg.value > 0`, `trackId` hợp lệ, track đang active
- Cộng ETH vào `escrowBalance[trackId]`
- Cập nhật `lastTipTime[trackId]` (reset đồng hồ 24h)
- Emit `TipReceived(trackId, amount, sender)`

### `withdrawTips(uint256 trackId)`
- Validate: caller là creator, balance > 0, đã qua 24h
- Reset `escrowBalance[trackId] = 0` trước khi transfer (reentrancy safe)
- Transfer ETH về ví artist
- Emit `TipWithdrawn(creator, trackId, amount)`

---

## 6. Edge Cases Đã Cover

| # | Edge Case | Test |
|---|-----------|------|
| 1 | Upload với ipfsHash rỗng | TC-UT-04 |
| 2 | Upload với title rỗng | TC-UT-05 |
| 3 | Tip với `value = 0` | TC-TT-04 |
| 4 | Tip trackId không tồn tại | TC-TT-05 |
| 5 | Rút trước 24h | TC-WD-03 |
| 6 | Người không phải artist rút | TC-WD-04 |
| 7 | Rút khi balance = 0 | TC-WD-05 |
| 8 | Rút với trackId không tồn tại | TC-WD-06 |
| 9 | Tip mới reset đồng hồ 24h | E2E-03 |
| 10 | Rút ngay sau khi tip | E2E-01 (step 5) |
| 11 | Nhiều fan tip cùng một track | TC-TT-03, E2E-02 |
| 12 | getAllTracks() trả về mảng rỗng | TC-GT-01, INT-HP-02 |

---

## 7. Kỹ Thuật Test Đặc Biệt

### Time Manipulation (Hardhat)
```typescript
// Tăng thời gian blockchain thêm 24h + 1 giây
await network.provider.send("evm_increaseTime", [86401]);
await network.provider.send("evm_mine");
```
Dùng trong: TC-WD-01, TC-WD-02, E2E-01, E2E-02, E2E-03

### Balance Check
```typescript
const balanceBefore = await ethers.provider.getBalance(artist.address);
// ... thực hiện transaction ...
const receipt = await tx.wait();
const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
const balanceAfter = await ethers.provider.getBalance(artist.address);
expect(balanceAfter).to.equal(balanceBefore + tipAmount - gasUsed);
```

### Hardhat v3 Network API
```typescript
// Mỗi describe block tạo node ảo riêng biệt
const { ethers } = await network.create();
```

---

## 8. Ghi Chú

- **Hardhat v3** dùng `network.create()` thay vì `hre.ethers` (v2)
- Test file là **TypeScript** (`.test.ts`) để nhất quán với project
- `evm_increaseTime` chỉ hoạt động trên mạng Hardhat local, không phải `localhost` hoặc `sepolia`
- Contract dùng `nonReentrant` modifier để phòng reentrancy attack khi rút tiền

## 9. Kết Quả Coverage Thực Tế (Tuần 3)

Chạy lệnh: `npx hardhat test --coverage`

| File | Line % | Statement % | Đạt >80%? |
|---|---|---|---|
| Counter.sol | 100% | 100% | ✅ |
| TuneToken.sol | 100% | 100% | ✅ |
| TuneChain.sol | 96% | 95.12% | ✅ |
| **Tổng** | **96.61%** | **96%** | ✅ |

**Dòng chưa cover:** 307, 312 — là 2 hàm
`reportTrack` và `resolveReport` còn là skeleton
chưa implement, sẽ test ở tuần sau.

**Tổng số test:** 68 passing (3 Solidity + 65 Mocha)