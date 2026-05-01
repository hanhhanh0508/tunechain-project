import React, { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { DEFAULT_CHAIN_ID, NETWORKS, UI_TEXT } from '../constants';
import { formatAddress } from '../utils/helpers';

interface WalletButtonProps {
  className?: string;
}

const btnBase: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 14px',
  borderRadius: 6,
  fontFamily: "'Courier New', monospace",
  fontSize: 'clamp(11px, 2vw, 12px)',
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  cursor: 'pointer',
  border: 'none',
  transition: 'all 0.2s',
  whiteSpace: 'nowrap',
};

export const WalletButton: React.FC<WalletButtonProps> = ({ className = '' }) => {
  const { account, chainId, isConnected, isLoading, error, connect, disconnect, switchNetwork, isNetworkCorrect } = useWallet();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleConnect = async () => { await connect(); setShowDropdown(false); };
  const handleSwitchNetwork = async () => { await switchNetwork(DEFAULT_CHAIN_ID); setShowDropdown(false); };
  const handleDisconnect = () => { disconnect(); setShowDropdown(false); };

  if (!isConnected) {
    return (
      <button
        onClick={handleConnect}
        disabled={isLoading}
        className={className}
        style={{
          ...btnBase,
          background: isLoading ? '#2a2a35' : 'linear-gradient(135deg, #d4af37, #f5d06e)',
          color: isLoading ? '#666' : '#1a1400',
          boxShadow: isLoading ? 'none' : '0 0 16px rgba(212, 175, 55, 0.3)',
          minWidth: 'auto',
        }}
      >
        <span style={{ fontSize: 'clamp(10px, 2vw, 12px)' }}>◎</span>
        <span className="hidden sm:inline">{isLoading ? 'Connecting…' : UI_TEXT.CONNECT_WALLET}</span>
        <span className="sm:hidden">{isLoading ? '…' : 'Connect'}</span>
      </button>
    );
  }

  if (!isNetworkCorrect()) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '7px 14px', borderRadius: 6,
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          fontFamily: 'monospace', fontSize: 12, color: '#f87171',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
          {UI_TEXT.WRONG_NETWORK}
        </div>
        <button
          onClick={handleSwitchNetwork}
          disabled={isLoading}
          style={{ ...btnBase, background: '#b45309', color: '#fff' }}
        >
          {isLoading ? 'Switching…' : UI_TEXT.SWITCH_NETWORK}
        </button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          ...btnBase,
          background: 'rgba(212, 175, 55, 0.08)',
          border: '1px solid rgba(212, 175, 55, 0.35)',
          color: '#d4af37',
        }}
      >
        <span style={{
          width: 7, height: 7, borderRadius: '50%',
          background: '#22c55e', boxShadow: '0 0 6px #22c55e',
          display: 'inline-block',
        }} />
        {formatAddress(account || '')}
        <span style={{ fontSize: 10, opacity: 0.6 }}>{showDropdown ? '▲' : '▼'}</span>
      </button>

      {showDropdown && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: 'calc(100% + 8px)',
          width: 240,
          background: '#0f0f1a',
          border: '1px solid rgba(212, 175, 55, 0.2)',
          borderRadius: 8,
          padding: '4px 0',
          zIndex: 50,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontFamily: 'monospace', fontSize: 10, color: '#6b6b7b', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Connected Account
            </p>
            <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#e0d5b0', marginTop: 6, wordBreak: 'break-all' }}>
              {account}
            </p>
          </div>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontFamily: 'monospace', fontSize: 10, color: '#6b6b7b', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Network
            </p>
            <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#e0d5b0', marginTop: 4 }}>
              {NETWORKS[chainId || DEFAULT_CHAIN_ID]?.name || 'Unknown'}
            </p>
          </div>
          <button
            onClick={handleDisconnect}
            style={{
              width: '100%', padding: '10px 16px', background: 'none', border: 'none',
              textAlign: 'left', fontFamily: 'monospace', fontSize: 12,
              letterSpacing: '0.08em', color: '#f87171', cursor: 'pointer',
            }}
          >
            ⏏ {UI_TEXT.DISCONNECT}
          </button>
        </div>
      )}

      {showDropdown && (
        <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
      )}

      {error && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 8px)',
          width: 260, background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8,
          padding: 12, fontSize: 12, color: '#f87171', zIndex: 50,
          fontFamily: 'monospace',
        }}>
          {error}
        </div>
      )}
    </div>
  );
};