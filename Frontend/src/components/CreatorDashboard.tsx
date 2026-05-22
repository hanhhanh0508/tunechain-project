// frontend/src/components/CreatorDashboard.tsx
// Dashboard hiển thị stats của creator: uploads, plays, TCT escrow, ETH balance
// Dùng contractUtils + viewApi để lấy dữ liệu thật

import React, { useEffect, useState, useCallback } from 'react';
import {
  getTuneChain,
  getTuneToken,
  getProvider,
  getCreatorTrackIds,
  getEscrowInfo,
  getTCTBalance,
} from '../utils/contractUtils';
import { getBatchViewCounts } from '../utils/apiClient';
import { formatUnits } from 'ethers';

interface CreatorDashboardProps {
  creatorAddress: string;
}

interface Stats {
  totalUploads: number;
  totalPlays: number;
  tctBalance: string;       // TCT trong ví
  escrowBalance: string;    // TCT đang lock escrow
  ethBalance: string;       // ETH trong ví
  totalTipsReceived: string; // Tổng TCT tips nhận (on-chain totalTips)
}

const EMPTY: Stats = {
  totalUploads: 0,
  totalPlays: 0,
  tctBalance: '0.00',
  escrowBalance: '0.00',
  ethBalance: '0.0000',
  totalTipsReceived: '0.00',
};

function fmt(wei: bigint, dec = 2): string {
  return Number(formatUnits(wei, 18)).toFixed(dec);
}

function fmtNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

export const CreatorDashboard: React.FC<CreatorDashboardProps> = ({ creatorAddress }) => {
  const [stats, setStats] = useState<Stats>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!creatorAddress) return;
    setLoading(true);
    setError('');

    try {
      const [contract, token, provider] = await Promise.all([
        getTuneChain(),
        getTuneToken(),
        getProvider(),
      ]);

      // 1. Track IDs của creator
      const trackIds = await getCreatorTrackIds(creatorAddress);
      const totalUploads = trackIds.length;

      // 2. Tổng tips nhận (on-chain) — sum totalTips từ từng track
      let totalTipsBigInt = 0n;
      for (const id of trackIds) {
        const track = await contract.tracks(id);
        totalTipsBigInt += track.totalTips as bigint;
      }

      // 3. Escrow info
      const { balance: escrowBal } = await getEscrowInfo(creatorAddress);

      // 4. TCT balance trong ví
      const tctRaw = await token.balanceOf(creatorAddress);

      // 5. ETH balance
      const ethRaw = await provider.getBalance(creatorAddress);

      // 6. Total plays từ backend
      let totalPlays = 0;
      if (trackIds.length > 0) {
        const views = await getBatchViewCounts(trackIds);
        totalPlays = Object.values(views).reduce((a, b) => a + b, 0);
      }

      setStats({
        totalUploads,
        totalPlays,
        tctBalance: fmt(tctRaw as bigint),
        escrowBalance: fmt(escrowBal),
        ethBalance: Number(formatUnits(ethRaw, 18)).toFixed(4),
        totalTipsReceived: fmt(totalTipsBigInt),
      });
    } catch (e: any) {
      setError(e?.message ?? 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [creatorAddress]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  // ─── UI ────────────────────────────────────────────────────

  const cards: Array<{
    label: string;
    value: string;
    sub?: string;
    accent: string;
    icon: string;
  }> = [
    {
      label: 'Total Uploads',
      value: fmtNumber(stats.totalUploads),
      accent: '#d4af37',
      icon: '♪',
    },
    {
      label: 'Total Plays',
      value: fmtNumber(stats.totalPlays),
      sub: 'lượt nghe',
      accent: '#60a5fa',
      icon: '▶',
    },
    {
      label: 'Tips Nhận',
      value: stats.totalTipsReceived,
      sub: 'TCT tổng cộng',
      accent: '#a78bfa',
      icon: '💎',
    },
    {
      label: 'Escrow',
      value: stats.escrowBalance,
      sub: 'TCT đang lock',
      accent: '#f59e0b',
      icon: '⏳',
    },
    {
      label: 'TCT Balance',
      value: stats.tctBalance,
      sub: 'trong ví',
      accent: '#34d399',
      icon: '◈',
    },
    {
      label: 'ETH Balance',
      value: stats.ethBalance,
      sub: 'ETH',
      accent: '#818cf8',
      icon: 'Ξ',
    },
  ];

  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.headerTag}>CREATOR STATS</span>
        <button
          onClick={load}
          disabled={loading}
          style={styles.refreshBtn}
          title="Làm mới"
        >
          {loading ? '⟳' : '↻'}
        </button>
      </div>

      {error && (
        <div style={styles.errorBanner}>⚠ {error}</div>
      )}

      {/* Grid */}
      <div style={styles.grid}>
        {cards.map((card, i) => (
          <StatCard key={i} {...card} loading={loading} />
        ))}
      </div>

      {/* Address strip */}
      <div style={styles.addressStrip}>
        <span style={{ color: '#4a4a5a', fontSize: 10, letterSpacing: '0.1em' }}>ADDRESS</span>
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#5a5a6a' }}>
          {creatorAddress.slice(0, 10)}...{creatorAddress.slice(-8)}
        </span>
      </div>
    </div>
  );
};

// ─── StatCard ──────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent: string;
  icon: string;
  loading: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, sub, accent, icon, loading }) => (
  <div style={{ ...styles.card, borderColor: `${accent}22` }}>
    {/* Icon glow */}
    <div style={{
      ...styles.iconBox,
      background: `${accent}14`,
      color: accent,
      boxShadow: `0 0 12px ${accent}22`,
    }}>
      {icon}
    </div>

    <div style={styles.cardBody}>
      <p style={styles.cardLabel}>{label}</p>
      {loading ? (
        <div style={{ ...styles.skeleton, width: 60 }} />
      ) : (
        <p style={{ ...styles.cardValue, color: accent }}>{value}</p>
      )}
      {sub && !loading && (
        <p style={styles.cardSub}>{sub}</p>
      )}
    </div>
  </div>
);

// ─── Styles ────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    background: 'rgba(255,255,255,0.015)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 14,
    padding: '20px 20px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTag: {
    fontFamily: 'monospace',
    fontSize: 10,
    letterSpacing: '0.2em',
    color: '#d4af37',
    opacity: 0.8,
  },
  refreshBtn: {
    background: 'none',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6,
    color: '#5a5a6a',
    cursor: 'pointer',
    fontSize: 14,
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.15s',
  },
  errorBanner: {
    background: 'rgba(239,68,68,0.07)',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: 8,
    padding: '8px 12px',
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#f87171',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10,
  },
  card: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid',
    borderRadius: 10,
    padding: '12px 14px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    transition: 'background 0.15s',
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
  },
  cardLabel: {
    fontFamily: 'monospace',
    fontSize: 9,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#4a4a5a',
    margin: '0 0 4px',
  },
  cardValue: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
    lineHeight: 1.1,
  },
  cardSub: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: '#4a4a5a',
    margin: '3px 0 0',
    letterSpacing: '0.05em',
  },
  skeleton: {
    height: 20,
    background: 'rgba(255,255,255,0.06)',
    borderRadius: 4,
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  addressStrip: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    paddingTop: 10,
  },
};