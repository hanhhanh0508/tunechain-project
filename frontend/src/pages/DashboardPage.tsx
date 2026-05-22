// frontend/src/pages/DashboardPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useWallet } from '../hooks/useWallet';
import { getCreatorTrackIds, getTrack, getEscrowInfo, canWithdraw, withdrawTips } from '../utils/contractUtils';
import { getBatchViewCounts } from '../utils/apiClient';

interface TrackItem {
  trackId: number;
  title: string;
  totalTips: bigint;
  isActive: boolean;
  ipfsHash: string;
  createdAt: bigint;
}

interface DashboardStats {
  totalUploads: number;
  totalPlays: number;
  escrowBalance: bigint;
  unlockTime: bigint;
  canWithdrawNow: boolean;
}

interface DashboardPageProps {
  player: {
    play: (track: any) => void;
    currentTrack: any;
    isPlaying: boolean;
    togglePlay: () => void;
  };
}

function formatTCT(wei: bigint): string {
  const tct = Number(wei) / 1e18;
  if (tct === 0) return '0';
  if (tct >= 1000) return `${(tct / 1000).toFixed(2)}K`;
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

function formatAddr(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatDate(ts: bigint): string {
  const d = new Date(Number(ts) * 1000);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ player }) => {
  const { isConnected, account } = useWallet();

  const [tracks, setTracks] = useState<TrackItem[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalUploads: 0,
    totalPlays: 0,
    escrowBalance: 0n,
    unlockTime: 0n,
    canWithdrawNow: false,
  });
  const [views, setViews] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState('');
  const [withdrawStatus, setWithdrawStatus] = useState<'idle' | 'pending' | 'done' | 'error'>('idle');
  const [withdrawError, setWithdrawError] = useState('');

  // ── Load dashboard data ──────────────────────────────────
  const loadDashboard = useCallback(async () => {
    if (!account) return;
    setLoading(true);
    setError('');

    try {
      // 1. Get creator track IDs
      const ids: number[] = await getCreatorTrackIds(account);

      // 2. Load each track's full data
      const trackData: TrackItem[] = await Promise.all(
        ids.map(async (id) => {
          const t = await getTrack(id);
          return {
            trackId: Number(t.trackId),
            title: t.title,
            totalTips: t.totalTips as bigint,
            isActive: t.isActive as boolean,
            ipfsHash: t.ipfsHash,
            createdAt: t.createdAt as bigint,
          };
        })
      );
      setTracks(trackData);

      // 3. Batch view counts
      let totalPlays = 0;
      if (ids.length > 0) {
        const viewMap = await getBatchViewCounts(ids.map(String));
        setViews(viewMap);
        totalPlays = Object.values(viewMap).reduce((sum, v) => sum + v, 0);
      }

      // 4. Escrow info
      const [balance, unlockTime] = await Promise.all([
        getEscrowInfo(account).then(r => r.balance),
        getEscrowInfo(account).then(r => r.unlockTime),
      ]);
      const canDraw = await canWithdraw(account);

      setStats({
        totalUploads: ids.length,
        totalPlays,
        escrowBalance: balance,
        unlockTime,
        canWithdrawNow: canDraw,
      });
    } catch (e: any) {
      setError(e?.message ?? 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    if (isConnected && account) {
      loadDashboard();
    }
  }, [isConnected, account, loadDashboard]);

  // ── Countdown timer ──────────────────────────────────────
  useEffect(() => {
    if (!stats.unlockTime || stats.unlockTime === 0n) { setCountdown(''); return; }
    const tick = () => setCountdown(formatCountdown(stats.unlockTime));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [stats.unlockTime]);

  // ── Withdraw ─────────────────────────────────────────────
  const handleWithdraw = async () => {
    setWithdrawStatus('pending');
    setWithdrawError('');
    try {
      await withdrawTips();
      setWithdrawStatus('done');
      await loadDashboard();
    } catch (e: any) {
      setWithdrawError(e?.reason ?? e?.message ?? 'Rút thất bại');
      setWithdrawStatus('error');
    }
  };

  // ── Play handler ─────────────────────────────────────────
  const handlePlay = (track: TrackItem) => {
    const isCurrentPlaying =
      player.currentTrack?.trackId === track.trackId && player.isPlaying;
    if (isCurrentPlaying) {
      player.togglePlay();
      return;
    }
    player.play({
      trackId: track.trackId,
      title: track.title,
      creator: account ?? '',
      ipfsHash: track.ipfsHash,
      totalTips: track.totalTips,
      isActive: track.isActive,
      createdAt: track.createdAt,
    });
  };

  // ── Not connected ────────────────────────────────────────
  if (!isConnected) {
    return (
      <div style={{
        background: 'rgba(212,175,55,0.04)',
        border: '1px solid rgba(212,175,55,0.15)',
        borderRadius: 12, padding: '48px 32px', textAlign: 'center',
      }}>
        <div style={{ fontSize: 32, marginBottom: 16, color: '#d4af37' }}>◎</div>
        <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, color: '#c8b88a' }}>
          Connect your wallet to access your dashboard
        </p>
      </div>
    );
  }

  const hasEscrow = stats.escrowBalance > 0n;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* ── Page header ───────────────────────────────────── */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 20 }}>
        <p style={{
          fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.2em',
          textTransform: 'uppercase', color: '#d4af37', marginBottom: 8,
        }}>◈ Overview</p>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 30, fontWeight: 700, color: '#f0e6c8', margin: 0,
          }}>Dashboard</h2>
          <button
            onClick={loadDashboard}
            disabled={loading}
            style={{
              padding: '6px 14px', borderRadius: 6,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#6b6b7b', fontFamily: 'monospace', fontSize: 11,
              cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '0.08em',
            }}
          >
            {loading ? '⟳ Loading...' : '⟳ Refresh'}
          </button>
        </div>
      </div>

      {/* ── Error ─────────────────────────────────────────── */}
      {error && (
        <div style={{
          padding: '12px 16px', borderRadius: 8,
          background: 'rgba(239,68,68,0.07)',
          border: '1px solid rgba(239,68,68,0.2)',
          fontFamily: 'monospace', fontSize: 12, color: '#f87171',
        }}>
          ⚠ {error}
        </div>
      )}

      {/* ── Stats cards ───────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
      }}>
        {/* Total Uploads */}
        <StatCard
          label="Total Uploads"
          value={loading ? '—' : String(stats.totalUploads)}
          accent="linear-gradient(90deg, #d4af37, transparent)"
          icon="♪"
          sub={stats.totalUploads === 1 ? '1 track on-chain' : `${stats.totalUploads} tracks on-chain`}
        />

        {/* Total Plays */}
        <StatCard
          label="Total Plays"
          value={loading ? '—' : stats.totalPlays.toLocaleString()}
          accent="linear-gradient(90deg, #22c55e, transparent)"
          icon="▶"
          sub="across all tracks"
        />

        {/* Escrow / Earnings */}
        <StatCard
          label="Escrow Balance"
          value={loading ? '—' : `${formatTCT(stats.escrowBalance)} TCT`}
          accent="linear-gradient(90deg, #818cf8, transparent)"
          icon="💎"
          sub={
            stats.escrowBalance === 0n
              ? 'no tips yet'
              : stats.canWithdrawNow
              ? 'ready to withdraw!'
              : countdown
              ? `unlocks in ${countdown}`
              : 'locked'
          }
          highlight={stats.canWithdrawNow && stats.escrowBalance > 0n}
        />
      </div>

      {/* ── Escrow withdraw box ───────────────────────────── */}
      {hasEscrow && (
        <div style={{
          padding: '20px 24px', borderRadius: 12,
          background: stats.canWithdrawNow ? 'rgba(34,197,94,0.05)' : 'rgba(212,175,55,0.04)',
          border: `1px solid ${stats.canWithdrawNow ? 'rgba(34,197,94,0.25)' : 'rgba(212,175,55,0.15)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16,
        }}>
          <div>
            <p style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#5a5a6a', marginBottom: 6 }}>
              💎 Tips in Escrow
            </p>
            <p style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 28, fontWeight: 700,
              color: stats.canWithdrawNow ? '#4ade80' : '#d4af37',
            }}>
              {formatTCT(stats.escrowBalance)} TCT
            </p>
            {!stats.canWithdrawNow && countdown && (
              <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#6b6b7b', marginTop: 4 }}>
                ⏳ Unlock in {countdown}
              </p>
            )}
            {stats.canWithdrawNow && (
              <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#4ade80', marginTop: 4 }}>
                ✓ Ready to withdraw
              </p>
            )}
          </div>

          <div style={{ textAlign: 'right' }}>
            {withdrawStatus === 'done' ? (
              <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#4ade80' }}>
                ✓ Withdrawn successfully
              </p>
            ) : (
              <>
                <button
                  onClick={handleWithdraw}
                  disabled={!stats.canWithdrawNow || withdrawStatus === 'pending'}
                  title={!stats.canWithdrawNow ? `Still locked — ${countdown} remaining` : 'Withdraw all TCT tips'}
                  style={{
                    padding: '10px 22px', borderRadius: 8,
                    background: stats.canWithdrawNow
                      ? 'linear-gradient(135deg, #22c55e, #4ade80)'
                      : 'rgba(255,255,255,0.04)',
                    color: stats.canWithdrawNow ? '#0a1a0a' : '#4a4a5a',
                    border: `1px solid ${stats.canWithdrawNow ? 'transparent' : 'rgba(255,255,255,0.06)'}`,
                    fontFamily: 'monospace', fontSize: 12, fontWeight: 700,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    cursor: stats.canWithdrawNow ? 'pointer' : 'not-allowed',
                    boxShadow: stats.canWithdrawNow ? '0 0 16px rgba(34,197,94,0.3)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  {withdrawStatus === 'pending' ? '⏳ Withdrawing...' : '↓ Withdraw TCT'}
                </button>
                {withdrawError && (
                  <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#f87171', marginTop: 6 }}>
                    ⚠ {withdrawError}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Track list ────────────────────────────────────── */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12, overflow: 'hidden',
      }}>
        <div style={{
          padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ color: '#d4af37', fontSize: 14 }}>♪</span>
          <h3 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 17, fontWeight: 600, color: '#e0d5b0', margin: 0,
          }}>Your Music Library</h3>
          {!loading && tracks.length > 0 && (
            <span style={{
              marginLeft: 'auto', fontFamily: 'monospace', fontSize: 10,
              color: '#5a5a6a', letterSpacing: '0.1em',
            }}>
              {tracks.length} track{tracks.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div style={{ padding: '32px 24px', textAlign: 'center' }}>
            <div style={{
              display: 'inline-block', width: 28, height: 28,
              border: '2px solid rgba(212,175,55,0.2)',
              borderTopColor: '#d4af37', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#5a5a6a', marginTop: 10 }}>
              Loading your tracks...
            </p>
          </div>
        )}

        {/* Empty state */}
        {!loading && tracks.length === 0 && (
          <div style={{ padding: '56px 32px', textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              border: '1px dashed rgba(212,175,55,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', fontSize: 22, color: '#d4af37', opacity: 0.5,
            }}>♪</div>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: 15, color: '#5a5a6a' }}>
              No music uploaded yet
            </p>
            <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#3a3a4a', marginTop: 8, letterSpacing: '0.1em' }}>
              Navigate to Upload to add your first track
            </p>
          </div>
        )}

        {/* Track rows */}
        {!loading && tracks.length > 0 && (
          <div style={{ padding: '8px 0' }}>
            {tracks.map((track, idx) => {
              const isPlaying =
                player.currentTrack?.trackId === track.trackId && player.isPlaying;
              const trackViews = views[String(track.trackId)] ?? 0;

              return (
                <div
                  key={track.trackId}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '12px 24px',
                    background: isPlaying ? 'rgba(212,175,55,0.05)' : 'transparent',
                    borderBottom: idx < tracks.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    transition: 'background 0.15s',
                  }}
                >
                  {/* Play button */}
                  <button
                    onClick={() => handlePlay(track)}
                    disabled={!track.isActive}
                    style={{
                      width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                      background: isPlaying
                        ? 'linear-gradient(135deg, rgba(212,175,55,0.3), rgba(245,208,110,0.15))'
                        : 'rgba(212,175,55,0.07)',
                      border: `1px solid ${isPlaying ? 'rgba(212,175,55,0.4)' : 'rgba(212,175,55,0.12)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, color: track.isActive ? '#d4af37' : '#3a3a4a',
                      cursor: track.isActive ? 'pointer' : 'not-allowed',
                      transition: 'all 0.15s',
                    }}
                  >
                    {isPlaying ? '⏸' : '▶'}
                  </button>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: 14, color: isPlaying ? '#f5d06e' : '#f0e6c8',
                      margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {track.title}
                    </p>
                    <p style={{ fontFamily: 'monospace', fontSize: 10, color: '#5a5a6a', margin: '3px 0 0', letterSpacing: '0.06em' }}>
                      {formatDate(track.createdAt)}
                      {' · '}
                      <span style={{ color: trackViews > 0 ? '#6b6b7b' : '#3a3a4a' }}>
                        {trackViews.toLocaleString()} plays
                      </span>
                      {' · '}
                      {track.isActive
                        ? <span style={{ color: '#4ade80' }}>Active</span>
                        : <span style={{ color: '#f87171' }}>Inactive</span>}
                    </p>
                  </div>

                  {/* Tips earned */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{
                      fontFamily: 'monospace', fontSize: 12,
                      color: track.totalTips > 0n ? '#d4af37' : '#3a3a4a',
                      letterSpacing: '0.06em',
                    }}>
                      💎 {formatTCT(track.totalTips)} TCT
                    </p>
                  </div>

                  {/* Track ID badge */}
                  <span style={{
                    fontFamily: 'monospace', fontSize: 10, color: '#4a4a5a',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    padding: '2px 8px', borderRadius: 4,
                    letterSpacing: '0.06em', flexShrink: 0,
                  }}>
                    #{track.trackId}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Account info ──────────────────────────────────── */}
      <div style={{
        padding: '12px 18px',
        background: 'rgba(255,255,255,0.012)',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.05)',
      }}>
        <p style={{ fontFamily: 'monospace', fontSize: 10, color: '#4a4a5a', letterSpacing: '0.1em' }}>
          ACCOUNT · <span style={{ color: '#5a5a6a' }}>{account}</span>
        </p>
      </div>
    </div>
  );
};

// ── Stat Card component ──────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string;
  accent: string;
  icon: string;
  sub?: string;
  highlight?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, accent, icon, sub, highlight }) => (
  <div style={{
    background: highlight ? 'rgba(34,197,94,0.04)' : 'rgba(255,255,255,0.02)',
    border: `1px solid ${highlight ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.07)'}`,
    borderRadius: 12,
    padding: '24px 22px',
    position: 'relative',
    overflow: 'hidden',
    transition: 'border-color 0.2s',
  }}>
    {/* Top accent bar */}
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0,
      height: 2, background: accent,
    }} />

    {/* Icon */}
    <div style={{
      position: 'absolute', top: 16, right: 18,
      fontSize: 20, opacity: 0.18,
    }}>
      {icon}
    </div>

    <p style={{
      fontFamily: 'monospace', fontSize: 10,
      letterSpacing: '0.18em', textTransform: 'uppercase',
      color: '#5a5a6a', marginBottom: 10,
    }}>
      {label}
    </p>

    <p style={{
      fontFamily: "'Playfair Display', Georgia, serif",
      fontSize: 32, fontWeight: 700,
      color: highlight ? '#4ade80' : '#f0e6c8',
      lineHeight: 1, marginBottom: sub ? 8 : 0,
    }}>
      {value}
    </p>

    {sub && (
      <p style={{
        fontFamily: 'monospace', fontSize: 10,
        color: highlight ? '#4ade80' : '#4a4a5a',
        letterSpacing: '0.08em',
      }}>
        {sub}
      </p>
    )}
  </div>
);