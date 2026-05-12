// frontend/src/components/CreatorTrackList.tsx
import React from 'react';

interface TrackItem {
  trackId: number;
  title: string;
  totalTips: bigint;   // từ contract (wei)
  isActive: boolean;
}

interface CreatorTrackListProps {
  tracks: TrackItem[];
  onWithdraw: (trackId: number) => void;
  onPlay: (track: TrackItem) => void;
}

// Convert bigint wei → TCT string
function formatTCT(wei: bigint): string {
  const tct = Number(wei) / 1e18;
  return tct.toFixed(2);
}

export const CreatorTrackList: React.FC<CreatorTrackListProps> = ({
  tracks, onWithdraw, onPlay,
}) => {
  if (tracks.length === 0) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: '#5a5a6a' }}>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: 14 }}>
          Chưa có tác phẩm nào
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {tracks.map((track) => (
        <div
          key={track.trackId}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 8,
          }}
        >
          {/* Cover */}
          <div style={{
            width: 40, height: 40, borderRadius: 6, flexShrink: 0,
            background: 'rgba(212,175,55,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, cursor: 'pointer',
          }} onClick={() => onPlay(track)}>
            ♪
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 14, color: '#f0e6c8',
              margin: 0, whiteSpace: 'nowrap',
              overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {track.title}
            </p>
            <p style={{
              fontFamily: 'monospace', fontSize: 10,
              color: '#5a5a6a', margin: '2px 0 0',
            }}>
              {formatTCT(track.totalTips)} TCT Escrow
              · {track.isActive ? 'Đang hoạt động' : 'Đã ẩn'}
            </p>
          </div>

          {/* Withdraw button */}
          {track.totalTips > 0n && (
            <button
              onClick={() => onWithdraw(track.trackId)}
              style={{
                padding: '6px 14px', borderRadius: 6,
                background: 'rgba(212,175,55,0.1)',
                border: '1px solid rgba(212,175,55,0.3)',
                color: '#d4af37', fontFamily: 'monospace',
                fontSize: 11, cursor: 'pointer',
                letterSpacing: '0.08em',
              }}
            >
              Rút {formatTCT(track.totalTips)} TCT
            </button>
          )}
        </div>
      ))}
    </div>
  );
};