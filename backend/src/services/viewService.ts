// src/services/viewService.ts
// Thay thế Firebase bằng MySQL
// Quản lý lượt xem track: đếm, kiểm tra rate-limit theo IP

import { pool } from "../config/database.js";
import { env } from "../config/env.js";
import { ResultSetHeader, RowDataPacket } from "mysql2";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrackViewRow extends RowDataPacket {
  track_id: string;
  view_count: number;
  updated_at: Date;
}

interface ViewLogRow extends RowDataPacket {
  count: number;
}

// ─── Hàm chính ────────────────────────────────────────────────────────────────

/**
 * Kiểm tra xem IP này đã xem track trong khoảng thời gian giới hạn chưa
 * Trả về true nếu đã vượt giới hạn (không cho tăng view)
 *
 * @param trackId  - ID của track
 * @param ip       - Địa chỉ IP người xem
 */
export async function isRateLimited(trackId: string, ip: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - env.viewRateWindowMs);

  const [rows] = await pool.execute<ViewLogRow[]>(
    `SELECT COUNT(*) AS count
     FROM view_logs
     WHERE track_id = ? AND ip_address = ? AND viewed_at > ?`,
    [trackId, ip, windowStart]
  );

  const count = rows[0]?.count ?? 0;
  return count >= env.viewRateLimit;
}

/**
 * Tăng lượt xem cho một track
 * - Ghi log vào view_logs (để rate-limit)
 * - Upsert vào track_views (tạo mới nếu chưa có, tăng nếu đã có)
 *
 * @param trackId  - ID của track
 * @param ip       - Địa chỉ IP người xem
 * @returns        - Tổng số view sau khi tăng
 */
export async function incrementView(trackId: string, ip: string): Promise<number> {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Ghi log lượt xem này
    await conn.execute(
      `INSERT INTO view_logs (track_id, ip_address) VALUES (?, ?)`,
      [trackId, ip]
    );

    // 2. Tăng view_count (INSERT nếu chưa có, UPDATE nếu đã có)
    await conn.execute<ResultSetHeader>(
      `INSERT INTO track_views (track_id, view_count)
       VALUES (?, 1)
       ON DUPLICATE KEY UPDATE view_count = view_count + 1`,
      [trackId]
    );

    // 3. Lấy tổng view hiện tại
    const [rows] = await conn.execute<TrackViewRow[]>(
      `SELECT view_count FROM track_views WHERE track_id = ?`,
      [trackId]
    );

    await conn.commit();

    return rows[0]?.view_count ?? 1;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

/**
 * Lấy tổng số lượt xem của một track
 * Trả về 0 nếu track chưa có lượt xem nào
 *
 * @param trackId  - ID của track
 */
export async function getViewCount(trackId: string): Promise<number> {
  const [rows] = await pool.execute<TrackViewRow[]>(
    `SELECT view_count FROM track_views WHERE track_id = ?`,
    [trackId]
  );

  return rows[0]?.view_count ?? 0;
}

/**
 * Lấy view count của nhiều track cùng lúc (cho trang Home hiển thị danh sách)
 * Trả về object { trackId: viewCount }
 *
 * @param trackIds - Mảng các track ID
 */
export async function getMultipleViewCounts(
  trackIds: string[]
): Promise<Record<string, number>> {
  if (trackIds.length === 0) return {};

  // Tạo placeholders: ?, ?, ?
  const placeholders = trackIds.map(() => "?").join(", ");

  const [rows] = await pool.execute<TrackViewRow[]>(
    `SELECT track_id, view_count FROM track_views WHERE track_id IN (${placeholders})`,
    trackIds
  );

  // Chuyển thành object
  const result: Record<string, number> = {};

  // Gán 0 cho tất cả trước
  for (const id of trackIds) {
    result[id] = 0;
  }

  // Gán giá trị thực nếu có
  for (const row of rows) {
    result[row.track_id] = row.view_count;
  }

  return result;
}

/**
 * Dọn dẹp log cũ (chạy định kỳ để tránh bảng view_logs phình to)
 * Xoá các log cũ hơn khoảng rate-limit window
 */
export async function cleanupOldLogs(): Promise<number> {
  const cutoff = new Date(Date.now() - env.viewRateWindowMs * 2);

  const [result] = await pool.execute<ResultSetHeader>(
    `DELETE FROM view_logs WHERE viewed_at < ?`,
    [cutoff]
  );

  return result.affectedRows;
}