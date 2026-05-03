// src/api/viewApi.ts
// Express router cho các endpoint quản lý lượt xem
//
// Endpoints:
//   POST /view           - Tăng view (có kiểm tra rate-limit theo IP)
//   GET  /views/:trackId - Lấy tổng view của một track
//   POST /views/batch    - Lấy view của nhiều track (cho trang Home)

import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import {
  incrementView,
  getViewCount,
  getMultipleViewCounts,
  isRateLimited,
} from "../services/viewService";
import { env } from "../config/env";

const router = Router();

// ─── Middleware rate-limit toàn cục cho /view ──────────────────────────────
// Đây là rate-limit của express-rate-limit (bảo vệ ở tầng HTTP)
// Ngoài ra còn có rate-limit theo business logic trong viewService.ts
const viewLimiter = rateLimit({
  windowMs: env.viewRateWindowMs,   // ví dụ: 1 giờ
  max: env.viewRateLimit * 10,      // cho phép nhiều hơn một chút ở tầng HTTP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Quá nhiều yêu cầu. Vui lòng thử lại sau.",
  },
});

// ─── Hàm lấy IP thực của client ───────────────────────────────────────────
// Xử lý cả trường hợp đứng sau proxy/nginx
function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress ?? "unknown";
}

// ─── POST /view ────────────────────────────────────────────────────────────
/**
 * Tăng lượt xem cho một track
 *
 * Body: { trackId: string }
 *
 * Response 200: { success: true, viewCount: number }
 * Response 429: { success: false, error: "Rate limit" } - đã xem quá nhiều lần
 * Response 400: { success: false, error: "..." }       - thiếu trackId
 */
router.post("/view", viewLimiter, async (req: Request, res: Response) => {
  try {
    const { trackId } = req.body as { trackId?: string };

    // Validate input
    if (!trackId || typeof trackId !== "string" || trackId.trim() === "") {
      res.status(400).json({
        success: false,
        error: "trackId không hợp lệ hoặc bị thiếu",
      });
      return;
    }

    const cleanTrackId = trackId.trim();
    const ip = getClientIp(req);

    // Kiểm tra rate-limit theo business logic (trong DB)
    const limited = await isRateLimited(cleanTrackId, ip);
    if (limited) {
      res.status(429).json({
        success: false,
        error: `Bạn đã xem track này quá ${env.viewRateLimit} lần trong ${env.viewRateWindowMs / 3600000} giờ qua`,
      });
      return;
    }

    // Tăng view và trả về tổng mới
    const viewCount = await incrementView(cleanTrackId, ip);

    res.status(200).json({
      success: true,
      trackId: cleanTrackId,
      viewCount,
    });
  } catch (error) {
    console.error("[viewApi] Lỗi POST /view:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi server nội bộ",
    });
  }
});

// ─── GET /views/:trackId ───────────────────────────────────────────────────
/**
 * Lấy tổng lượt xem của một track
 *
 * Params: trackId
 *
 * Response 200: { success: true, trackId: string, viewCount: number }
 */
router.get("/views/:trackId", async (req: Request, res: Response) => {
  try {
    const { trackId } = req.params;

    if (!trackId || trackId.trim() === "") {
      res.status(400).json({
        success: false,
        error: "trackId không hợp lệ",
      });
      return;
    }

    const viewCount = await getViewCount(trackId.trim());

    res.status(200).json({
      success: true,
      trackId: trackId.trim(),
      viewCount,
    });
  } catch (error) {
    console.error("[viewApi] Lỗi GET /views/:trackId:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi server nội bộ",
    });
  }
});

// ─── POST /views/batch ─────────────────────────────────────────────────────
/**
 * Lấy view count của nhiều track cùng lúc
 * Dùng cho trang Home để không phải gọi nhiều request
 *
 * Body: { trackIds: string[] }
 *
 * Response 200: { success: true, views: { [trackId]: number } }
 */
router.post("/views/batch", async (req: Request, res: Response) => {
  try {
    const { trackIds } = req.body as { trackIds?: string[] };

    if (!Array.isArray(trackIds) || trackIds.length === 0) {
      res.status(400).json({
        success: false,
        error: "trackIds phải là mảng không rỗng",
      });
      return;
    }

    // Giới hạn tối đa 100 track một lần
    if (trackIds.length > 100) {
      res.status(400).json({
        success: false,
        error: "Tối đa 100 trackId mỗi request",
      });
      return;
    }

    const views = await getMultipleViewCounts(trackIds);

    res.status(200).json({
      success: true,
      views,
    });
  } catch (error) {
    console.error("[viewApi] Lỗi POST /views/batch:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi server nội bộ",
    });
  }
});

export default router;