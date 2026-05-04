// src/index.ts
// Entry point của backend server
// Khởi động Express, kết nối MySQL, đăng ký routes

import express, { Request, Response } from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { testConnection, initDatabase } from "./config/database.js";
import { testPinataConnection } from "./services/ipfsService.js";
import { startCleanupJob } from "./jobs/cleanupJob.js";
import viewRouter from "./api/viewApi.js";
import uploadRouter from "./api/uploadApi.js";

const app = express();

// ─── Middleware ────────────────────────────────────────────────────────────

// CORS - chỉ cho phép frontend gọi
app.use(cors({
  origin: env.corsOrigin,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Parse JSON body (tối đa 70mb để hỗ trợ upload audio base64)
app.use(express.json({ limit: "70mb" }));
app.use(express.urlencoded({ extended: true, limit: "70mb" }));

// ─── Routes ────────────────────────────────────────────────────────────────

// Health check - kiểm tra server còn sống không
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "TuneChain Backend",
  });
});

// View counter API
app.use("/api", viewRouter);

// IPFS upload API
app.use("/api", uploadRouter);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "Endpoint không tồn tại",
  });
});

// ─── Khởi động server ──────────────────────────────────────────────────────

async function bootstrap(): Promise<void> {
  console.log("=".repeat(50));
  console.log("  TuneChain Backend - Đang khởi động...");
  console.log("=".repeat(50));

  // 1. Kết nối MySQL
  try {
    await testConnection();
    await initDatabase();
    console.log("✅ Kết nối MySQL thành công");
  } catch (err) {
    console.error("[FATAL] Không thể kết nối MySQL:", err);
    console.error("Kiểm tra lại DB_HOST, DB_USER, DB_PASSWORD trong .env");
    process.exit(1);
  }

  // 2. Kiểm tra Pinata (không fatal)
  try {
    await testPinataConnection();
    console.log("✅ Pinata OK");
  } catch (err) {
    console.warn("⚠️ Pinata API không kết nối được");
    console.warn("Upload IPFS có thể thất bại");
  }

  // 3. Khởi động cleanup job
  startCleanupJob();
  console.log("🧹 Cleanup job started");

  // 4. Start server
  app.listen(env.port, () => {
    console.log("");
    console.log(`🚀 Server chạy tại: http://localhost:${env.port}`);
    console.log("");
    console.log("📌 Endpoint:");
    console.log(`   GET  /health`);
    console.log(`   POST /api/view`);
    console.log(`   GET  /api/views/:trackId`);
    console.log(`   POST /api/views/batch`);
    console.log(`   POST /api/upload/audio`);
    console.log(`   POST /api/upload/metadata`);
    console.log("");
    console.log("🔧 Test:");
    console.log(`   curl -X POST http://localhost:${env.port}/api/view \\`);
    console.log(`        -H "Content-Type: application/json" \\`);
    console.log(`        -d '{"trackId":"1"}'`);
    console.log("=".repeat(50));
  });
}

bootstrap().catch((err) => {
  console.error("[FATAL] Khởi động thất bại:", err);
  process.exit(1);
});
