import React from 'react';
import { APP_NAME } from '../constants';
import { WalletButton } from './WalletButton';

interface HeaderProps {
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ className = '' }) => {
  return (
    <header className={`relative ${className}`} style={{
      background: 'linear-gradient(180deg, #0a0a0f 0%, #0f0f1a 100%)',
      borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '40%',
        height: '1px',
        background: 'linear-gradient(90deg, transparent, #d4af37, transparent)',
      }} />

      <div className="w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Logo / Brand */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0" style={{ cursor: 'default' }}>
            <div style={{
              width: 40,
              height: 40,
              minWidth: 40,
              background: 'linear-gradient(135deg, #d4af37 0%, #f5d06e 50%, #b8960c 100%)',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(212, 175, 55, 0.4)',
            }}>
              <span style={{ fontSize: 18, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}>♪</span>
            </div>
            <div className="min-w-0">
              <h1 style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 'clamp(18px, 4vw, 22px)',
                fontWeight: 700,
                color: '#f0e6c8',
                letterSpacing: '0.04em',
                lineHeight: 1,
                margin: 0,
                whiteSpace: 'nowrap',
              }}>
                {APP_NAME}
              </h1>
              <p style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 8,
                color: '#d4af37',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                margin: '2px 0 0 0',
                display: 'none',
              }} className="hidden sm:block">
                Music · Blockchain
              </p>
            </div>
          </div>

          <div className="flex-shrink-0">
            <WalletButton />
          </div>
        </div>
      </div>
    </header>
  );
};