import type { NetworkConfig } from '../types/wallet';

// Supported networks
export const SEPOLIA_CHAIN_ID = 11155111;
export const ETHEREUM_MAINNET_CHAIN_ID = 1;
export const HARDHAT_CHAIN_ID = 31337;   // ← THÊM


// Network configurations
export const NETWORKS: Record<number, NetworkConfig> = {
  [HARDHAT_CHAIN_ID]: {              // ← THÊM
    chainId: HARDHAT_CHAIN_ID,
    name: 'Hardhat Local',
    rpcUrl: 'http://127.0.0.1:8545',
    explorerUrl: '',
  },
  [SEPOLIA_CHAIN_ID]: {
    chainId: SEPOLIA_CHAIN_ID,
    name: 'Sepolia Testnet',
    rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
    explorerUrl: 'https://sepolia.etherscan.io',
  },
  [ETHEREUM_MAINNET_CHAIN_ID]: {
    chainId: ETHEREUM_MAINNET_CHAIN_ID,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
    explorerUrl: 'https://etherscan.io',
  },
};

// Default network for the app
export const DEFAULT_CHAIN_ID = SEPOLIA_CHAIN_ID;
//export const DEFAULT_CHAIN_ID = HARDHAT_CHAIN_ID;
// App configuration
export const APP_NAME = 'TuneChain';
export const APP_DESCRIPTION = 'Blockchain Music Platform';

// Route paths
export const ROUTES = {
  HOME: '/',
  UPLOAD: '/upload',
  DASHBOARD: '/dashboard',
} as const;

// UI Text constants
export const UI_TEXT = {
  CONNECT_WALLET: 'Connect Wallet',
  DISCONNECT: 'Disconnect',
  WRONG_NETWORK: 'Wrong Network',
  SWITCH_NETWORK: 'Switch Network',
  CONNECTING: 'Connecting...',
  NOT_CONNECTED: 'Not Connected',
  CONNECTED: 'Connected',
  LOADING: 'Loading...',
  ERROR: 'Error',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NO_ETHEREUM: 'MetaMask is not installed. Please install it to use this app.',
  CONNECTION_FAILED: 'Failed to connect to wallet. Please try again.',
  NETWORK_SWITCH_FAILED: 'Failed to switch network. Please try again.',
  USER_REJECTED: 'You rejected the connection request.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
} as const;
