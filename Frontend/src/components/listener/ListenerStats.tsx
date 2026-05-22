// frontend/src/components/listener/ListenerStats.tsx
// Strip thống kê nhanh cho listener: tổng tracks, tổng plays, số có tip, trạng thái kết nối
import React from 'react';

interface ListenerStatsProps {
  totalTracks: number;
  totalPlays: number;
  tracksWithTips: number;
  isConnected: boolean;
}

function fmtNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export const ListenerStats: React.FC<ListenerStatsProps> = ({
  totalTracks,
  totalPlays,
  tracksWithTips,
  isConnected,
}) => {
  const stats: Array<{
    label: string;
    value: string;
    icon: string;
    accent: string;
    sub?: string;
  }> = [
    {
      label: 'Tracks',
      value: fmtNumber(totalTracks),
      icon: '♪',
      accent: '#d4af37',
      sub: 'on-chain',
    },
    {
      label: 'Total Plays',
      value: fmtNumber(totalPlays),
      icon: '▶',
      accent: '#60a5fa',
      sub: 'lượt nghe',
    },
    {
      label: 'Có Tip',
      value: fmtNumber(tracksWithTips),
      icon: '💎',
      accent: '#a78bfa',
      sub: `${totalTracks > 0 ? Math.round((tracksWithTips / totalTracks) * 100) : 0}% tracks`,
    },
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      {/* Stat cards */}
      {stats.map((s) => (
        <div
          key={s.label}
          style={{
            flex: '1 1 140px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 10,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Accent left bar */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 3,
              background: s.accent,
              borderRadius: '10px 0 0 10px',
            }}
          />

          {/* Icon */}
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: `${s.accent}14`,
              border: `1px solid ${s.accent}28`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 15,
              flexShrink: 0,
              color: s.accent,
            }}
          >
            {s.icon}
          </div>

          {/* Text */}
          <div>
            <p
              style={{
                fontFamily: 'monospace',
                fontSize: 9,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#4a4a5a',
                margin: '0 0 4px',
              }}
            >
              {s.label}
            </p>
            <p
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 22,
                fontWeight: 700,
                color: s.accent,
                margin: 0,
                lineHeight: 1,
              }}
            >
              {s.value}
            </p>
            {s.sub && (
              <p
                style={{
                  fontFamily: 'monospace',
                  fontSize: 9,
                  color: '#3a3a4a',
                  margin: '4px 0 0',
                  letterSpacing: '0.06em',
                }}
              >
                {s.sub}
              </p>
            )}
          </div>
        </div>
      ))}

      {/* Wallet status card */}
      <div
        style={{
          flex: '1 1 140px',
          background: isConnected
            ? 'rgba(34,197,94,0.04)'
            : 'rgba(255,255,255,0.02)',
          border: `1px solid ${
            isConnected
              ? 'rgba(34,197,94,0.18)'
              : 'rgba(255,255,255,0.07)'
          }`,
          borderRadius: 10,
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Accent bar */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            background: isConnected ? '#22c55e' : '#4a4a5a',
            borderRadius: '10px 0 0 10px',
          }}
        />

        {/* Icon */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: isConnected
              ? 'rgba(34,197,94,0.12)'
              : 'rgba(255,255,255,0.04)',
            border: `1px solid ${
              isConnected
                ? 'rgba(34,197,94,0.25)'
                : 'rgba(255,255,255,0.06)'
            }`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 15,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: isConnected ? '#22c55e' : '#3a3a4a',
              boxShadow: isConnected ? '0 0 8px rgba(34,197,94,0.5)' : 'none',
              display: 'inline-block',
            }}
          />
        </div>

        {/* Text */}
        <div>
          <p
            style={{
              fontFamily: 'monospace',
              fontSize: 9,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#4a4a5a',
              margin: '0 0 4px',
            }}
          >
            Wallet
          </p>
          <p
            style={{
              fontFamily: 'monospace',
              fontSize: 13,
              fontWeight: 700,
              color: isConnected ? '#4ade80' : '#3a3a4a',
              margin: 0,
              letterSpacing: '0.08em',
            }}
          >
            {isConnected ? 'Connected' : 'Not Connected'}
          </p>
          <p
            style={{
              fontFamily: 'monospace',
              fontSize: 9,
              color: '#3a3a4a',
              margin: '4px 0 0',
              letterSpacing: '0.06em',
            }}
          >
            {isConnected ? 'Tip & Report enabled' : 'Connect to interact'}
          </p>
        </div>
      </div>
    </div>
  );
};