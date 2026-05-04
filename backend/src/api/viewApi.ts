// src/api/viewApi.ts

import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import {
  incrementView,
  getViewCount,
  getMultipleViewCounts,
  isRateLimited,
} from "../services/viewService.js";
import { env } from "../config/env.js";

const router = Router();

// ─── Middleware rate-limit ─────────────────────────────────────────────────
const viewLimiter = rateLimit({
  windowMs: env.viewRateWindowMs,
  max: env.viewRateLimit * 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Quá nhiều yêu cầu. Vui lòng thử lại sau.",
  },
});

// ─── Lấy IP client ─────────────────────────────────────────────────────────
function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress ?? "unknown";
}

// ─── POST /view ────────────────────────────────────────────────────────────
router.post("/view", viewLimiter, async (req: Request, res: Response) => {
  try {
    const { trackId } = req.body as { trackId?: string };

    if (!trackId || typeof trackId !== "string" || trackId.trim() === "") {
      res.status(400).json({
        success: false,
        error: "trackId không hợp lệ hoặc bị thiếu",
      });
      return;
    }

    const cleanTrackId = trackId.trim();
    const ip = getClientIp(req);

    const limited = await isRateLimited(cleanTrackId, ip);
    if (limited) {
      res.status(429).json({
        success: false,
        error: `Bạn đã xem track này quá ${env.viewRateLimit} lần trong ${env.viewRateWindowMs / 3600000} giờ qua`,
      });
      return;
    }

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
router.get(
  "/views/:trackId",
  async (req: Request<{ trackId: string }>, res: Response) => {
    try {
      const { trackId } = req.params;

      if (!trackId || trackId.trim() === "") {
        res.status(400).json({
          success: false,
          error: "trackId không hợp lệ",
        });
        return;
      }

      const cleanTrackId = trackId.trim();
      const viewCount = await getViewCount(cleanTrackId);

      res.status(200).json({
        success: true,
        trackId: cleanTrackId,
        viewCount,
      });
    } catch (error) {
      console.error("[viewApi] Lỗi GET /views/:trackId:", error);
      res.status(500).json({
        success: false,
        error: "Lỗi server nội bộ",
      });
    }
  }
);

// ─── POST /views/batch ─────────────────────────────────────────────────────
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
