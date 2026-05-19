// frontend/src/utils/contractUtils.ts
// Kết nối frontend với TuneChain + TuneToken qua ethers.js v6

import { BrowserProvider, Contract, formatUnits, parseUnits } from 'ethers';
import type { Signer } from 'ethers';
import {
  TUNECHAIN_ABI,
  TUNECHAIN_ADDRESS,
  TUNETOKEN_ABI,
  TUNETOKEN_ADDRESS,
} from '../abi/ABI/index';

// ─────────────────────────────────────────────────────────────
// 1. Provider & Signer
// ─────────────────────────────────────────────────────────────

export async function getProvider(): Promise<BrowserProvider> {
  if (!window.ethereum) {
    throw new Error('MetaMask chưa cài — vui lòng cài extension MetaMask');
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
  const runner = withSigner ? await getSigner() : provider;
  return new Contract(TUNECHAIN_ADDRESS, TUNECHAIN_ABI, runner);
}

export async function getTuneToken(withSigner = false): Promise<Contract> {
  const provider = await getProvider();
  const runner = withSigner ? await getSigner() : provider;
  return new Contract(TUNETOKEN_ADDRESS, TUNETOKEN_ABI, runner);
}

// ─────────────────────────────────────────────────────────────
// 3. READ functions — không tốn gas
// ─────────────────────────────────────────────────────────────

export async function getTrack(trackId: number) {
  const contract = await getTuneChain();
  return await contract.tracks(trackId);
}

export async function getNextTrackId(): Promise<number> {
  const contract = await getTuneChain();
  const raw = await contract.nextTrackId();
  return Number(raw);
}

export async function getAllActiveTracks() {
  const contract = await getTuneChain();
  return await contract.getAllActiveTracks();
}

export async function getCreatorTrackIds(creatorAddress: string): Promise<number[]> {
  const contract = await getTuneChain();
  const ids = await contract.getCreatorTracks(creatorAddress);
  return ids.map(Number);
}

export async function getTCTBalance(address: string): Promise<string> {
  const token = await getTuneToken();
  const raw = await token.balanceOf(address);
  return formatUnits(raw, 18);
}

export async function getTipRecord(tipId: number) {
  const contract = await getTuneChain();
  return await contract.tipRecords(tipId);
}

export async function getReportCount(trackId: number): Promise<number> {
  const contract = await getTuneChain();
  const raw = await contract.reportCount(trackId);
  return Number(raw);
}

export async function getReport(reportId: number) {
  const contract = await getTuneChain();
  return await contract.reports(reportId);
}

export async function getEscrowInfo(
  creatorAddress: string
): Promise<{ balance: bigint; unlockTime: bigint }> {
  const contract = await getTuneChain();
  const [balance, unlockTime] = await contract.getEscrowInfo(creatorAddress);
  return { balance, unlockTime };
}

export async function canWithdraw(creatorAddress: string): Promise<boolean> {
  const contract = await getTuneChain();
  return await contract.canWithdraw(creatorAddress);
}

export async function isAdmin(address: string): Promise<boolean> {
  const contract = await getTuneChain();
  const ADMIN_ROLE = await contract.ADMIN_ROLE();
  return await contract.hasRole(ADMIN_ROLE, address);
}

// ─────────────────────────────────────────────────────────────
// 4. WRITE functions — cần MetaMask ký
// ─────────────────────────────────────────────────────────────

/**
 * UC-02: Creator upload track mới.
 * Phí upload = BASE_UPLOAD_FEE (10 TCT) — tự động approve nếu cần.
 */
export async function uploadTrack(ipfsHash: string, title: string) {
  const contract = await getTuneChain(true);
  const token = await getTuneToken(true);
  const signer = await getSigner();
  const address = await signer.getAddress();

  // Lấy phí upload thực tế từ contract
  const uploadFee: bigint = await contract.BASE_UPLOAD_FEE();

  // Auto-approve nếu chưa đủ allowance
  const allowance: bigint = await token.allowance(address, TUNECHAIN_ADDRESS);
  if (allowance < uploadFee) {
    const approveTx = await token.approve(TUNECHAIN_ADDRESS, uploadFee);
    await approveTx.wait();
  }

  const tx = await contract.uploadTrack(ipfsHash, title);
  return await tx.wait();
}

/**
 * UC-04: Listener tip TCT cho tác giả.
 * Token bị khóa escrow 24h trong contract.
 */
export async function tipTrack(trackId: number, amountTCT: string) {
  const contract = await getTuneChain(true);
  const token = await getTuneToken(true);
  const signer = await getSigner();
  const address = await signer.getAddress();
  const amount = parseUnits(amountTCT, 18);

  // Approve nếu chưa đủ allowance
  const allowance: bigint = await token.allowance(address, TUNECHAIN_ADDRESS);
  if (allowance < amount) {
    const approveTx = await token.approve(TUNECHAIN_ADDRESS, amount);
    await approveTx.wait();
  }

  const tx = await contract.tipTrack(trackId, amount);
  return await tx.wait();
}

/**
 * UC-05: Creator rút tất cả tips đã unlock (sau 24h kể từ tip cuối).
 */
export async function withdrawTips() {
  const contract = await getTuneChain(true);
  const tx = await contract.withdrawTips();
  return await tx.wait();
}

/**
 * UC-06: Report vi phạm bản quyền.
 */
export async function reportTrack(trackId: number, reason: string) {
  const contract = await getTuneChain(true);
  const tx = await contract.reportTrack(trackId, reason);
  return await tx.wait();
}

/**
 * Admin resolve report.
 */
export async function resolveReport(reportId: number, removed: boolean) {
  const contract = await getTuneChain(true);
  const tx = await contract.resolveReport(reportId, removed);
  return await tx.wait();
}

// ─────────────────────────────────────────────────────────────
// 5. TuneToken — mint TCT cho testing
// ─────────────────────────────────────────────────────────────

export async function mintTCT(toAddress: string, amountTCT: string) {
  const token = await getTuneToken(true);
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
  const network = await provider.getNetwork();

  if (Number(network.chainId) !== targetChainId) {
    const ethereum = window.ethereum;
    if (!ethereum) {
      throw new Error('MetaMask chưa cài — không thể chuyển network');
    }
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${targetChainId.toString(16)}` }],
    });
  }
}

export async function getCurrentAddress(): Promise<string> {
  const signer = await getSigner();
  return signer.getAddress();
}