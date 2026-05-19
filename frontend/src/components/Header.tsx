// frontend/src/components/Header.tsx
import React, { useEffect, useState } from 'react';
import { APP_NAME } from '../constants';
import { WalletButton } from './WalletButton';
import { useWallet } from '../hooks/useWallet';
import { getTCTBalance } from '../utils/contractUtils';

interface HeaderProps {
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ className = '' }) => {
  const { isConnected, account } = useWallet();
  const [tctBalance, setTctBalance] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected || !account) {
      setTctBalance(null);
      return;
    }
    let mounted = true;
    const fetchBalance = async () => {
      try {
        const bal = await getTCTBalance(account);
        if (mounted) {
          const num = parseFloat(bal);
          setTctBalance(
            num >= 1000
              ? `${(num / 1000).toFixed(1)}K`
              : num.toFixed(2)
          );
        }
      } catch {
        // contract chưa deploy / chưa có địa chỉ
        if (mounted) setTctBalance(null);
      }
    };
    fetchBalance();
    const interval = setInterval(fetchBalance, 30_000);
    return () => { mounted = false; clearInterval(interval); };
  }, [isConnected, account]);

  return (
    <header
      className={`relative ${className}`}
      style={{
        background: 'linear-gradient(180deg, #0a0a0f 0%, #0f0f1a 100%)',
        borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
      }}
    >
      {/* Ambient top line */}
      <div style={{
        position: 'absolute', top: 0, left: '50%',
        transform: 'translateX(-50%)',
        width: '40%', height: '1px',
        background: 'linear-gradient(90deg, transparent, #d4af37, transparent)',
      }} />

      <div className="w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">

          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div style={{
              width: 40, height: 40, minWidth: 40,
              background: 'linear-gradient(135deg, #d4af37 0%, #f5d06e 50%, #b8960c 100%)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(212, 175, 55, 0.4)',
            }}>
              <span style={{ fontSize: 18, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}>♪</span>
            </div>
            <div className="min-w-0">
              <h1 style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 'clamp(18px, 4vw, 22px)',
                fontWeight: 700, color: '#f0e6c8',
                letterSpacing: '0.04em', lineHeight: 1, margin: 0,
                whiteSpace: 'nowrap',
              }}>
                {APP_NAME}
              </h1>
              <p style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 8, color: '#d4af37',
                letterSpacing: '0.2em', textTransform: 'uppercase',
                margin: '2px 0 0 0',
              }} className="hidden sm:block">
                Music · Blockchain
              </p>
            </div>
          </div>

          {/* Right: TCT badge + Wallet button */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* TCT balance badge */}
            {isConnected && tctBalance !== null && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 12px',
                borderRadius: 6,
                background: 'rgba(212,175,55,0.08)',
                border: '1px solid rgba(212,175,55,0.2)',
                fontFamily: 'monospace',
                fontSize: 'clamp(10px, 2vw, 12px)',
                color: '#d4af37',
                letterSpacing: '0.08em',
                whiteSpace: 'nowrap',
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#d4af37',
                  boxShadow: '0 0 6px rgba(212,175,55,0.6)',
                  display: 'inline-block', flexShrink: 0,
                }} />
                <span className="hidden xs:inline">{tctBalance}</span>
                <span style={{ color: '#9a7a20', fontSize: 'clamp(9px, 1.5vw, 10px)' }}>TCT</span>
              </div>
            )}

            <WalletButton />
          </div>
        </div>
      </div>
    </header>
  );
};