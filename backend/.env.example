// src/config/env.ts
// Đọc và validate biến môi trường từ file .env

import dotenv from "dotenv";
dotenv.config();

// Hàm lấy biến môi trường bắt buộc - sẽ crash ngay nếu thiếu
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`[ENV] Thiếu biến môi trường bắt buộc: ${key}`);
  }
  return value;
}

export const env = {
  // Pinata (IPFS)
  pinataApiKey: requireEnv("PINATA_API_KEY"),
  pinataSecretKey: requireEnv("PINATA_SECRET_API_KEY"),
  pinataGateway: process.env.PINATA_GATEWAY ?? "https://gateway.pinata.cloud/ipfs",

  // MySQL
  db: {
    host: process.env.DB_HOST ?? "localhost",
    port: parseInt(process.env.DB_PORT ?? "3306"),
    user: process.env.DB_USER ?? "root",
    password: requireEnv("123456"),
    name: process.env.DB_NAME ?? "tunechain",
  },

  // Server
  port: parseInt(process.env.PORT ?? "4000"),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",

  // Rate limit cho endpoint /view
  viewRateLimit: parseInt(process.env.VIEW_RATE_LIMIT ?? "5"),
  viewRateWindowMs: parseInt(process.env.VIEW_RATE_WINDOW_MS ?? "3600000"),
};