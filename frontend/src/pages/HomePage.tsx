// frontend/src/pages/HomePage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useWallet } from '../hooks/useWallet';
import { getAllActiveTracks } from '../utils/contractUtils';
import { getBatchViewCounts, recordView } from '../utils/apiClient';
import { TipModal } from '../components/TipModal';
import type { TrackStruct } from '../abi/ABI/index';

const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

interface HomePageProps {
  player: {
    play: (track: any) => void;
    currentTrack: any;
    isPlaying: boolean;
    togglePlay: () => void;
  };
}

export const HomePage: React.FC<HomePageProps> = ({ player }) => {
  const { isConnected, account } = useWallet();
  const [tracks, setTracks]       = useState<TrackStruct[]>([]);
  const [views, setViews]         = useState<Record<string, number>>({});
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [searchQ, setSearchQ]     = useState('');
  const [tipTarget, setTipTarget] = useState<TrackStruct | null>(null);

  // ── Load tracks ──────────────────────────────────────────
  const loadTracks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const raw = await getAllActiveTracks();
      setTracks(raw as TrackStruct[]);

      // batch view counts
      if (raw.length > 0) {
        const ids = raw.map((t: TrackStruct) => String(t.trackId));
        const v   = await getBatchViewCounts(ids);
        setViews(v);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Không thể load tracks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTracks(); }, [loadTracks]);

  // ── Play a track ─────────────────────────────────────────
  const handlePlay = async (track: TrackStruct) => {
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

      await recordView(Number(track.trackId));  
    };

  // ── Filter ───────────────────────────────────────────────
  const filtered = tracks.filter(t =>
    t.title.toLowerCase().includes(searchQ.toLowerCase()) ||
    t.creator.toLowerCase().includes(searchQ.toLowerCase())
  );

  const formatTCT = (wei: bigint) => {
    const v = Number(wei) / 1e18;
    return v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toFixed(1);
  };

  const formatAddr = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const isPlayingTrack = (t: TrackStruct) =>
    player.currentTrack?.trackId === Number(t.trackId) && player.isPlaying;

  // ─────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(24px, 6vw, 40px)' }}>

      {/* ── Hero ─────────────────────────────────────────── */}
      <div style={{
        position: 'relative', borderRadius: 16, overflow: 'hidden',
        padding: 'clamp(32px, 8vw, 56px) clamp(24px, 6vw, 48px)',
        background: 'linear-gradient(135deg, #0f0e1a 0%, #13111f 60%, #1a1308 100%)',
        border: '1px solid rgba(212, 175, 55, 0.15)',
      }}>
        <div style={{
          position: 'absolute', top: -60, right: -60,
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -40, left: -40,
          width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(100,80,200,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'inline-block', padding: '4px 14px', borderRadius: 20,
            border: '1px solid rgba(212,175,55,0.3)',
            background: 'rgba(212,175,55,0.06)',
            fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.2em',
            textTransform: 'uppercase', color: '#d4af37', marginBottom: 20,
          }}>
            ◈ Blockchain Music Platform
          </div>

          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(28px, 6vw, 52px)', fontWeight: 700,
            color: '#f0e6c8', lineHeight: 1.15, marginBottom: 16,
            letterSpacing: '-0.01em',
          }}>
            Your Music,<br />
            <span style={{
              background: 'linear-gradient(90deg, #d4af37, #f5d06e)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>On-Chain Forever</span>
          </h2>

          <p style={{
            fontFamily: "'Georgia', serif", fontSize: 16,
            color: '#8a8070', maxWidth: 480, lineHeight: 1.7, marginBottom: 28,
          }}>
            Upload, manage, and monetize your music through decentralized technology.
            Own your art. Earn directly.
          </p>

          {isConnected ? (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '10px 20px', borderRadius: 8,
              background: 'rgba(34, 197, 94, 0.08)',
              border: '1px solid rgba(34,197,94,0.2)',
              fontFamily: 'monospace', fontSize: 12, color: '#4ade80',
              letterSpacing: '0.08em',
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: '#22c55e', boxShadow: '0 0 6px #22c55e',
                display: 'inline-block',
              }} />
              {account}
            </div>
          ) : (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 8,
              background: 'rgba(212,175,55,0.08)',
              border: '1px dashed rgba(212,175,55,0.3)',
              fontFamily: 'monospace', fontSize: 12, color: '#9a8a5a',
              letterSpacing: '0.1em',
            }}>
              ◎ Connect your wallet to get started
            </div>
          )}
        </div>
      </div>

      {/* ── Tracks feed ──────────────────────────────────── */}
      <div>
        {/* Feed header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 20, flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <p style={{
              fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.2em',
              textTransform: 'uppercase', color: '#d4af37', marginBottom: 4,
            }}>♪ Discover</p>
            <h3 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 22, fontWeight: 700, color: '#f0e6c8',
            }}>
              Latest Tracks
              {!loading && (
                <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#5a5a6a', marginLeft: 12 }}>
                  ({filtered.length})
                </span>
              )}
            </h3>
          </div>

          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(212,175,55,0.15)',
            borderRadius: 8,
          }}>
            <span style={{ color: '#5a5a6a', fontSize: 14 }}>🔍</span>
            <input
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Tìm bài hát, tác giả..."
              style={{
                background: 'none', border: 'none', outline: 'none',
                color: '#e0d5b0', fontFamily: 'Georgia, serif', fontSize: 13,
                width: 200,
              }}
            />
            {searchQ && (
              <button
                onClick={() => setSearchQ('')}
                style={{ background: 'none', border: 'none', color: '#5a5a6a', cursor: 'pointer' }}
              >✕</button>
            )}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{
              display: 'inline-block', width: 32, height: 32,
              border: '2px solid rgba(212,175,55,0.2)',
              borderTopColor: '#d4af37', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#5a5a6a', marginTop: 12 }}>
              Đang tải từ blockchain...
            </p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{
            padding: '20px 24px', borderRadius: 10,
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.2)',
            fontFamily: 'monospace', fontSize: 13, color: '#f87171',
          }}>
            ⚠ {error}
            <button
              onClick={loadTracks}
              style={{
                marginLeft: 16, padding: '4px 12px', borderRadius: 6,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                color: '#f87171', cursor: 'pointer', fontFamily: 'monospace', fontSize: 11,
              }}
            >Thử lại</button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 32px' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              border: '1px dashed rgba(212,175,55,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', fontSize: 28, color: '#d4af37', opacity: 0.4,
            }}>♪</div>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: '#5a5a6a' }}>
              {searchQ ? 'Không tìm thấy kết quả' : 'Chưa có bài hát nào trên platform'}
            </p>
          </div>
        )}

        {/* Track grid */}
        {!loading && filtered.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16,
          }}>
            {filtered.map(track => {
              const playing    = isPlayingTrack(track);
              const viewCount  = views[String(track.trackId)] ?? 0;
              const isSelf     = account?.toLowerCase() === String(track.creator).toLowerCase();

              return (
                <div
                  key={String(track.trackId)}
                  style={{
                    background: playing ? 'rgba(212,175,55,0.05)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${playing ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 12,
                    overflow: 'hidden',
                    transition: 'border-color 0.2s',
                  }}
                >
                  {/* Cover area */}
                  <div
                    onClick={() => handlePlay(track)}
                    style={{
                      height: 120,
                      background: playing
                        ? 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(245,208,110,0.08))'
                        : 'rgba(255,255,255,0.02)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', position: 'relative',
                      transition: 'background 0.2s',
                    }}
                  >
                    <span style={{
                      fontSize: 36,
                      filter: playing ? 'drop-shadow(0 0 12px rgba(212,175,55,0.6))' : 'none',
                      transition: 'filter 0.2s',
                    }}>
                      {playing ? '⏸' : '▶'}
                    </span>

                    {playing && (
                      <div style={{
                        position: 'absolute', bottom: 8, left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex', alignItems: 'flex-end', gap: 3, height: 16,
                      }}>
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} style={{
                            width: 3, borderRadius: 2,
                            background: '#d4af37',
                            animation: `eq${i} 0.6s ease-in-out infinite alternate`,
                          }} />
                        ))}
                        <style>{`
                          @keyframes eq1{from{height:4px}to{height:16px}}
                          @keyframes eq2{from{height:8px}to{height:10px};animation-delay:0.1s}
                          @keyframes eq3{from{height:6px}to{height:14px};animation-delay:0.2s}
                          @keyframes eq4{from{height:4px}to{height:12px};animation-delay:0.3s}
                        `}</style>
                      </div>
                    )}

                    {/* Track ID badge */}
                    <span style={{
                      position: 'absolute', top: 8, right: 8,
                      fontFamily: 'monospace', fontSize: 10, color: '#4a4a5a',
                      background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: 4,
                    }}>
                      #{String(track.trackId)}
                    </span>
                  </div>

                  {/* Info */}
                  <div style={{ padding: '14px 16px' }}>
                    <p style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: 15, color: '#f0e6c8', fontWeight: 600,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      marginBottom: 4,
                    }}>
                      {track.title}
                    </p>
                    <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#5a5a6a', marginBottom: 12 }}>
                      {formatAddr(String(track.creator))}
                      {viewCount > 0 && (
                        <span style={{ marginLeft: 10, color: '#4a4a5a' }}>
                          · {viewCount} plays
                        </span>
                      )}
                    </p>

                    {/* Footer: tips + tip button */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{
                        fontFamily: 'monospace', fontSize: 11,
                        color: track.totalTips > 0n ? '#d4af37' : '#3a3a4a',
                        letterSpacing: '0.08em',
                      }}>
                        💎 {formatTCT(track.totalTips)} TCT
                      </span>

                      {/* Tip button — disabled if own track */}
                      {isConnected && !isSelf && (
                        <button
                          onClick={() => setTipTarget(track)}
                          style={{
                            padding: '5px 14px', borderRadius: 6,
                            background: 'rgba(212,175,55,0.1)',
                            border: '1px solid rgba(212,175,55,0.25)',
                            color: '#d4af37',
                            fontFamily: 'monospace', fontSize: 11,
                            cursor: 'pointer', letterSpacing: '0.08em',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => {
                            (e.target as HTMLButtonElement).style.background = 'rgba(212,175,55,0.18)';
                          }}
                          onMouseLeave={e => {
                            (e.target as HTMLButtonElement).style.background = 'rgba(212,175,55,0.1)';
                          }}
                        >
                          Tip ♪
                        </button>
                      )}

                      {isConnected && isSelf && (
                        <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#4a4a5a', letterSpacing: '0.1em' }}>
                          YOUR TRACK
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tip modal */}
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
    </div>
  );
};