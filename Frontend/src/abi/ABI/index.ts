// frontend/src/abi/ABI/index.ts
// Tự động cập nhật sau mỗi lần M1 deploy + copy ABI

import TuneChainJson from "./TuneChain.json";
import TuneTokenJson from "./TuneToken.json";

// ── Địa chỉ contract (điền vào .env sau khi deploy) ─────────────
export const TUNECHAIN_ADDRESS = import.meta.env.VITE_TUNECHAIN_ADDRESS as string;
export const TUNETOKEN_ADDRESS  = import.meta.env.VITE_TUNETOKEN_ADDRESS  as string;

// ── ABI từ Hardhat compile ────────────────────────────────────────
export const TUNECHAIN_ABI = TuneChainJson.abi;
export const TUNETOKEN_ABI = TuneTokenJson.abi;

// ── Types khớp với TuneChain.sol struct ──────────────────────────

/**
 * Track struct trả về từ tracks(uint256)
 *  - isActive = true  → bài đang hoạt động
 *  - isActive = false → bị admin deactivate
 */
export type TrackStruct = {
  trackId:   bigint;
  creator:   string;
  ipfsHash:  string;   // CID IPFS
  title:     string;   // Tên bài hát
  totalTips: bigint;   // Tổng TCT đang trong escrow
  isActive:  boolean;  // true = active
  createdAt: bigint;   // unix timestamp
};

export type TipRecord = {
  tipper:    string;
  trackId:   bigint;
  amount:    bigint;
  timestamp: bigint;
};

export type ReportRecord = {
  reportId:  bigint;
  reporter:  string;
  trackId:   bigint;
  reason:    string;
  resolved:  boolean;
  createdAt: bigint;
};

export type TxStatus = "idle" | "pending" | "confirmed" | "failed";