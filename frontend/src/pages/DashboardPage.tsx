import React from 'react';
import { useWallet } from '../hooks/useWallet';
import { formatAddress } from '../utils/helpers';

const statCard = (label: string, value: string, accent: string) => (
  <div
    key={label}
    style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12,
      padding: '28px 24px',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <div style={{
      position: 'absolute',
      top: 0, left: 0, right: 0,
      height: 2,
      background: accent,
    }} />
    <p style={{
      fontFamily: 'monospace',
      fontSize: 10,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: '#5a5a6a',
      marginBottom: 12,
    }}>{label}</p>
    <p style={{
      fontFamily: "'Playfair Display', Georgia, serif",
      fontSize: 36,
      fontWeight: 700,
      color: '#f0e6c8',
      lineHeight: 1,
    }}>{value}</p>
  </div>
);
interface DashboardPageProps {
  player: any;
}
export const DashboardPage: React.FC<DashboardPageProps> = ({ player }) => {
  const { isConnected, account } = useWallet();

  if (!isConnected) {
    return (
      <div style={{
        background: 'rgba(212,175,55,0.04)',
        border: '1px solid rgba(212,175,55,0.15)',
        borderRadius: 12,
        padding: 'clamp(24px, 6vw, 48px) clamp(20px, 5vw, 32px)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 'clamp(24px, 5vw, 32px)', marginBottom: 16 }}>◎</div>
        <p style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 'clamp(14px, 3vw, 18px)',
          color: '#c8b88a',
        }}>
          Connect your wallet to access your dashboard
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Page header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 20 }}>
        <p style={{
          fontFamily: 'monospace',
          fontSize: 10,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: '#d4af37',
          marginBottom: 8,
        }}>◈ Overview</p>
        <h2 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 30,
          fontWeight: 700,
          color: '#f0e6c8',
        }}>Dashboard</h2>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-5">
        {statCard('Total Uploads', '0', 'linear-gradient(90deg, #d4af37, transparent)')}
        {statCard('Total Plays', '0', 'linear-gradient(90deg, #22c55e, transparent)')}
        {statCard('Total Earnings', '0 ETH', 'linear-gradient(90deg, #818cf8, transparent)')}
      </div>

      {/* Library */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <span style={{ color: '#d4af37', fontSize: 14 }}>♪</span>
          <h3 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 17,
            fontWeight: 600,
            color: '#e0d5b0',
          }}>Your Music Library</h3>
        </div>
        <div style={{ padding: '56px 32px', textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56,
            borderRadius: '50%',
            border: '1px dashed rgba(212,175,55,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: 22,
            color: '#d4af37',
            opacity: 0.5,
          }}>♪</div>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: 15, color: '#5a5a6a' }}>
            No music uploaded yet
          </p>
          <p style={{
            fontFamily: 'monospace',
            fontSize: 11,
            color: '#3a3a4a',
            marginTop: 8,
            letterSpacing: '0.1em',
          }}>
            Navigate to Upload to add your first track
          </p>
        </div>
      </div>

      {/* Account info */}
      <div style={{
        padding: '14px 20px',
        background: 'rgba(255,255,255,0.015)',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.05)',
      }}>
        <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#4a4a5a', letterSpacing: '0.1em' }}>
          ACCOUNT · <span style={{ color: '#6b6b7b' }}>{account}</span>
        </p>
      </div>
    </div>
  );
};  