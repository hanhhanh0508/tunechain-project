// frontend/src/components/listener/TrackCard.tsx
// Card hiển thị thông tin 1 track cho listener
import React, { useState } from 'react';
import type { TrackStruct } from '../../abi/ABI/index';

interface TrackCardProps {
  track: TrackStruct;
  viewCount: number;
  isPlaying: boolean;
  isCurrentTrack: boolean;
  isConnected: boolean;
  currentAccount: string | null;
  onPlay: () => void;
  onTip: () => void;
  onReport: () => void;
}

function formatTCT(wei: bigint): string {
  const v = Number(wei) / 1e18;
  if (v === 0) return '0';
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
  return v.toFixed(1);
}

function formatAddr(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function timeAgo(createdAt: bigint): string {
  const diff = Math.floor(Date.now() / 1000) - Number(createdAt);
  if (diff < 60) return `${diff}s trước`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h trước`;
  return `${Math.floor(diff / 86400)}d trước`;
}

export const TrackCard: React.FC<TrackCardProps> = ({
  track, viewCount, isPlaying, isCurrentTrack,
  isConnected, currentAccount,
  onPlay, onTip, onReport,
}) => {
  const [hovering, setHovering] = useState(false);
  const isSelf = currentAccount?.toLowerCase() === String(track.creator).toLowerCase();

  // Gradient based on track ID for variety
  const gradients = [
    'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(245,208,110,0.05))',
    'linear-gradient(135deg, rgba(100,80,200,0.15), rgba(160,130,255,0.05))',
    'linear-gradient(135deg, rgba(34,197,94,0.12), rgba(74,222,128,0.04))',
    'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(248,113,113,0.04))',
    'linear-gradient(135deg, rgba(14,165,233,0.12), rgba(56,189,248,0.04))',
  ];
  const grad = gradients[Number(track.trackId) % gradients.length];

  return (
    <div
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{
        background: isCurrentTrack
          ? 'rgba(212,175,55,0.06)'
          : hovering ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.018)',
        border: `1px solid ${
          isCurrentTrack ? 'rgba(212,175,55,0.3)'
          : hovering ? 'rgba(255,255,255,0.1)'
          : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 12, overflow: 'hidden',
        transition: 'all 0.2s',
        cursor: 'default',
      }}
    >
      {/* Cover / Play area */}
      <div
        onClick={onPlay}
        style={{
          height: 110, position: 'relative', cursor: 'pointer',
          background: isCurrentTrack ? grad : 'rgba(255,255,255,0.02)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.3s',
          overflow: 'hidden',
        }}
      >
        {/* Background pulse when playing */}
        {isPlaying && (
          <div style={{
            position: 'absolute', inset: 0,
            background: grad,
            animation: 'pulseBg 2s ease-in-out infinite',
          }} />
        )}
        <style>{`
          @keyframes pulseBg { 0%,100%{opacity:.6} 50%{opacity:1} }
          @keyframes barAnim1 { 0%,100%{height:4px} 50%{height:18px} }
          @keyframes barAnim2 { 0%,100%{height:10px} 50%{height:6px} }
          @keyframes barAnim3 { 0%,100%{height:6px} 50%{height:20px} }
          @keyframes barAnim4 { 0%,100%{height:14px} 50%{height:8px} }
        `}</style>

        {/* Play/Pause icon */}
        <div style={{
          zIndex: 2, position: 'relative',
          width: 48, height: 48, borderRadius: '50%',
          background: isPlaying
            ? 'rgba(212,175,55,0.25)'
            : hovering ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.06)',
          border: `1px solid ${isPlaying ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.08)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, color: isPlaying ? '#d4af37' : '#6b6b7b',
          transition: 'all 0.2s',
          boxShadow: isPlaying ? '0 0 20px rgba(212,175,55,0.3)' : 'none',
        }}>
          {isPlaying ? '⏸' : '▶'}
        </div>

        {/* Equalizer bars when playing */}
        {isPlaying && (
          <div style={{
            position: 'absolute', bottom: 10, left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex', alignItems: 'flex-end', gap: 3,
          }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{
                width: 3, background: '#d4af37', borderRadius: 2,
                animation: `barAnim${i} ${0.4 + i * 0.1}s ease-in-out infinite`,
                animationDelay: `${i * 0.08}s`,
              }} />
            ))}
          </div>
        )}

        {/* Track ID */}
        <span style={{
          position: 'absolute', top: 8, right: 8,
          fontFamily: 'monospace', fontSize: 9, color: '#4a4a5a',
          background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: 4,
          letterSpacing: '0.06em',
        }}>
          #{String(track.trackId)}
        </span>

        {/* View count badge */}
        {viewCount > 0 && (
          <span style={{
            position: 'absolute', top: 8, left: 8,
            fontFamily: 'monospace', fontSize: 9, color: '#6b6b7b',
            background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: 4,
          }}>
            ▶ {viewCount >= 1000 ? `${(viewCount / 1000).toFixed(1)}K` : viewCount}
          </span>
        )}
      </div>

      {/* Info section */}
      <div style={{ padding: '14px 16px 16px' }}>
        {/* Title */}
        <p style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 15, fontWeight: 600, color: '#f0e6c8',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          marginBottom: 4,
        }}>
          {track.title}
        </p>

        {/* Creator + time */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{
            fontFamily: 'monospace', fontSize: 10, color: '#5a5a6a',
            letterSpacing: '0.04em',
          }}>
            {formatAddr(String(track.creator))}
            {isSelf && (
              <span style={{
                marginLeft: 6, padding: '1px 6px', borderRadius: 3,
                background: 'rgba(212,175,55,0.1)', color: '#d4af37', fontSize: 8,
                letterSpacing: '0.12em',
              }}>YOU</span>
            )}
          </span>
          <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#3a3a4a' }}>
            {timeAgo(track.createdAt)}
          </span>
        </div>

        {/* Tips row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 10px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: 6, marginBottom: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11 }}>💎</span>
            <span style={{
              fontFamily: 'monospace', fontSize: 11,
              color: track.totalTips > 0n ? '#d4af37' : '#3a3a4a',
              letterSpacing: '0.06em',
            }}>
              {formatTCT(track.totalTips)} TCT
            </span>
          </div>
          <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#3a3a4a', letterSpacing: '0.08em' }}>
            TOTAL TIPS
          </span>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Tip button */}
          {isConnected && !isSelf ? (
            <button
              onClick={onTip}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 6,
                background: 'rgba(212,175,55,0.08)',
                border: '1px solid rgba(212,175,55,0.2)',
                color: '#d4af37', cursor: 'pointer',
                fontFamily: 'monospace', fontSize: 11,
                letterSpacing: '0.08em',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(212,175,55,0.16)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,175,55,0.4)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(212,175,55,0.08)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,175,55,0.2)';
              }}
            >
              💎 Tip
            </button>
          ) : isConnected && isSelf ? (
            <div style={{
              flex: 1, padding: '8px 0', borderRadius: 6,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'monospace', fontSize: 10, color: '#3a3a4a',
              letterSpacing: '0.1em',
            }}>
              YOUR TRACK
            </div>
          ) : (
            <div style={{
              flex: 1, padding: '8px 0', borderRadius: 6,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'monospace', fontSize: 10, color: '#3a3a4a',
            }}>
              Connect to tip
            </div>
          )}

          {/* Report button */}
          {isConnected && !isSelf && (
            <button
              onClick={onReport}
              title="Báo cáo vi phạm bản quyền"
              style={{
                width: 36, height: 36, borderRadius: 6, cursor: 'pointer',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                color: '#4a4a5a', fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s', flexShrink: 0,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.2)';
                (e.currentTarget as HTMLElement).style.color = '#f87171';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)';
                (e.currentTarget as HTMLElement).style.color = '#4a4a5a';
              }}
            >
              ⚑
            </button>
          )}
        </div>
      </div>
    </div>
  );
};