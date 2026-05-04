// src/config/database.ts
// Kết nối MySQL và khởi tạo bảng nếu chưa có

import mysql from "mysql2/promise";
import { env } from "./env.js";

// Tạo connection pool (dùng chung cho toàn app, hiệu quả hơn tạo mới mỗi request)
export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.name,
  waitForConnections: true,
  connectionLimit: 10,   // tối đa 10 connection đồng thời
  queueLimit: 0,
});

/**
 * Kiểm tra kết nối MySQL có hoạt động không
 */
export async function testConnection(): Promise<void> {
  const conn = await pool.getConnection();
  console.log("[DB] Kết nối MySQL thành công!");
  conn.release();
}

/**
 * Tạo các bảng cần thiết nếu chưa tồn tại
 * Chạy một lần khi khởi động server
 */
export async function initDatabase(): Promise<void> {
  const conn = await pool.getConnection();

  try {
    // Bảng lưu tổng lượt xem của từng track
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS track_views (
        id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        track_id    VARCHAR(100) NOT NULL UNIQUE,  -- ID track trên blockchain
        view_count  BIGINT UNSIGNED NOT NULL DEFAULT 0,
        created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_track_id (track_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Bảng lưu lịch sử từng lượt xem (để rate-limit theo IP)
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS view_logs (
        id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        track_id    VARCHAR(100) NOT NULL,
        ip_address  VARCHAR(45) NOT NULL,           -- IPv4 hoặc IPv6
        viewed_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_track_ip (track_id, ip_address),
        INDEX idx_viewed_at (viewed_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log("[DB] Khởi tạo bảng thành công (track_views, view_logs)");
  } finally {
    conn.release();
  }
}