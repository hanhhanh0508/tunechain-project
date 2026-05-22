import { ethers } from 'ethers';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'tunechain'
});

const TUNECHAIN_ABI = [
    "event TrackUploaded(uint256 indexed trackId, address indexed creator, string title, string ipfsHash, string imgHash, uint256 timestamp)",
    "function syncViews(uint256 trackId, uint256 views) external"
];

const CONTRACT_ADDRESS = process.env.TUNECHAIN_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const RPC_URL = process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545";
const ORACLE_PRIVATE_KEY = process.env.ORACLE_PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

export async function startBlockchainListener() {
    console.log("📡 [TuneChain Listener] Khởi động bộ lắng nghe khớp cấu trúc MySQL mới...");
    
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(ORACLE_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, TUNECHAIN_ABI, provider);
    const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESS, TUNECHAIN_ABI, wallet);

    // Lắng nghe sự kiện Upload từ Smart Contract để khởi tạo hàng trong track_views
    contract.on("TrackUploaded", async (trackId, creator, title, ipfsHash, imgHash, timestamp) => {
        const trackIdStr = trackId.toString();
        console.log(`🎵 Event nhận được: TrackUploaded | ID: ${trackIdStr}`);
        try {
            // Khởi tạo thông tin view ban đầu = 0 vào bảng track_views của bạn
            // Khớp cột: track_id, view_count, created_at, updated_at
            await dbPool.execute(
                `INSERT INTO track_views (track_id, view_count, created_at, updated_at) 
                 VALUES (?, 0, NOW(), NOW()) 
                 ON DUPLICATE KEY UPDATE updated_at = NOW()`,
                [trackIdStr]
            );
            console.log(`✅ Đã khởi tạo bộ đếm view cho track_id: ${trackIdStr} trong MySQL.`);
        } catch (error) {
            console.error("❌ Lỗi khi chèn dữ liệu vào bảng track_views:", error);
        }
    });

    // Oracle Cron Job: Định kỳ 10 phút đồng bộ số lượng view từ MySQL lên Blockchain
    setInterval(async () => {
        console.log("⏱️ [Oracle Job] Quét dữ liệu view để đồng bộ lên Blockchain...");
        try {
            // Lấy toàn bộ track có lượt xem lớn hơn 0 để đồng bộ định kỳ
            const [rows]: any = await dbPool.execute(
                `SELECT track_id, view_count FROM track_views WHERE view_count > 0`
            );

            for (const row of rows) {
                console.log(`⚙️ Sync on-chain cho track ${row.track_id} -> ${row.view_count} views`);
                // Gọi hàm Smart Contract
                const tx = await contractWithSigner.syncViews(row.track_id, row.view_count);
                await tx.wait();
            }
            console.log("✅ Hoàn thành chu kỳ đồng bộ view lên Blockchain.");
        } catch (error) {
            console.error("❌ Lỗi Oracle Job:", error);
        }
    }, 10 * 60 * 1000);
}