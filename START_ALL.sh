#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════════
# TuneChain - Start All Services Script (Mac/Linux)
# Chạy toàn bộ services: Blockchain, Backend, Frontend
# ═══════════════════════════════════════════════════════════════════════════════════

clear

echo ""
echo "╔═══════════════════════════════════════════════════════════════════════════════╗"
echo "║                     🎵 TuneChain - Starting All Services                       ║"
echo "╚═══════════════════════════════════════════════════════════════════════════════╝"
echo ""

# Kiểm tra Node.js
echo "[Step 1] Kiểm tra Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js không được cài đặt!"
    echo "Vui lòng cài đặt từ: https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node -v)
echo "✅ Node.js $NODE_VERSION OK"
echo ""

# Kiểm tra npm
echo "[Step 2] Kiểm tra npm..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm không được cài đặt!"
    exit 1
fi
NPM_VERSION=$(npm -v)
echo "✅ npm $NPM_VERSION OK"
echo ""

# Cài đặt dependencies
echo "[Step 3] Cài đặt dependencies (lần đầu tiên sẽ mất khoảng 2-3 phút)..."
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Lỗi cài đặt dependencies!"
        exit 1
    fi
    echo "✅ Dependencies cài đặt thành công"
else
    echo "ℹ️  Dependencies đã cài sẵn"
fi
echo ""

# Bắt đầu các services
echo "[Step 4] Khởi động các services..."
echo ""
echo "📌 Hướng dẫn mở các terminal:"
echo ""
echo "   Terminal #1 (Blockchain Node):"
echo "   ──────────────────────────────"
echo "   npm run node -w blockchain"
echo "   (RPC: http://127.0.0.1:8545)"
echo ""
echo "   Terminal #2 (Deploy Contracts):"
echo "   ──────────────────────────────"
echo "   npm run deploy:local -w blockchain"
echo ""
echo "   Terminal #3 (Backend):"
echo "   ──────────────────────"
echo "   npm run dev:backend"
echo "   (API: http://localhost:5000)"
echo ""
echo "   Terminal #4 (Frontend):"
echo "   ──────────────────────"
echo "   npm run dev:frontend"
echo "   (Web: http://localhost:5173)"
echo ""
echo ""
echo "═════════════════════════════════════════════════════════════════════════════════"
echo "💡 Mẹo: Mở 4 terminal riêng rồi chạy từng lệnh ở trên!"
echo ""
echo "🔗 Sau khi đã chạy xong, hãy:"
echo "   1. Mở http://localhost:5173 trong trình duyệt"
echo "   2. Cài MetaMask extension nếu chưa có"
echo "   3. Kết nối MetaMask đến Hardhat network (Chain ID: 31337)"
echo "   4. Tận hưởng TuneChain! 🎉"
echo "═════════════════════════════════════════════════════════════════════════════════"
echo ""
