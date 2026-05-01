import { useState, useEffect, useCallback } from 'react';
import type { WalletState } from '../types/wallet';
import { web3Service } from '../services/web3Service';
import { DEFAULT_CHAIN_ID, NETWORKS, ERROR_MESSAGES } from '../constants';
import { hexToChainId } from '../utils/helpers';

/**
 * useWallet Hook
 * Manages wallet connection state, network detection, and account changes
 * Handles:
 * - Connect/disconnect wallet
 * - Detect connected account and chain
 * - Monitor account/chain changes
 * - Network switching with error handling
 */
export const useWallet = () => {
  const [state, setState] = useState<WalletState>({
    account: null,
    chainId: null,
    isConnected: false,
    isLoading: false,
    error: null,
    provider: null,
  });

  // Initialize wallet state on mount
  useEffect(() => {
    const initializeWallet = async () => {
      if (!web3Service.isMetaMaskInstalled()) {
        setState((prev) => ({
          ...prev,
          error: ERROR_MESSAGES.NO_ETHEREUM,
        }));
        return;
      }

      try {
        setState((prev) => ({ ...prev, isLoading: true }));

        const account = await web3Service.getAccount();
        const chainId = await web3Service.getChainId();

        setState((prev) => ({
          ...prev,
          account: account || null,
          chainId: chainId || null,
          isConnected: !!account,
          provider: web3Service.getProvider(),
          isLoading: false,
          error: null,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: ERROR_MESSAGES.UNKNOWN_ERROR,
          isLoading: false,
        }));
      }
    };

    initializeWallet();
  }, []);

  // Setup event listeners
  useEffect(() => {
    if (!web3Service.isMetaMaskInstalled()) return;

    // Handle account changes
    const unsubscribeAccounts = web3Service.onAccountsChanged((accounts) => {
      if (accounts.length === 0) {
        // User disconnected wallet
        setState((prev) => ({
          ...prev,
          account: null,
          isConnected: false,
          error: null,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          account: accounts[0],
          isConnected: true,
          error: null,
        }));
      }
    });

    // Handle chain changes
    const unsubscribeChain = web3Service.onChainChanged((chainIdHex) => {
      const newChainId = hexToChainId(chainIdHex);
      setState((prev) => ({
        ...prev,
        chainId: newChainId,
      }));
    });

    // Handle disconnect
    const unsubscribeDisconnect = web3Service.onDisconnect(() => {
      setState((prev) => ({
        ...prev,
        account: null,
        chainId: null,
        isConnected: false,
      }));
    });

    return () => {
      unsubscribeAccounts();
      unsubscribeChain();
      unsubscribeDisconnect();
    };
  }, []);

  // Connect wallet
  const connect = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      if (!web3Service.isMetaMaskInstalled()) {
        throw new Error(ERROR_MESSAGES.NO_ETHEREUM);
      }

      const accounts = await web3Service.requestAccounts();
      const chainId = await web3Service.getChainId();

      if (!accounts || accounts.length === 0) {
        throw new Error(ERROR_MESSAGES.CONNECTION_FAILED);
      }

      setState((prev) => ({
        ...prev,
        account: accounts[0],
        chainId: chainId || DEFAULT_CHAIN_ID,
        isConnected: true,
        isLoading: false,
        error: null,
        provider: web3Service.getProvider(),
      }));
    } catch (error: any) {
      let errorMessage: string = ERROR_MESSAGES.CONNECTION_FAILED;
      if (error.code === 4001) {
        errorMessage = ERROR_MESSAGES.USER_REJECTED;
      } else if (error.message?.includes('MetaMask')) {
        errorMessage = ERROR_MESSAGES.NO_ETHEREUM;
      }

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, []);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setState({
      account: null,
      chainId: null,
      isConnected: false,
      isLoading: false,
      error: null,
      provider: null,
    });
  }, []);

  // Switch network
  const switchNetwork = useCallback(async (targetChainId: number) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      if (!NETWORKS[targetChainId]) {
        throw new Error(`Unsupported network: ${targetChainId}`);
      }

      await web3Service.switchNetwork(targetChainId);

      setState((prev) => ({
        ...prev,
        chainId: targetChainId,
        isLoading: false,
        error: null,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: ERROR_MESSAGES.NETWORK_SWITCH_FAILED,
      }));
    }
  }, []);

  // Check if current network is correct
  const isNetworkCorrect = useCallback((): boolean => {
    return state.chainId === DEFAULT_CHAIN_ID;
  }, [state.chainId]);

  return {
    ...state,
    connect,
    disconnect,
    switchNetwork,
    isNetworkCorrect,
  };
};
