// frontend/src/components/MiniPlayer.tsx
import React from 'react';

interface MiniPlayerProps {
  track: { title: string; creator: string } | null;
  isPlaying: boolean;
  progress: number;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onSeek: (percent: number) => void;
}

function formatTime(s: number) {
  if (!s || isNaN(s)) return '0:00';
  return `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  track, isPlaying, progress, currentTime, duration,
  onTogglePlay, onSeek,
}) => {
  if (!track) return null;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onSeek(((e.clientX - rect.left) / rect.width) * 100);
  };

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(10, 10, 15, 0.95)',
      backdropFilter: 'blur(12px)',
      borderTop: '1px solid rgba(212,175,55,0.2)',
      padding: '8px 24px',
    }}>
      {/* Progress bar (clickable) */}
      <div onClick={handleSeek} style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 3, cursor: 'pointer',
        background: 'rgba(255,255,255,0.08)',
      }}>
        <div style={{
          height: '100%', width: `${progress}%`,
          background: 'linear-gradient(90deg, #d4af37, #f5d06e)',
          transition: 'width 0.1s linear',
        }} />
      </div>

      <div style={{
        display: 'flex', alignItems: 'center',
        gap: 16, paddingTop: 8,
      }}>
        {/* Prev */}
        <button onClick={() => {}} style={miniBtnStyle}>⏮</button>

        {/* Play/Pause */}
        <button onClick={onTogglePlay} style={{
          ...miniBtnStyle,
          background: '#d4af37', color: '#1a1400',
          width: 36, height: 36, borderRadius: '50%',
        }}>
          {isPlaying ? '⏸' : '▶'}
        </button>

        {/* Next */}
        <button onClick={() => {}} style={miniBtnStyle}>⏭</button>

        {/* Track info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontFamily: 'monospace', fontSize: 13,
            color: '#d4af37', margin: 0,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {isPlaying ? '▶ ' : ''}{track.title}
          </p>
        </div>

        {/* Time */}
        <span style={{
          fontFamily: 'monospace', fontSize: 11, color: '#5a5a6a',
          flexShrink: 0,
        }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  );
};

const miniBtnStyle: React.CSSProperties = {
  width: 32, height: 32, borderRadius: '50%',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#d4af37', fontSize: 13, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};