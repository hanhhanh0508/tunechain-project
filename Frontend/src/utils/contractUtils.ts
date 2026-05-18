// frontend/src/utils/contractUtils.ts
import { ethers, BrowserProvider, Contract, formatUnits, parseUnits } from "ethers";
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
 * Dùng mapping tracks(uint) — trả về TrackStruct
 */
export async function getTrack(trackId: number) {
  const contract = await getTuneChain();
  return await contract.tracks(trackId);
  // Trả về: { trackId, creator, ipfsHash, title, totalTips, isActive, createdAt }
}

/**
 * Lấy số lượng track tiếp theo (= tổng số track đã upload)
 * Dùng để loop lấy tất cả tracks
 */
export async function getNextTrackId(): Promise<number> {
  const contract = await getTuneChain();
  const raw = await contract.nextTrackId();
  return Number(raw);
}

/**
 * Lấy tất cả tracks đang active (isActive = true)
 * Contract không có getAllTracks() — phải tự loop
 */
export async function getAllActiveTracks() {
  const contract  = await getTuneChain();
  const nextId    = await contract.nextTrackId();
  const total     = Number(nextId);
  const tracks    = [];

  for (let i = 1; i < total; i++) {
    const track = await contract.tracks(i);
    if (track.isActive) {
      tracks.push(track);
    }
  }
  return tracks;
}

/**
 * Lấy danh sách trackId của 1 creator
 * Dùng mapping creatorTracks(address, index)
 */
export async function getCreatorTrackIds(creatorAddress: string): Promise<number[]> {
  const contract = await getTuneChain();
  const ids: number[] = [];
  let index = 0;

  while (true) {
    try {
      const trackId = await contract.creatorTracks(creatorAddress, index);
      ids.push(Number(trackId));
      index++;
    } catch {
      break; // hết mảng
    }
  }
  return ids;
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
 */
export async function getTipRecord(tipId: number) {
  const contract = await getTuneChain();
  return await contract.tipRecords(tipId);
  // Trả về: { tipper, trackId, amount, timestamp }
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
 */
export async function getReport(reportId: number) {
  const contract = await getTuneChain();
  return await contract.reports(reportId);
  // Trả về: { reportId, reporter, trackId, reason, resolved, createdAt }
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
 * UC-02: Creator upload track
 * ⚠️ Hàm thật: uploadTrack(string ipfsHash, string title)
 *    KHÁC SRS: có 2 tham số, không phải 1
 *    ⚠️ Hiện tại contract trả lỗi "not implemented yet"
 */
export async function uploadTrack(ipfsHash: string, title: string) {
  const contract = await getTuneChain(true);
  const tx = await contract.uploadTrack(ipfsHash, title);
  return await tx.wait();
  // receipt.hash = tx hash
  // Lắng nghe event: TrackUploaded(trackId, creator, ipfsHash, title)
}

/**
 * UC-04: Listener tip TCT cho tác giả
 * ⚠️ Hàm thật: tipTrack(uint trackId, uint amount) — không phải tip()
 *    ⚠️ Hiện tại contract trả lỗi "not implemented yet"
 */
export async function tipTrack(trackId: number, amountTCT: string) {
  const contract = await getTuneChain(true);
  const token    = await getTuneToken(true);
  const signer   = await getSigner();
  const address  = await signer.getAddress();
  const amount   = parseUnits(amountTCT, 18);

  // Bước 1: approve TCT cho TuneChain — MetaMask popup lần 1
  const allowance = await token.allowance(address, TUNECHAIN_ADDRESS);
  if (allowance < amount) {
    const approveTx = await token.approve(TUNECHAIN_ADDRESS, amount);
    await approveTx.wait();
  }

  // Bước 2: tipTrack — MetaMask popup lần 2
  const tx = await contract.tipTrack(trackId, amount);
  return await tx.wait();
  // Lắng nghe event: TrackTipped(tipId, trackId, tipper, amount)
}

/**
 * UC-05: Creator rút tips
 * ⚠️ Hàm thật: withdrawTips() — KHÔNG có trackId
 *    ⚠️ Hiện tại contract trả lỗi "not implemented yet"
 */
export async function withdrawTips() {
  const contract = await getTuneChain(true);
  const tx = await contract.withdrawTips();
  return await tx.wait();
  // Lắng nghe event: TipWithdrawn(creator, amount)
}

/**
 * UC-06: Report vi phạm
 * ⚠️ Hàm thật: reportTrack(uint trackId, string reason) — có thêm reason
 *    Không cần stake TCT trong contract hiện tại
 */
export async function reportTrack(trackId: number, reason: string) {
  const contract = await getTuneChain(true);
  const tx = await contract.reportTrack(trackId, reason);
  return await tx.wait();
  // Lắng nghe event: TrackReported(reportId, reporter, trackId)
}

/**
 * Admin resolve report (chỉ ADMIN_ROLE mới gọi được)
 * removed = true → ẩn track, false → giữ nguyên
 */
export async function resolveReport(reportId: number, removed: boolean) {
  const contract = await getTuneChain(true);
  const tx = await contract.resolveReport(reportId, removed);
  return await tx.wait();
  // Lắng nghe event: ReportResolved(reportId, removed)
  // Nếu removed=true: TrackDeactivated(trackId) cũng được emit
}

// ─────────────────────────────────────────────────────────────
// 5. TuneToken — mint TCT cho testing
// ─────────────────────────────────────────────────────────────

/**
 * Mint TCT cho 1 địa chỉ (chỉ owner TuneToken mới gọi được)
 * Dùng để test — mint TCT cho các ví test
 */
export async function mintTCT(toAddress: string, amountTCT: string) {
  const token  = await getTuneToken(true);
  const amount = parseUnits(amountTCT, 18);
  const tx = await token.mint(toAddress, amount);
  return await tx.wait();
}

// ─────────────────────────────────────────────────────────────
// 6. Network helper
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