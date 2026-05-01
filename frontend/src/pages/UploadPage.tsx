import React, { useState } from 'react';
import { useWallet } from '../hooks/useWallet';

export const UploadPage: React.FC = () => {
  const { isConnected, account } = useWallet();
  const [isDragging, setIsDragging] = useState(false);

  if (!isConnected) {
    return (
      <div style={{
        background: 'rgba(212,175,55,0.04)',
        border: '1px solid rgba(212,175,55,0.15)',
        borderRadius: 12,
        padding: '48px 32px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 32, marginBottom: 16, color: '#d4af37' }}>◎</div>
        <p style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 18,
          color: '#c8b88a',
        }}>
          Connect your wallet to upload music
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(20px, 5vw, 32px)' }}>
      {/* Page header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 'clamp(16px, 4vw, 20px)' }}>
        <p style={{
          fontFamily: 'monospace',
          fontSize: 'clamp(9px, 2vw, 10px)',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: '#d4af37',
          marginBottom: 8,
        }}>↑ New Track</p>
        <h2 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 'clamp(24px, 5vw, 32px)',
          fontWeight: 700,
          color: '#f0e6c8',
        }}>Upload Music</h2>
      </div>

      {/* Drop zone */}
      <div
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onDrop={() => setIsDragging(false)}
        style={{
          borderRadius: 14,
          padding: '72px 32px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.25s',
          background: isDragging
            ? 'rgba(212, 175, 55, 0.06)'
            : 'rgba(255,255,255,0.015)',
          border: isDragging
            ? '2px dashed rgba(212,175,55,0.5)'
            : '2px dashed rgba(255,255,255,0.08)',
        }}
      >
        {/* Icon */}
        <div style={{
          width: 72, height: 72,
          borderRadius: '50%',
          background: isDragging ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${isDragging ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.08)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          transition: 'all 0.25s',
        }}>
          <svg
            width="28" height="28"
            fill="none"
            stroke={isDragging ? '#d4af37' : '#5a5a6a'}
            viewBox="0 0 24 24"
            style={{ transition: 'stroke 0.25s' }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          </svg>
        </div>

        <p style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 18,
          color: isDragging ? '#d4af37' : '#8a8070',
          marginBottom: 8,
          transition: 'color 0.25s',
        }}>
          Drop your music files here
        </p>
        <p style={{
          fontFamily: 'monospace',
          fontSize: 11,
          color: '#4a4a5a',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 24,
        }}>
          MP3 · WAV · FLAC · AAC supported
        </p>

        <button style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 24px',
          borderRadius: 6,
          background: 'linear-gradient(135deg, #d4af37, #f5d06e)',
          color: '#1a1400',
          border: 'none',
          fontFamily: 'monospace',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          boxShadow: '0 0 16px rgba(212,175,55,0.25)',
        }}>
          <span>↑</span> Choose Files
        </button>
      </div>

      {/* Supported formats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 12,
      }}>
        {['MP3', 'WAV', 'FLAC', 'AAC'].map(fmt => (
          <div key={fmt} style={{
            padding: '12px 16px',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            textAlign: 'center',
          }}>
            <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#d4af37', letterSpacing: '0.15em' }}>
              {fmt}
            </p>
            <p style={{ fontFamily: 'monospace', fontSize: 10, color: '#4a4a5a', marginTop: 4 }}>
              Supported
            </p>
          </div>
        ))}
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