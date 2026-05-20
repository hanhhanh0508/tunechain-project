// frontend/src/abi/ABI/index.ts
// Tự động cập nhật sau mỗi lần blockchain/scripts/deploy.ts chạy

import TuneChainJson from './TuneChain.json';
import TuneTokenJson from './TuneToken.json';

// ── Địa chỉ contract (điền vào .env sau khi deploy) ─────────────────────────
// Ưu tiên: VITE_TUNECHAIN_ADDRESS (deploy mới) > fallback hardhat local default
export const TUNECHAIN_ADDRESS = (
  import.meta.env.VITE_TUNECHAIN_ADDRESS as string
) ?? '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

export const TUNETOKEN_ADDRESS = (
  import.meta.env.VITE_TUNETOKEN_ADDRESS as string
) ?? '0x5FbDB2315678afecb367f032d93F642f64180aa3';

// ── ABI từ Hardhat compile ───────────────────────────────────────────────────
export const TUNECHAIN_ABI = TuneChainJson.abi;
export const TUNETOKEN_ABI = TuneTokenJson.abi;

// ── Types khớp với TuneChain.sol struct ─────────────────────────────────────

/**
 * Track struct trả về từ tracks(uint256) hoặc getAllActiveTracks()
 *  - trackId bắt đầu từ 1 (contract mới)
 *  - isActive = true  → bài đang hoạt động
 *  - isActive = false → bị admin deactivate
 */
export type TrackStruct = {
  trackId: bigint;
  creator: string;
  ipfsHash: string;   // CID IPFS
  title: string;      // Tên bài hát
  totalTips: bigint;  // Tổng TCT đang trong escrow
  isActive: boolean;  // true = active
  createdAt: bigint;  // unix timestamp
};

export type TipRecord = {
  tipper: string;
  trackId: bigint;
  amount: bigint;
  timestamp: bigint;
};

export type ReportRecord = {
  reportId: bigint;
  reporter: string;
  trackId: bigint;
  reason: string;
  resolved: boolean;
  createdAt: bigint;
};

export type EscrowInfo = {
  balance: bigint;
  unlockTime: bigint;
};

export type TxStatus = 'idle' | 'pending' | 'confirmed' | 'failed';