// frontend/src/components/TipModal.tsx
import React, { useState } from 'react';
import { tipTrack } from '../utils/contractUtils';
import type { TrackStruct } from '../abi/ABI/index';

interface TipModalProps {
  track: TrackStruct;
  onClose: () => void;
  onSuccess?: (txHash: string) => void;
}

const PRESET_AMOUNTS = ['1', '5', '10', '50'];

export const TipModal: React.FC<TipModalProps> = ({ track, onClose, onSuccess }) => {
  const [amount, setAmount] = useState('5');
  const [status, setStatus] = useState<'idle' | 'approving' | 'pending' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [txHash, setTxHash] = useState('');

  const handleTip = async () => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setErrorMsg('Nhập số TCT hợp lệ (> 0)');
      return;
    }
    setErrorMsg('');
    setStatus('approving');
    try {
      const receipt = await tipTrack(Number(track.trackId), amount);
      setTxHash(receipt?.hash ?? '');
      setStatus('done');
      onSuccess?.(receipt?.hash ?? '');
    } catch (e: any) {
      setErrorMsg(e?.reason ?? e?.message ?? 'Giao dịch thất bại');
      setStatus('error');
    }
  };

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 200,
    background: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px',
  };

  const modal: React.CSSProperties = {
    background: '#0f0f1a',
    border: '1px solid rgba(212,175,55,0.25)',
    borderRadius: 14,
    padding: '32px 28px',
    width: '100%',
    maxWidth: 420,
    position: 'relative',
    boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 40px rgba(212,175,55,0.06)',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    color: '#f0e6c8',
    fontFamily: 'monospace',
    fontSize: 18,
    fontWeight: 700,
    outline: 'none',
    boxSizing: 'border-box',
    letterSpacing: '0.05em',
  };

  if (status === 'done') {
    return (
      <div style={overlay} onClick={onClose}>
        <div style={modal} onClick={e => e.stopPropagation()}>
          {/* Success state */}
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', fontSize: 28,
            }}>✓</div>
            <h3 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 22, color: '#f0e6c8', marginBottom: 8,
            }}>Tip thành công!</h3>
            <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b6b7b', marginBottom: 4 }}>
              Đã gửi <span style={{ color: '#d4af37' }}>{amount} TCT</span> cho
            </p>
            <p style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 16, color: '#c8b88a', marginBottom: 20,
            }}>
              {track.title}
            </p>
            {txHash && (
              <p style={{
                fontFamily: 'monospace', fontSize: 10, color: '#4a4a5a',
                wordBreak: 'break-all', marginBottom: 24,
              }}>
                TX: {txHash}
              </p>
            )}
            <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#5a5a6a', marginBottom: 24 }}>
              ⏳ TCT sẽ được giải phóng sau 24h escrow lock
            </p>
            <button
              onClick={onClose}
              style={{
                padding: '10px 32px', borderRadius: 8,
                background: 'linear-gradient(135deg, #d4af37, #f5d06e)',
                color: '#1a1400', border: 'none',
                fontFamily: 'monospace', fontSize: 12, fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isBusy = status === 'approving' || status === 'pending';

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'none', border: 'none',
            color: '#5a5a6a', cursor: 'pointer', fontSize: 18,
            lineHeight: 1,
          }}
        >✕</button>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <p style={{
            fontFamily: 'monospace', fontSize: 10,
            letterSpacing: '0.2em', textTransform: 'uppercase',
            color: '#d4af37', marginBottom: 6,
          }}>💎 Ủng hộ tác giả</p>
          <h3 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 20, color: '#f0e6c8',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {track.title}
          </h3>
          <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#5a5a6a', marginTop: 4 }}>
            {String(track.creator).slice(0, 6)}...{String(track.creator).slice(-4)}
          </p>
        </div>

        {/* Preset amounts */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {PRESET_AMOUNTS.map(p => (
            <button
              key={p}
              onClick={() => setAmount(p)}
              style={{
                flex: 1, padding: '8px 4px',
                borderRadius: 6,
                background: amount === p ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${amount === p ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.07)'}`,
                color: amount === p ? '#d4af37' : '#6b6b7b',
                fontFamily: 'monospace', fontSize: 12,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {p} TCT
            </button>
          ))}
        </div>

        {/* Custom amount input */}
        <div style={{ marginBottom: 20 }}>
          <label style={{
            fontFamily: 'monospace', fontSize: 10,
            letterSpacing: '0.15em', textTransform: 'uppercase',
            color: '#5a5a6a', display: 'block', marginBottom: 8,
          }}>
            Số lượng TCT
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="number"
              min="1"
              step="0.1"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              disabled={isBusy}
              style={inputStyle}
            />
            <span style={{
              position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
              fontFamily: 'monospace', fontSize: 12, color: '#d4af37', pointerEvents: 'none',
            }}>TCT</span>
          </div>
        </div>

        {/* Error */}
        {errorMsg && (
          <div style={{
            padding: '10px 14px', borderRadius: 8, marginBottom: 16,
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            fontFamily: 'monospace', fontSize: 12, color: '#f87171',
          }}>
            ⚠ {errorMsg}
          </div>
        )}

        {/* Info */}
        <div style={{
          padding: '10px 14px', borderRadius: 8, marginBottom: 20,
          background: 'rgba(212,175,55,0.05)',
          border: '1px solid rgba(212,175,55,0.1)',
          fontFamily: 'monospace', fontSize: 11, color: '#9a8a5a',
          lineHeight: 1.6,
        }}>
          ⏳ Escrow lock 24h — tác giả rút được sau 24h kể từ tip cuối
        </div>

        {/* Tip button */}
        <button
          onClick={handleTip}
          disabled={isBusy}
          style={{
            width: '100%', padding: '13px',
            borderRadius: 8,
            background: isBusy
              ? 'rgba(212,175,55,0.2)'
              : 'linear-gradient(135deg, #d4af37, #f5d06e)',
            color: isBusy ? '#d4af37' : '#1a1400',
            border: 'none',
            fontFamily: 'monospace', fontSize: 13, fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            cursor: isBusy ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            boxShadow: isBusy ? 'none' : '0 0 20px rgba(212,175,55,0.3)',
          }}
        >
          {status === 'approving'
            ? '⏳ Đang approve TCT...'
            : status === 'pending'
            ? '⏳ Đang gửi giao dịch...'
            : `💎 Gửi ${amount} TCT`}
        </button>
      </div>
    </div>
  );
};