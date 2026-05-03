// src/jobs/cleanupJob.ts
// Job chạy định kỳ để dọn dẹp bảng view_logs (xoá log cũ)
// Tránh bảng phình quá to sau nhiều tháng sử dụng

import { cleanupOldLogs } from "../services/viewService.js";

/**
 * Khởi động job dọn dẹp định kỳ
 * Mặc định chạy mỗi 6 giờ
 */
export function startCleanupJob(intervalMs = 6 * 60 * 60 * 1000): void {
  console.log("[Job] Khởi động cleanup job (mỗi 6 giờ)");

  // Chạy ngay lần đầu sau 30 giây
  setTimeout(async () => {
    await runCleanup();
  }, 30_000);

  // Sau đó chạy định kỳ
  setInterval(async () => {
    await runCleanup();
  }, intervalMs);
}

async function runCleanup(): Promise<void> {
  try {
    const deleted = await cleanupOldLogs();
    if (deleted > 0) {
      console.log(`[Job] Đã xoá ${deleted} log cũ khỏi view_logs`);
    }
  } catch (error) {
    console.error("[Job] Lỗi cleanup:", error);
  }
}