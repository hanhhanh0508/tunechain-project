// src/index.ts
// Entry point của backend server
// Khởi động Express, kết nối MySQL, đăng ký routes

import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { testConnection, initDatabase } from "./config/database";
import { testPinataConnection } from "./services/ipfsService";
import { startCleanupJob } from "./jobs/cleanupJob";
import viewRouter from "./api/viewApi";
import uploadRouter from "./api/uploadApi";

const app = express();

// ─── Middleware ────────────────────────────────────────────────────────────

// CORS - chỉ cho phép frontend gọi
app.use(cors({
  origin: env.corsOrigin,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Parse JSON body (tối đa 10mb để hỗ trợ upload audio dưới dạng base64)
app.use(express.json({ limit: "70mb" }));
app.use(express.urlencoded({ extended: true, limit: "70mb" }));

// ─── Routes ────────────────────────────────────────────────────────────────

// Health check - M2 gọi để kiểm tra server còn sống không
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "TuneChain Backend",
  });
});

// View counter API (thay Firebase)
app.use("/api", viewRouter);

// IPFS upload API (Pinata)
app.use("/api", uploadRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Endpoint không tồn tại" });
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
  } catch (err) {
    console.error("[FATAL] Không thể kết nối MySQL:", err);
    console.error("Kiểm tra lại DB_HOST, DB_USER, DB_PASSWORD trong .env");
    process.exit(1);
  }

  // 2. Kiểm tra Pinata (không fatal nếu lỗi - backend vẫn chạy)
  try {
    await testPinataConnection();
  } catch (err) {
    console.warn("[WARNING] Pinata API không kết nối được. Upload IPFS sẽ thất bại.");
    console.warn("Kiểm tra lại PINATA_API_KEY và PINATA_SECRET_API_KEY trong .env");
  }

  // 3. Khởi động cleanup job
  startCleanupJob();

  // 4. Lắng nghe port
  app.listen(env.port, () => {
    console.log("");
    console.log(`✅ Server đang chạy tại: http://localhost:${env.port}`);
    console.log("");
    console.log("📌 Các endpoint chính:");
    console.log(`   GET  http://localhost:${env.port}/health`);
    console.log(`   POST http://localhost:${env.port}/api/view`);
    console.log(`   GET  http://localhost:${env.port}/api/views/:trackId`);
    console.log(`   POST http://localhost:${env.port}/api/views/batch`);
    console.log(`   POST http://localhost:${env.port}/api/upload/audio`);
    console.log(`   POST http://localhost:${env.port}/api/upload/metadata`);
    console.log("");
    console.log("🔧 Test bằng curl:");
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