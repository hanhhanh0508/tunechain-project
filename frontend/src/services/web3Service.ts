import { NETWORKS } from '../constants';
import type { Web3Error } from '../types/wallet';
import { chainIdToHex, hexToChainId } from '../utils/helpers';

/**
 * Web3Service: Handles all MetaMask/Ethereum interactions
 * Encapsulates wallet connection, network switching, and provider management
 */
class Web3Service {
  // Check if MetaMask is installed
  isMetaMaskInstalled(): boolean {
    return typeof window !== 'undefined' && Boolean(window.ethereum);
  }

  // Get current provider (MetaMask)
  getProvider() {
    if (typeof window === 'undefined') return null;
    return window.ethereum;
  }

  // Request account connection
  async requestAccounts(): Promise<string[]> {
    try {
      const provider = this.getProvider();
      if (!provider) {
        throw new Error('MetaMask is not installed');
      }

      const accounts = await provider.request({
        method: 'eth_requestAccounts',
      });

      return accounts as string[];
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // Get current connected account
  async getAccount(): Promise<string | null> {
    try {
      const provider = this.getProvider();
      if (!provider) return null;

      const accounts = await provider.request({
        method: 'eth_accounts',
      });

      return accounts && accounts.length > 0 ? accounts[0] : null;
    } catch (error) {
      console.error('Failed to get account:', error);
      return null;
    }
  }

  // Get current chain ID
  async getChainId(): Promise<number | null> {
    try {
      const provider = this.getProvider();
      if (!provider) return null;

      const chainIdHex = await provider.request({
        method: 'eth_chainId',
      });

      return hexToChainId(chainIdHex);
    } catch (error) {
      console.error('Failed to get chain ID:', error);
      return null;
    }
  }

  // Switch to specific network
  async switchNetwork(targetChainId: number): Promise<void> {
    try {
      const provider = this.getProvider();
      if (!provider) {
        throw new Error('MetaMask is not installed');
      }

      const chainHex = chainIdToHex(targetChainId);
      const network = NETWORKS[targetChainId];

      if (!network) {
        throw new Error(`Unsupported network: ${targetChainId}`);
      }

      // Try to switch to the chain
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainHex }],
        });
      } catch (switchError: any) {
        // Chain doesn't exist in wallet, add it
        if (switchError.code === 4902) {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: chainHex,
                chainName: network.name,
                rpcUrls: [network.rpcUrl],
                blockExplorerUrls: [network.explorerUrl],
              },
            ],
          });
        } else {
          throw switchError;
        }
      }
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // Listen to account changes
  onAccountsChanged(callback: (accounts: string[]) => void): () => void {
    const provider = this.getProvider();
    if (!provider) return () => {};

    provider.on('accountsChanged', callback);

    // Return unsubscribe function
    return () => provider.removeListener('accountsChanged', callback);
  }

  // Listen to chain changes
  onChainChanged(callback: (chainId: string) => void): () => void {
    const provider = this.getProvider();
    if (!provider) return () => {};

    provider.on('chainChanged', callback);

    // Return unsubscribe function
    return () => provider.removeListener('chainChanged', callback);
  }

  // Listen to disconnect
  onDisconnect(callback: (error: { code: number; message: string }) => void): () => void {
    const provider = this.getProvider();
    if (!provider) return () => {};

    provider.on('disconnect', callback);

    // Return unsubscribe function
    return () => provider.removeListener('disconnect', callback);
  }

  // Handle and normalize errors
  private handleError(error: any): Web3Error {
    let normalizedError: Web3Error;

    if (error.code === 4001) {
      normalizedError = new Error('User rejected the request') as Web3Error;
      normalizedError.code = 4001;
    } else if (error.code === -32602) {
      normalizedError = new Error('Invalid parameters') as Web3Error;
      normalizedError.code = -32602;
    } else {
      normalizedError = error as Web3Error;
    }

    normalizedError.data = error.data || null;
    return normalizedError;
  }
}

export const web3Service = new Web3Service();
