// frontend/src/components/AudioPlayer.tsx
import React from 'react';

interface AudioPlayerProps {
  track: {
    title: string;
    creator: string;
  };
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  progress: number;
  onTogglePlay: () => void;
  onSeek: (percent: number) => void;
}

// Format giây → "1:23"
function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  track, isPlaying, currentTime, duration, progress,
  onTogglePlay, onSeek,
}) => {
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    onSeek(Math.max(0, Math.min(100, percent)));
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12,
      padding: 20,
    }}>
      {/* Label */}
      <div style={{
        fontFamily: 'monospace', fontSize: 10,
        letterSpacing: '0.15em', textTransform: 'uppercase',
        color: '#5a5a6a', marginBottom: 12,
      }}>
        PLAYER COMPONENT — AUDIOPLAYER.TSX
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Cover placeholder */}
        <div style={{
          width: 64, height: 64, borderRadius: 8, flexShrink: 0,
          background: 'rgba(212,175,55,0.08)',
          border: '1px solid rgba(212,175,55,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24,
        }}>
          ♪
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Track info */}
          <p style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 16, fontWeight: 600, color: '#f0e6c8',
            margin: '0 0 2px', whiteSpace: 'nowrap',
            overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{track.title}</p>
          <p style={{
            fontFamily: 'monospace', fontSize: 11,
            color: '#6b6b7b', margin: '0 0 12px',
          }}>{track.creator}</p>

          {/* Progress bar */}
          <div
            onClick={handleProgressClick}
            style={{
              height: 4, borderRadius: 2,
              background: 'rgba(255,255,255,0.1)',
              cursor: 'pointer', marginBottom: 8,
              position: 'relative',
            }}
          >
            <div style={{
              position: 'absolute', left: 0, top: 0, height: '100%',
              width: `${progress}%`, borderRadius: 2,
              background: 'linear-gradient(90deg, #d4af37, #f5d06e)',
              transition: 'width 0.1s linear',
            }} />
          </div>

          {/* Time */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontFamily: 'monospace', fontSize: 10, color: '#5a5a6a',
          }}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex', justifyContent: 'center',
        gap: 16, marginTop: 16,
      }}>
        {/* Prev */}
        <button onClick={() => {}} style={btnStyle}>⏮</button>

        {/* Play/Pause */}
        <button
          onClick={onTogglePlay}
          style={{
            ...btnStyle,
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg, #d4af37, #f5d06e)',
            color: '#1a1400', fontSize: 16,
          }}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        {/* Next */}
        <button onClick={() => {}} style={btnStyle}>⏭</button>
      </div>
    </div>
  );
};

const btnStyle: React.CSSProperties = {
  width: 36, height: 36, borderRadius: '50%',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#d4af37', fontSize: 14,
  cursor: 'pointer', display: 'flex',
  alignItems: 'center', justifyContent: 'center',
};