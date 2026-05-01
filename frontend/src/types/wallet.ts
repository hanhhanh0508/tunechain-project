// Wallet connection state
export interface WalletState {
  account: string | null;
  chainId: number | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  provider: any;
}

// Network configuration
export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
}

// Error type for Web3 operations
export interface Web3Error extends Error {
  code?: string | number;
  data?: any;
}
