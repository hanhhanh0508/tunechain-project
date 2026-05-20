@echo off
REM ═══════════════════════════════════════════════════════════════════════════════
REM  TuneChain - Start All Services Script (Windows)
REM  Chạy toàn bộ services: Blockchain, Backend, Frontend
REM ═══════════════════════════════════════════════════════════════════════════════

setlocal enabledelayedexpansion

echo.
echo ╔═══════════════════════════════════════════════════════════════════════════════╗
echo ║                     🎵 TuneChain - Starting All Services                       ║
echo ╚═══════════════════════════════════════════════════════════════════════════════╝
echo.

REM Kiểm tra Node.js
echo [Step 1] Kiểm tra Node.js...
node -v >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js không được cài đặt!
    echo Vui lòng cài đặt từ: https://nodejs.org/
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION% OK
echo.

REM Kiểm tra npm
echo [Step 2] Kiểm tra npm...
npm -v >nul 2>&1
if errorlevel 1 (
    echo ❌ npm không được cài đặt!
    exit /b 1
)
for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo ✅ npm %NPM_VERSION% OK
echo.

REM Cài đặt dependencies
echo [Step 3] Cài đặt dependencies (lần đầu tiên sẽ mất khoảng 2-3 phút)...
if not exist "node_modules" (
    call npm install
    if errorlevel 1 (
        echo ❌ Lỗi cài đặt dependencies!
        exit /b 1
    )
    echo ✅ Dependencies cài đặt thành công
) else (
    echo ℹ️  Dependencies đã cài sẵn
)
echo.

REM Bắt đầu các services
echo [Step 4] Khởi động các services...
echo.
echo 📌 Hướng dẫn mở các terminal:
echo.
echo   Terminal #1 (Blockchain Node):
echo   ──────────────────────────────
echo   npm run node -w blockchain
echo   (RPC: http://127.0.0.1:8545)
echo.
echo   Terminal #2 (Deploy Contracts):
echo   ──────────────────────────────
echo   npm run deploy:local -w blockchain
echo.
echo   Terminal #3 (Backend):
echo   ──────────────────────
echo   npm run dev:backend
echo   (API: http://localhost:5000)
echo.
echo   Terminal #4 (Frontend):
echo   ──────────────────────
echo   npm run dev:frontend
echo   (Web: http://localhost:5173)
echo.
echo.
echo ═════════════════════════════════════════════════════════════════════════════════
echo 💡 Mẹo: Mở 4 terminal riêng rồi chạy từng lệnh ở trên!
echo.
echo 🔗 Sau khi đã chạy xong, hãy:
echo    1. Mở http://localhost:5173 trong trình duyệt
echo    2. Cài MetaMask extension nếu chưa có
echo    3. Kết nối MetaMask đến Hardhat network (Chain ID: 31337)
echo    4. Tận hưởng TuneChain! 🎉
echo ═════════════════════════════════════════════════════════════════════════════════
echo.

pause
