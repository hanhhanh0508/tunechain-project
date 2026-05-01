import React from 'react';
import { useWallet } from '../hooks/useWallet';

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 12,
  padding: 28,
  transition: 'border-color 0.2s, background 0.2s',
};

const featureIcon: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 10,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 20,
  marginBottom: 16,
};

export const HomePage: React.FC = () => {
  const { isConnected, account } = useWallet();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(24px, 6vw, 40px)' }}>
      {/* Hero */}
      <div style={{
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
        padding: 'clamp(32px, 8vw, 56px) clamp(24px, 6vw, 48px)',
        background: 'linear-gradient(135deg, #0f0e1a 0%, #13111f 60%, #1a1308 100%)',
        border: '1px solid rgba(212, 175, 55, 0.15)',
      }}>
        {/* Background decoration */}
        <div style={{
          position: 'absolute', top: -60, right: -60,
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -40, left: -40,
          width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(100,80,200,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'inline-block',
            padding: '4px 14px',
            borderRadius: 20,
            border: '1px solid rgba(212,175,55,0.3)',
            background: 'rgba(212,175,55,0.06)',
            fontFamily: 'monospace',
            fontSize: 10,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#d4af37',
            marginBottom: 20,
          }}>
            ◈ Blockchain Music Platform
          </div>

          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(28px, 6vw, 52px)',
            fontWeight: 700,
            color: '#f0e6c8',
            lineHeight: 1.15,
            marginBottom: 16,
            letterSpacing: '-0.01em',
          }}>
            Your Music,<br />
            <span style={{
              background: 'linear-gradient(90deg, #d4af37, #f5d06e)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>On-Chain Forever</span>
          </h2>

          <p style={{
            fontFamily: "'Georgia', serif",
            fontSize: 16,
            color: '#8a8070',
            maxWidth: 480,
            lineHeight: 1.7,
            marginBottom: 28,
          }}>
            Upload, manage, and monetize your music through decentralized technology.
            Own your art. Earn directly.
          </p>

          {!isConnected ? (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              borderRadius: 8,
              background: 'rgba(212,175,55,0.08)',
              border: '1px dashed rgba(212,175,55,0.3)',
              fontFamily: 'monospace',
              fontSize: 12,
              color: '#9a8a5a',
              letterSpacing: '0.1em',
            }}>
              ◎ Connect your wallet to get started
            </div>
          ) : (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 20px',
              borderRadius: 8,
              background: 'rgba(34, 197, 94, 0.08)',
              border: '1px solid rgba(34,197,94,0.2)',
              fontFamily: 'monospace',
              fontSize: 12,
              color: '#4ade80',
              letterSpacing: '0.08em',
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: '#22c55e', boxShadow: '0 0 6px #22c55e',
                display: 'inline-block',
              }} />
              {account}
            </div>
          )}
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-3 gap-5">
        {[
          {
            icon: '🎵',
            iconBg: 'rgba(212,175,55,0.1)',
            title: 'Upload Music',
            desc: 'Store your tracks securely on the blockchain with immutable proof of ownership.',
          },
          {
            icon: '◈',
            iconBg: 'rgba(100, 200, 120, 0.08)',
            title: 'Dashboard',
            desc: 'Monitor plays, earnings, and manage your entire music catalog in one place.',
          },
          {
            icon: '⬡',
            iconBg: 'rgba(120, 100, 220, 0.1)',
            title: 'Fully Decentralized',
            desc: 'No middlemen. Your music, your rules, your revenue — protected by code.',
          },
        ].map((f) => (
          <div
            key={f.title}
            style={card}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(212,175,55,0.2)';
              (e.currentTarget as HTMLDivElement).style.background = 'rgba(212,175,55,0.03)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)';
              (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)';
            }}
          >
            <div style={{ ...featureIcon, background: f.iconBg }}>
              {f.icon}
            </div>
            <h3 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 17,
              fontWeight: 600,
              color: '#e0d5b0',
              marginBottom: 8,
            }}>{f.title}</h3>
            <p style={{
              fontFamily: 'Georgia, serif',
              fontSize: 13,
              color: '#6b6b7b',
              lineHeight: 1.6,
            }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};