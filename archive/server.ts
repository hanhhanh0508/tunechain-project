import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { startBlockchainListener } from '../backend/src/listeners/blockchainListener.js';

dotenv.config();
const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'tunechain'
});

// API endpoint xử lý tăng view theo đúng thuộc tính bảng của bạn
app.post('/api/tracks/:id/view', async (req, res) => {
    const trackId = req.params.id; // Chuỗi track_id nhận từ client
    const ipAddress = req.ip || '127.0.0.1';

    try {
        // Quy tắc BR-04: Kiểm tra chống spam trùng IP trong vòng 24 giờ qua bảng view_logs
        // Thuộc tính: track_id, ip_address, viewed_at
        const [recentViews]: any = await pool.execute(
            `SELECT id FROM view_logs 
             WHERE track_id = ? AND ip_address = ? AND viewed_at > NOW() - INTERVAL 1 DAY`,
            [trackId, ipAddress]
        );

        if (recentViews.length > 0) {
            // Nếu phát hiện IP này đã xem bài hát này trong 24 giờ, trả về số view hiện tại mà không tăng số đếm
            const [currentData]: any = await pool.execute(
                `SELECT view_count FROM track_views WHERE track_id = ?`, 
                [trackId]
            );
            return res.json({ 
                success: true, 
                viewCount: currentData[0]?.view_count || 0, 
                message: "Lượt xem trùng lặp trong 24h (Không tăng số đếm)" 
            });
        }

        // Lượt xem hợp lệ: 
        // 1. Ghi nhận log vào bảng view_logs (các cột: track_id, ip_address, viewed_at)
        await pool.execute(
            `INSERT INTO view_logs (track_id, ip_address, viewed_at) VALUES (?, ?, NOW())`,
            [trackId, ipAddress]
        );

        // 2. Tăng số đếm hoặc chèn mới vào bảng track_views (các cột: track_id, view_count, created_at, updated_at)
        await pool.execute(
            `INSERT INTO track_views (track_id, view_count, created_at, updated_at) 
             VALUES (?, 1, NOW(), NOW()) 
             ON DUPLICATE KEY UPDATE view_count = view_count + 1, updated_at = NOW()`,
            [trackId]
        );

        // Lấy số view mới nhất để phản hồi cho Frontend hiển thị real-time
        const [updatedData]: any = await pool.execute(
            `SELECT view_count FROM track_views WHERE track_id = ?`, 
            [trackId]
        );

        return res.json({ 
            success: true, 
            viewCount: updatedData[0]?.view_count || 1 
        });

    } catch (error) {
        console.error("❌ Lỗi xử lý cơ sở dữ liệu:", error);
        return res.status(500).json({ error: "Lỗi kết nối cơ sở dữ liệu máy chủ." });
    }
});

// API lấy số view hiện tại
app.get('/api/tracks/:id/views', async (req, res) => {
    try {
        const [rows]: any = await pool.execute(
            `SELECT view_count FROM track_views WHERE track_id = ?`, 
            [req.params.id]
        );
        return res.json({ viewCount: rows[0]?.view_count || 0 });
    } catch (e) {
        return res.status(500).json({ error: "Lỗi hệ thống." });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
    console.log(`🚀 [Backend Server] Đang chạy tại cổng ${PORT}`);
    // Kích hoạt Listener & Oracle chạy ngầm đồng thời
    await startBlockchainListener();
});