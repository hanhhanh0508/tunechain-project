// frontend/src/components/CreatorTrackList.tsx
import React, { useEffect, useState } from 'react';
import { getEscrowInfo, canWithdraw, withdrawTips } from '../utils/contractUtils';

interface TrackItem {
  trackId: number;
  title: string;
  totalTips: bigint;
  isActive: boolean;
  ipfsHash: string;
}

interface CreatorTrackListProps {
  tracks: TrackItem[];
  creatorAddress: string;
  onPlay: (track: TrackItem) => void;
  onRefresh?: () => void;
}

function formatTCT(wei: bigint): string {
  const tct = Number(wei) / 1e18;
  return tct.toFixed(2);
}

function formatCountdown(unlockTime: bigint): string {
  const now = BigInt(Math.floor(Date.now() / 1000));
  if (unlockTime <= now) return '';
  const diff = Number(unlockTime - now);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export const CreatorTrackList: React.FC<CreatorTrackListProps> = ({
  tracks,
  creatorAddress,
  onPlay,
  onRefresh,
}) => {
  const [escrow, setEscrow] = useState<{ balance: bigint; unlockTime: bigint } | null>(null);
  const [canDraw, setCanDraw] = useState(false);
  const [withdrawStatus, setWithdrawStatus] = useState<'idle' | 'pending' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState('');

  // Load escrow info
  useEffect(() => {
    if (!creatorAddress) return;
    let mounted = true;
    const load = async () => {
      try {
        const info = await getEscrowInfo(creatorAddress);
        const draw = await canWithdraw(creatorAddress);
        if (!mounted) return;
        setEscrow(info);
        setCanDraw(draw);
      } catch {
        // ignore
      }
    };
    load();
    const interval = setInterval(load, 15_000);
    return () => { mounted = false; clearInterval(interval); };
  }, [creatorAddress]);

  // Countdown timer
  useEffect(() => {
    if (!escrow || escrow.unlockTime === 0n) return;
    const tick = () => setCountdown(formatCountdown(escrow.unlockTime));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [escrow]);

  const handleWithdraw = async () => {
    setWithdrawStatus('pending');
    setErrorMsg('');
    try {
      await withdrawTips();
      setWithdrawStatus('done');
      setCanDraw(false);
      setEscrow({ balance: 0n, unlockTime: 0n });
      onRefresh?.();
    } catch (e: any) {
      setErrorMsg(e?.reason ?? e?.message ?? 'Rút thất bại');
      setWithdrawStatus('error');
    }
  };

  if (tracks.length === 0) {
    return (
      <div style={{ padding: '48px 32px', textAlign: 'center' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          border: '1px dashed rgba(212,175,55,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px', fontSize: 22, color: '#d4af37', opacity: 0.4,
        }}>♪</div>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: 14, color: '#5a5a6a' }}>
          Chưa có tác phẩm nào
        </p>
      </div>
    );
  }

  const hasEscrow = escrow && escrow.balance > 0n;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Escrow summary box */}
      {hasEscrow && (
        <div style={{
          padding: '16px 20px',
          borderRadius: 10,
          background: canDraw ? 'rgba(34,197,94,0.06)' : 'rgba(212,175,55,0.06)',
          border: `1px solid ${canDraw ? 'rgba(34,197,94,0.25)' : 'rgba(212,175,55,0.2)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <p style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#5a5a6a', marginBottom: 4 }}>
              Escrow Balance
            </p>
            <p style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 22, fontWeight: 700,
              color: canDraw ? '#4ade80' : '#d4af37',
            }}>
              {formatTCT(escrow!.balance)} TCT
            </p>
            {!canDraw && countdown && (
              <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#6b6b7b', marginTop: 4 }}>
                ⏳ Unlock trong {countdown}
              </p>
            )}
          </div>

          <div>
            {withdrawStatus === 'done' ? (
              <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#4ade80' }}>✓ Đã rút thành công</p>
            ) : (
              <button
                onClick={handleWithdraw}
                disabled={!canDraw || withdrawStatus === 'pending'}
                title={!canDraw ? `Chưa đủ 24h — còn ${countdown}` : 'Rút tất cả TCT'}
                style={{
                  padding: '10px 20px', borderRadius: 8,
                  background: canDraw
                    ? 'linear-gradient(135deg, #22c55e, #4ade80)'
                    : 'rgba(255,255,255,0.04)',
                  color: canDraw ? '#0a1a0a' : '#4a4a5a',
                  border: `1px solid ${canDraw ? 'transparent' : 'rgba(255,255,255,0.06)'}`,
                  fontFamily: 'monospace', fontSize: 12, fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  cursor: canDraw ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                  boxShadow: canDraw ? '0 0 16px rgba(34,197,94,0.3)' : 'none',
                }}
              >
                {withdrawStatus === 'pending' ? '⏳ Đang rút...' : '↓ Rút TCT'}
              </button>
            )}
            {errorMsg && (
              <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#f87171', marginTop: 6 }}>
                ⚠ {errorMsg}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Track list */}
      {tracks.map(track => (
        <div
          key={track.trackId}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 8,
            opacity: track.isActive ? 1 : 0.5,
          }}
        >
          {/* Cover / Play */}
          <div
            onClick={() => onPlay(track)}
            style={{
              width: 44, height: 44, borderRadius: 8, flexShrink: 0,
              background: 'rgba(212,175,55,0.08)',
              border: '1px solid rgba(212,175,55,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, cursor: 'pointer', color: '#d4af37',
              transition: 'background 0.15s',
            }}
          >
            ▶
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 14, color: '#f0e6c8',
              margin: 0,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {track.title}
            </p>
            <p style={{ fontFamily: 'monospace', fontSize: 10, color: '#5a5a6a', margin: '3px 0 0', letterSpacing: '0.08em' }}>
              {formatTCT(track.totalTips)} TCT tips
              {' · '}
              {track.isActive
                ? <span style={{ color: '#4ade80' }}>Active</span>
                : <span style={{ color: '#f87171' }}>Inactive</span>}
            </p>
          </div>

          {/* Track ID badge */}
          <span style={{
            fontFamily: 'monospace', fontSize: 10, color: '#4a4a5a',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.05)',
            padding: '3px 8px', borderRadius: 4,
            letterSpacing: '0.08em', flexShrink: 0,
          }}>
            #{track.trackId}
          </span>
        </div>
      ))}
    </div>
  );
};