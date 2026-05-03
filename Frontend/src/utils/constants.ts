// frontend/src/utils/constants.ts
// Tất cả constants dựa theo ABI thật + SRS

export const IPFS_GATEWAY       = "https://gateway.pinata.cloud/ipfs/";
export const MAX_FILE_SIZE_MB   = 50;
export const MIN_TIP_TCT        = "1";

// ⚠️ Stake TCT hiện chưa có trong contract — M1 chưa implement
// Giữ constant để dùng khi M1 update
export const STAKE_AMOUNT_TCT   = "5";

// Threshold auto-hide (tính ở frontend vì contract dùng admin resolveReport)
export const VIEW_HIDE_THRESHOLD = 0.05;  // 5%
export const MIN_VIEW_TO_HIDE    = 100;

export const SUPPORTED_AUDIO    = ["audio/mpeg", "audio/wav", "audio/flac"];
export const SUPPORTED_IMAGE    = ["image/jpeg", "image/png"];

export const HARDHAT_CHAIN_ID   = 31337;
export const SEPOLIA_CHAIN_ID   = 11155111;