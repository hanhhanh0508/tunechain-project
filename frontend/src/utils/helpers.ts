// Format wallet address (e.g., 0x1234...5678)
export const formatAddress = (address: string, chars = 4): string => {
  if (!address) return '';
  return `${address.substring(0, chars + 2)}...${address.substring(42 - chars)}`;
};

// Check if address is valid Ethereum address
export const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Convert chain ID to hex string for wallet_switchEthereumChain
export const chainIdToHex = (chainId: number): string => {
  return `0x${chainId.toString(16)}`;
};

// Convert hex string to chain ID
export const hexToChainId = (hex: string): number => {
  return parseInt(hex, 16);
};

// Validate chain ID
export const isValidChainId = (chainId: any): boolean => {
  return Number.isInteger(chainId) && chainId > 0;
};

// Safe JSON parse
export const safeJsonParse = <T>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
};
