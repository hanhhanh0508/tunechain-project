// frontend/src/components/listener/NowPlayingBar.tsx
// Thanh player cố định ở bottom — hiển thị khi đang phát nhạc
import React from 'react';

interface NowPlayingBarProps {
  track: {
    trackId: number;
    title: string;
    creator: string;
    ipfsHash: string;
  } | null;
  isPlaying: boolean;
  progress: number;      // 0-100
  currentTime: number;   // giây
  duration: number;      // giây
  onTogglePlay: () => void;
  onSeek: (percent: number) => void;
}

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatAddr(addr: string): string {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export const NowPlayingBar: React.FC<NowPlayingBarProps> = ({
  track,
  isPlaying,
  progress,
  currentTime,
  duration,
  onTogglePlay,
  onSeek,
}) => {
  if (!track) return null;

  const handleProgressClick = (
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    onSeek(Math.max(0, Math.min(100, pct)));
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: 'rgba(8, 8, 15, 0.97)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(212,175,55,0.25)',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.6)',
      }}
    >
      {/* Seekable progress bar — full width, top of bar */}
      <div
        onClick={handleProgressClick}
        style={{
          height: 3,
          background: 'rgba(255,255,255,0.07)',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #b8960c, #d4af37, #f5d06e)',
            transition: 'width 0.1s linear',
            borderRadius: '0 2px 2px 0',
          }}
        />
        {/* Thumb */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: `${progress}%`,
            transform: 'translate(-50%, -50%)',
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: '#f5d06e',
            boxShadow: '0 0 6px rgba(212,175,55,0.8)',
            pointerEvents: 'none',
            transition: 'left 0.1s linear',
          }}
        />
      </div>

      {/* Main content */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '10px 24px 12px',
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >
        {/* Cover / waveform animation */}
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 8,
            flexShrink: 0,
            background: isPlaying
              ? 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(245,208,110,0.08))'
              : 'rgba(212,175,55,0.07)',
            border: `1px solid ${
              isPlaying
                ? 'rgba(212,175,55,0.4)'
                : 'rgba(212,175,55,0.12)'
            }`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 17,
            color: '#d4af37',
            boxShadow: isPlaying
              ? '0 0 14px rgba(212,175,55,0.2)'
              : 'none',
            transition: 'all 0.3s',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {isPlaying ? (
            /* Mini equalizer bars */
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 2,
                height: 18,
              }}
            >
              <style>{`
                @keyframes npBar1{0%,100%{height:4px}50%{height:16px}}
                @keyframes npBar2{0%,100%{height:10px}50%{height:6px}}
                @keyframes npBar3{0%,100%{height:6px}50%{height:18px}}
                @keyframes npBar4{0%,100%{height:14px}50%{height:8px}}
              `}</style>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 3,
                    background: '#d4af37',
                    borderRadius: 2,
                    animation: `npBar${i} ${0.4 + i * 0.1}s ease-in-out infinite`,
                    animationDelay: `${(i - 1) * 0.07}s`,
                  }}
                />
              ))}
            </div>
          ) : (
            '♪'
          )}
        </div>

        {/* Track info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 14,
              fontWeight: 600,
              color: isPlaying ? '#f5d06e' : '#f0e6c8',
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              letterSpacing: '0.01em',
            }}
          >
            {isPlaying && (
              <span
                style={{
                  color: '#d4af37',
                  marginRight: 6,
                  fontSize: 10,
                  verticalAlign: 'middle',
                }}
              >
                ▶
              </span>
            )}
            {track.title}
          </p>
          <p
            style={{
              fontFamily: 'monospace',
              fontSize: 10,
              color: '#5a5a6a',
              margin: '3px 0 0',
              letterSpacing: '0.06em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {formatAddr(track.creator)}
            <span style={{ marginLeft: 8, color: '#3a3a4a' }}>
              #{track.trackId}
            </span>
          </p>
        </div>

        {/* Time */}
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: 11,
            color: '#5a5a6a',
            letterSpacing: '0.04em',
            flexShrink: 0,
            minWidth: 72,
            textAlign: 'center',
          }}
        >
          <span style={{ color: '#8a8a9a' }}>
            {formatTime(currentTime)}
          </span>
          <span style={{ color: '#3a3a4a', margin: '0 4px' }}>/</span>
          {formatTime(duration)}
        </div>

        {/* Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexShrink: 0,
          }}
        >
          {/* Prev (placeholder) */}
          <button
            onClick={() => {}}
            style={ctrlBtn}
            title="Bài trước"
          >
            ⏮
          </button>

          {/* Play / Pause — main button */}
          <button
            onClick={onTogglePlay}
            style={{
              ...ctrlBtn,
              width: 42,
              height: 42,
              borderRadius: '50%',
              background: isPlaying
                ? 'linear-gradient(135deg, #d4af37, #f5d06e)'
                : 'rgba(212,175,55,0.12)',
              color: isPlaying ? '#1a1400' : '#d4af37',
              border: `1px solid ${
                isPlaying ? 'transparent' : 'rgba(212,175,55,0.3)'
              }`,
              fontSize: 16,
              boxShadow: isPlaying
                ? '0 0 16px rgba(212,175,55,0.4)'
                : 'none',
              transition: 'all 0.2s',
            }}
            title={isPlaying ? 'Tạm dừng' : 'Phát'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>

          {/* Next (placeholder) */}
          <button
            onClick={() => {}}
            style={ctrlBtn}
            title="Bài tiếp"
          >
            ⏭
          </button>
        </div>
      </div>
    </div>
  );
};

const ctrlBtn: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: '50%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#d4af37',
  fontSize: 13,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.15s',
  outline: 'none',
};