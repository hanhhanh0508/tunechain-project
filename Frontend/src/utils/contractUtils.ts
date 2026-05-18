// frontend/src/utils/contractUtils.ts
// Kết nối frontend với TuneChain + TuneToken qua ethers.js v6

import { BrowserProvider, Contract, formatUnits, parseUnits } from "ethers";
import type { Signer } from "ethers";
import {
  TUNECHAIN_ABI, TUNECHAIN_ADDRESS,
  TUNETOKEN_ABI,  TUNETOKEN_ADDRESS,
} from "../abi/ABI/index";

// ─────────────────────────────────────────────────────────────
// 1. Provider & Signer
// ─────────────────────────────────────────────────────────────

export async function getProvider(): Promise<BrowserProvider> {
  if (!window.ethereum) {
    throw new Error("MetaMask chưa cài — vui lòng cài extension MetaMask");
  }
  return new BrowserProvider(window.ethereum);
}

export async function getSigner(): Promise<Signer> {
  const provider = await getProvider();
  return provider.getSigner();
}

// ─────────────────────────────────────────────────────────────
// 2. Contract instances
// ─────────────────────────────────────────────────────────────

export async function getTuneChain(withSigner = false): Promise<Contract> {
  const provider = await getProvider();
  const runner   = withSigner ? await getSigner() : provider;
  return new Contract(TUNECHAIN_ADDRESS, TUNECHAIN_ABI, runner);
}

export async function getTuneToken(withSigner = false): Promise<Contract> {
  const provider = await getProvider();
  const runner   = withSigner ? await getSigner() : provider;
  return new Contract(TUNETOKEN_ADDRESS, TUNETOKEN_ABI, runner);
}

// ─────────────────────────────────────────────────────────────
// 3. READ functions — không tốn gas
// ─────────────────────────────────────────────────────────────

/**
 * Lấy thông tin 1 track theo trackId
 * Trả về: { trackId, creator, ipfsHash, title, totalTips, isActive, createdAt }
 */
export async function getTrack(trackId: number) {
  const contract = await getTuneChain();
  return await contract.tracks(trackId);
}

/**
 * Lấy số lượng track tiếp theo (= tổng số track đã tạo + 1)
 * Track ID bắt đầu từ 1.
 */
export async function getNextTrackId(): Promise<number> {
  const contract = await getTuneChain();
  const raw = await contract.nextTrackId();
  return Number(raw);
}

/**
 * Lấy tất cả track đang active — dùng hàm getAllActiveTracks() trên contract
 */
export async function getAllActiveTracks() {
  const contract = await getTuneChain();
  return await contract.getAllActiveTracks();
}

/**
 * Lấy danh sách trackId của 1 creator
 */
export async function getCreatorTrackIds(creatorAddress: string): Promise<number[]> {
  const contract = await getTuneChain();
  const ids = await contract.getCreatorTracks(creatorAddress);
  return ids.map(Number);
}

/**
 * Số dư TCT trong ví của 1 địa chỉ
 */
export async function getTCTBalance(address: string): Promise<string> {
  const token = await getTuneToken();
  const raw   = await token.balanceOf(address);
  return formatUnits(raw, 18); // "100.0"
}

/**
 * Lấy thông tin 1 tip record
 * Trả về: { tipper, trackId, amount, timestamp }
 */
export async function getTipRecord(tipId: number) {
  const contract = await getTuneChain();
  return await contract.tipRecords(tipId);
}

/**
 * Số lượng report của 1 track
 */
export async function getReportCount(trackId: number): Promise<number> {
  const contract = await getTuneChain();
  const raw = await contract.reportCount(trackId);
  return Number(raw);
}

/**
 * Lấy thông tin 1 report
 * Trả về: { reportId, reporter, trackId, reason, resolved, createdAt }
 */
export async function getReport(reportId: number) {
  const contract = await getTuneChain();
  return await contract.reports(reportId);
}

/**
 * Lấy thông tin escrow của creator
 * Trả về: { balance: bigint, unlockTime: bigint }
 */
export async function getEscrowInfo(creatorAddress: string): Promise<{ balance: bigint; unlockTime: bigint }> {
  const contract = await getTuneChain();
  const [balance, unlockTime] = await contract.getEscrowInfo(creatorAddress);
  return { balance, unlockTime };
}

/**
 * Kiểm tra creator có thể rút tips ngay không
 */
export async function canWithdraw(creatorAddress: string): Promise<boolean> {
  const contract = await getTuneChain();
  return await contract.canWithdraw(creatorAddress);
}

/**
 * Kiểm tra địa chỉ có ADMIN_ROLE không
 */
export async function isAdmin(address: string): Promise<boolean> {
  const contract  = await getTuneChain();
  const ADMIN_ROLE = await contract.ADMIN_ROLE();
  return await contract.hasRole(ADMIN_ROLE, address);
}

// ─────────────────────────────────────────────────────────────
// 4. WRITE functions — cần MetaMask ký
// ─────────────────────────────────────────────────────────────

/**
 * UC-02: Creator upload track mới.
 * @param ipfsHash CID file nhạc/metadata trên IPFS
 * @param title    Tiêu đề bài hát
 *
 * Phí upload: 10 TCT (approve trước khi gọi).
 * Event: TrackUploaded(trackId, creator, ipfsHash, title)
 */
export async function uploadTrack(ipfsHash: string, title: string) {
  const contract = await getTuneChain(true);
  const token    = await getTuneToken(true);
  const signer   = await getSigner();
  const address  = await signer.getAddress();

  // Auto-approve nếu chưa đủ allowance
  const uploadFee = parseUnits("10", 18); // 10 TCT
  const allowance = await token.allowance(address, TUNECHAIN_ADDRESS);
  if (allowance < uploadFee) {
    const approveTx = await token.approve(TUNECHAIN_ADDRESS, uploadFee);
    await approveTx.wait();
  }

  const tx = await contract.uploadTrack(ipfsHash, title);
  return await tx.wait();
}

/**
 * UC-04: Listener tip TCT cho tác giả.
 * @param trackId   ID của bài hát
 * @param amountTCT Số TCT dưới dạng string (ví dụ: "10.5")
 *
 * Token bị khóa escrow 24h trong contract.
 * Event: TrackTipped(tipId, trackId, tipper, amount)
 */
export async function tipTrack(trackId: number, amountTCT: string) {
  const contract = await getTuneChain(true);
  const token    = await getTuneToken(true);
  const signer   = await getSigner();
  const address  = await signer.getAddress();
  const amount   = parseUnits(amountTCT, 18);

  // Approve nếu chưa đủ allowance
  const allowance = await token.allowance(address, TUNECHAIN_ADDRESS);
  if (allowance < amount) {
    const approveTx = await token.approve(TUNECHAIN_ADDRESS, amount);
    await approveTx.wait();
  }

  const tx = await contract.tipTrack(trackId, amount);
  return await tx.wait();
}

/**
 * UC-05: Creator rút tất cả tips đã unlock (sau 24h kể từ tip cuối).
 * Event: TipWithdrawn(creator, amount)
 */
export async function withdrawTips() {
  const contract = await getTuneChain(true);
  const tx = await contract.withdrawTips();
  return await tx.wait();
}

/**
 * UC-06: Report vi phạm bản quyền.
 * @param trackId ID của bài hát
 * @param reason  Lý do báo cáo (bắt buộc)
 *
 * Event: TrackReported(reportId, reporter, trackId)
 */
export async function reportTrack(trackId: number, reason: string) {
  const contract = await getTuneChain(true);
  const tx = await contract.reportTrack(trackId, reason);
  return await tx.wait();
}

/**
 * Admin resolve report (chỉ ADMIN_ROLE mới gọi được).
 * @param reportId ID của report
 * @param removed  true = ẩn track; false = bác bỏ report
 *
 * Event: ReportResolved(reportId, removed)
 * Nếu removed=true: TrackDeactivated(trackId) cũng được emit
 */
export async function resolveReport(reportId: number, removed: boolean) {
  const contract = await getTuneChain(true);
  const tx = await contract.resolveReport(reportId, removed);
  return await tx.wait();
}

// ─────────────────────────────────────────────────────────────
// 5. TuneToken — mint TCT cho testing
// ─────────────────────────────────────────────────────────────

/**
 * Mint TCT cho 1 địa chỉ (chỉ owner TuneToken mới gọi được)
 */
export async function mintTCT(toAddress: string, amountTCT: string) {
  const token  = await getTuneToken(true);
  const amount = parseUnits(amountTCT, 18);
  const tx = await token.mint(toAddress, amount);
  return await tx.wait();
}

// ─────────────────────────────────────────────────────────────
// 6. Network helpers
// ─────────────────────────────────────────────────────────────

export const HARDHAT_CHAIN_ID = 31337;
export const SEPOLIA_CHAIN_ID = 11155111;

export async function checkAndSwitchNetwork(targetChainId = HARDHAT_CHAIN_ID) {
  const provider = await getProvider();
  const network  = await provider.getNetwork();

  if (Number(network.chainId) !== targetChainId) {
    const ethereum = window.ethereum;
    if (!ethereum) {
      throw new Error("MetaMask chưa cài — không thể chuyển network");
    }

    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${targetChainId.toString(16)}` }],
    });
  }
}

/**
 * Lấy địa chỉ ví hiện tại đang kết nối
 */
export async function getCurrentAddress(): Promise<string> {
  const signer = await getSigner();
  return signer.getAddress();
}