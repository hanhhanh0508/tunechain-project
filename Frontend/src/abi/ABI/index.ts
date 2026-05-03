// frontend/src/abi/index.ts
import TuneChainJson from "./TuneChain.json";
import TuneTokenJson from "./TuneToken.json";

// Địa chỉ contract — điền sau khi M1 deploy
export const TUNECHAIN_ADDRESS = import.meta.env.VITE_TUNECHAIN_ADDRESS as string;
export const TUNETOKEN_ADDRESS  = import.meta.env.VITE_TUNETOKEN_ADDRESS  as string;

// ABI thật từ Hardhat compile
export const TUNECHAIN_ABI = TuneChainJson.abi;
export const TUNETOKEN_ABI = TuneTokenJson.abi;

// ── Types dựa theo ABI thật ─────────────────────────────────────

export type TrackStruct = {
  trackId:   bigint;
  creator:   string;
  ipfsHash:  string;   // tên thật trong contract (không phải metaCID)
  title:     string;   // có thêm field title
  totalTips: bigint;
  isActive:  boolean;  // tên thật (không phải isHidden)
  createdAt: bigint;
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