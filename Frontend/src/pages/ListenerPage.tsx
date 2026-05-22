// frontend/src/pages/ListenerPage.tsx
// Trang chính cho Listener: browse nhạc, nghe, tip, report
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useWallet } from '../hooks/useWallet';
import { getAllActiveTracks, reportTrack } from '../utils/contractUtils';
import { getBatchViewCounts, recordView } from '../utils/apiClient';
import { TipModal } from '../components/TipModal';
import { ReportModal } from '../components/listener/ReportModal';
import { TrackCard } from '../components/listener/TrackCard';
import { ListenerStats } from '../components/listener/ListenerStats';
import { NowPlayingBar } from '../components/listener/NowPlayingBar';
import type { TrackStruct } from '../abi/ABI/index';

type SortMode = 'latest' | 'top-tipped' | 'most-played';
type FilterMode = 'all' | 'tipped' | 'new';

interface ListenerPageProps {
  player: {
    play: (track: any) => void;
    pause: () => void;
    resume: () => void;
    togglePlay: () => void;
    seek: (percent: number) => void;
    currentTrack: any;
    isPlaying: boolean;
    progress: number;
    currentTime: number;
    duration: number;
  };
}

export const ListenerPage: React.FC<ListenerPageProps> = ({ player }) => {
  const { isConnected, account } = useWallet();

  const [tracks, setTracks]         = useState<TrackStruct[]>([]);
  const [views, setViews]           = useState<Record<string, number>>({});
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [searchQ, setSearchQ]       = useState('');
  const [sortMode, setSortMode]     = useState<SortMode>('latest');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [tipTarget, setTipTarget]   = useState<TrackStruct | null>(null);
  const [reportTarget, setReportTarget] = useState<TrackStruct | null>(null);
  const [playHistory, setPlayHistory]   = useState<Set<string>>(new Set());
  const searchRef = useRef<HTMLInputElement>(null);

  // ── Load tracks ──────────────────────────────────────────
  const loadTracks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const raw = await getAllActiveTracks();
      setTracks(raw as TrackStruct[]);

      if (raw.length > 0) {
        const ids = raw.map((t: TrackStruct) => String(t.trackId));
        const v = await getBatchViewCounts(ids);
        setViews(v);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Không thể tải danh sách nhạc');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTracks(); }, [loadTracks]);

  // ── Play handler ─────────────────────────────────────────
  const handlePlay = useCallback(async (track: TrackStruct) => {
    const id = String(track.trackId);
    const isCurrentPlaying =
      player.currentTrack?.trackId === Number(track.trackId) && player.isPlaying;

    if (isCurrentPlaying) {
      player.togglePlay();
      return;
    }

    player.play({
      trackId:   Number(track.trackId),
      title:     track.title,
      creator:   track.creator,
      ipfsHash:  track.ipfsHash,
      totalTips: track.totalTips,
      isActive:  track.isActive,
      createdAt: track.createdAt,
    });

    // Record view (once per session per track)
    if (!playHistory.has(id)) {
      setPlayHistory(prev => new Set([...prev, id]));
      await recordView(id);
      // Refresh view counts
      setViews(prev => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
    }
  }, [player, playHistory]);

  // ── Report submit ────────────────────────────────────────
  const handleReport = useCallback(async (trackId: number, reason: string) => {
    await reportTrack(trackId, reason);
    setReportTarget(null);
  }, []);

  // ── Sort & filter ────────────────────────────────────────
  const processedTracks = React.useMemo(() => {
    let list = [...tracks];

    // Filter by search
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.creator.toLowerCase().includes(q)
      );
    }

    // Filter mode
    if (filterMode === 'tipped') {
      list = list.filter(t => t.totalTips > 0n);
    } else if (filterMode === 'new') {
      // Last 24h tracks (createdAt > now - 86400)
      const cutoff = BigInt(Math.floor(Date.now() / 1000) - 86400);
      list = list.filter(t => t.createdAt > cutoff);
    }

    // Sort
    if (sortMode === 'latest') {
      list.sort((a, b) => Number(b.createdAt - a.createdAt));
    } else if (sortMode === 'top-tipped') {
      list.sort((a, b) => Number(b.totalTips - a.totalTips));
    } else if (sortMode === 'most-played') {
      list.sort((a, b) =>
        (views[String(b.trackId)] ?? 0) - (views[String(a.trackId)] ?? 0)
      );
    }

    return list;
  }, [tracks, searchQ, sortMode, filterMode, views]);

  const totalPlays = Object.values(views).reduce((sum, v) => sum + v, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, paddingBottom: 100 }}>

      {/* ── Stats strip ──────────────────────────────────── */}
      <ListenerStats
        totalTracks={tracks.length}
        totalPlays={totalPlays}
        tracksWithTips={tracks.filter(t => t.totalTips > 0n).length}
        isConnected={isConnected}
      />

      {/* ── Controls bar ─────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12,
      }}>
        {/* Search */}
        <div style={{
          flex: 1, minWidth: 200,
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 16px',
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
        }}>
          <span style={{ color: '#5a5a6a', fontSize: 15 }}>🔍</span>
          <input
            ref={searchRef}
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Tìm bài hát, tác giả..."
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: '#e0d5b0', fontFamily: 'Georgia, serif', fontSize: 13,
            }}
          />
          {searchQ && (
            <button
              onClick={() => { setSearchQ(''); searchRef.current?.focus(); }}
              style={{ background: 'none', border: 'none', color: '#5a5a6a', cursor: 'pointer', fontSize: 16 }}
            >✕</button>
          )}
        </div>

        {/* Sort buttons */}
        <div style={{ display: 'flex', gap: 6 }}>
          {([
            { key: 'latest',      label: '↓ Mới nhất' },
            { key: 'top-tipped',  label: '💎 Top Tip' },
            { key: 'most-played', label: '▶ Nhiều play' },
          ] as { key: SortMode; label: string }[]).map(s => (
            <button
              key={s.key}
              onClick={() => setSortMode(s.key)}
              style={{
                padding: '7px 14px', borderRadius: 6, cursor: 'pointer',
                fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.06em',
                background: sortMode === s.key ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${sortMode === s.key ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.07)'}`,
                color: sortMode === s.key ? '#d4af37' : '#6b6b7b',
                transition: 'all 0.15s',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 6 }}>
          {([
            { key: 'all',    label: 'Tất cả' },
            { key: 'tipped', label: '💎 Có tip' },
            { key: 'new',    label: '🆕 24h' },
          ] as { key: FilterMode; label: string }[]).map(f => (
            <button
              key={f.key}
              onClick={() => setFilterMode(f.key)}
              style={{
                padding: '7px 12px', borderRadius: 20, cursor: 'pointer',
                fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.08em',
                background: filterMode === f.key ? 'rgba(100,80,200,0.15)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${filterMode === f.key ? 'rgba(100,80,200,0.4)' : 'rgba(255,255,255,0.07)'}`,
                color: filterMode === f.key ? '#a78bfa' : '#5a5a6a',
                transition: 'all 0.15s',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Refresh */}
        <button
          onClick={loadTracks}
          disabled={loading}
          style={{
            padding: '7px 12px', borderRadius: 6, cursor: 'pointer',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            color: '#5a5a6a', fontFamily: 'monospace', fontSize: 11,
          }}
        >
          {loading ? '⟳' : '⟳ Làm mới'}
        </button>
      </div>

      {/* ── Result count ─────────────────────────────────── */}
      {!loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontFamily: 'monospace', fontSize: 11, color: '#4a4a5a',
            letterSpacing: '0.1em',
          }}>
            {processedTracks.length} bài hát
            {searchQ && ` cho "${searchQ}"`}
          </span>
          {processedTracks.length !== tracks.length && (
            <button
              onClick={() => { setSearchQ(''); setFilterMode('all'); }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'monospace', fontSize: 10, color: '#d4af37',
                letterSpacing: '0.08em',
              }}
            >
              Xóa bộ lọc ×
            </button>
          )}
        </div>
      )}

      {/* ── Loading ───────────────────────────────────────── */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <WaveLoader />
          <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#5a5a6a', marginTop: 16 }}>
            Đang tải từ blockchain...
          </p>
        </div>
      )}

      {/* ── Error ────────────────────────────────────────── */}
      {error && !loading && (
        <div style={{
          padding: '16px 20px', borderRadius: 10,
          background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
          fontFamily: 'monospace', fontSize: 12, color: '#f87171',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span>⚠ {error}</span>
          <button
            onClick={loadTracks}
            style={{
              padding: '4px 12px', borderRadius: 5,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#f87171', cursor: 'pointer', fontFamily: 'monospace', fontSize: 11,
            }}
          >Thử lại</button>
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────── */}
      {!loading && !error && processedTracks.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 32px' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            border: '1px dashed rgba(212,175,55,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', fontSize: 30, color: '#d4af37', opacity: 0.4,
          }}>♪</div>
          <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, color: '#5a5a6a' }}>
            {searchQ ? 'Không tìm thấy kết quả' : 'Chưa có bài hát nào'}
          </p>
          {searchQ && (
            <button
              onClick={() => setSearchQ('')}
              style={{
                marginTop: 16, padding: '8px 20px', borderRadius: 6,
                background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)',
                color: '#d4af37', cursor: 'pointer', fontFamily: 'monospace', fontSize: 11,
              }}
            >
              Xóa tìm kiếm
            </button>
          )}
        </div>
      )}

      {/* ── Track grid ───────────────────────────────────── */}
      {!loading && processedTracks.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
          gap: 16,
        }}>
          {processedTracks.map(track => (
            <TrackCard
              key={String(track.trackId)}
              track={track}
              viewCount={views[String(track.trackId)] ?? 0}
              isPlaying={
                player.currentTrack?.trackId === Number(track.trackId) && player.isPlaying
              }
              isCurrentTrack={player.currentTrack?.trackId === Number(track.trackId)}
              isConnected={isConnected}
              currentAccount={account}
              onPlay={() => handlePlay(track)}
              onTip={() => setTipTarget(track)}
              onReport={() => setReportTarget(track)}
            />
          ))}
        </div>
      )}

      {/* ── Now Playing Bar ───────────────────────────────── */}
      {player.currentTrack && (
        <NowPlayingBar
          track={player.currentTrack}
          isPlaying={player.isPlaying}
          progress={player.progress}
          currentTime={player.currentTime}
          duration={player.duration}
          onTogglePlay={player.togglePlay}
          onSeek={player.seek}
        />
      )}

      {/* ── Modals ───────────────────────────────────────── */}
      {tipTarget && (
        <TipModal
          track={tipTarget}
          onClose={() => setTipTarget(null)}
          onSuccess={() => {
            setTipTarget(null);
            loadTracks();
          }}
        />
      )}

      {reportTarget && (
        <ReportModal
          track={reportTarget}
          onClose={() => setReportTarget(null)}
          onSubmit={handleReport}
        />
      )}
    </div>
  );
};

// ── Wave loader animation ────────────────────────────────────
const WaveLoader: React.FC = () => (
  <div style={{ display: 'inline-flex', alignItems: 'flex-end', gap: 4, height: 32 }}>
    <style>{`
      @keyframes wave1 { 0%,100%{height:8px} 50%{height:28px} }
      @keyframes wave2 { 0%,100%{height:14px} 50%{height:20px} }
      @keyframes wave3 { 0%,100%{height:6px} 50%{height:32px} }
      @keyframes wave4 { 0%,100%{height:18px} 50%{height:12px} }
      @keyframes wave5 { 0%,100%{height:10px} 50%{height:26px} }
    `}</style>
    {[1,2,3,4,5].map(i => (
      <div key={i} style={{
        width: 4, borderRadius: 2, background: '#d4af37',
        animation: `wave${i} 0.8s ease-in-out infinite`,
        animationDelay: `${(i-1) * 0.12}s`,
      }} />
    ))}
  </div>
);