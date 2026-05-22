// frontend/src/components/listener/ReportModal.tsx
// Modal báo cáo vi phạm bản quyền
import React, { useState } from 'react';
import type { TrackStruct } from '../../abi/ABI/index';

interface ReportModalProps {
  track: TrackStruct;
  onClose: () => void;
  onSubmit: (trackId: number, reason: string) => Promise<void>;
}

const PRESET_REASONS = [
  'Vi phạm bản quyền âm nhạc',
  'Sử dụng nội dung mà không có sự cho phép',
  'Nội dung không phù hợp / phản cảm',
  'Thông tin sai lệch / lừa đảo',
  'Trùng lặp bài hát đã có',
];

export const ReportModal: React.FC<ReportModalProps> = ({ track, onClose, onSubmit }) => {
  const [reason, setReason]     = useState('');
  const [custom, setCustom]     = useState('');
  const [status, setStatus]     = useState<'idle' | 'pending' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const finalReason = reason === '__custom__' ? custom.trim() : reason;
  const canSubmit   = finalReason.length >= 5;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setStatus('pending');
    setErrorMsg('');
    try {
      await onSubmit(Number(track.trackId), finalReason);
      setStatus('done');
    } catch (e: any) {
      setErrorMsg(e?.reason ?? e?.message ?? 'Báo cáo thất bại');
      setStatus('error');
    }
  };

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 300,
    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
  };

  const modal: React.CSSProperties = {
    background: '#0f0f1a',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: 14, padding: '32px 28px',
    width: '100%', maxWidth: 460, position: 'relative',
    boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 40px rgba(239,68,68,0.04)',
  };

  if (status === 'done') {
    return (
      <div style={overlay} onClick={onClose}>
        <div style={modal} onClick={e => e.stopPropagation()}>
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', fontSize: 28,
            }}>⚑</div>
            <h3 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 20, color: '#f0e6c8', marginBottom: 10,
            }}>Báo cáo đã gửi</h3>
            <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b6b7b', marginBottom: 20 }}>
              Admin sẽ xem xét và xử lý trong thời gian sớm nhất.
            </p>
            <button
              onClick={onClose}
              style={{
                padding: '10px 28px', borderRadius: 8,
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: '#f87171', fontFamily: 'monospace', fontSize: 12,
                letterSpacing: '0.1em', cursor: 'pointer',
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isBusy = status === 'pending';

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'none', border: 'none',
            color: '#5a5a6a', cursor: 'pointer', fontSize: 18,
          }}
        >✕</button>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <p style={{
            fontFamily: 'monospace', fontSize: 10,
            letterSpacing: '0.2em', textTransform: 'uppercase',
            color: '#f87171', marginBottom: 6,
          }}>⚑ Báo cáo vi phạm</p>
          <h3 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 18, color: '#f0e6c8',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {track.title}
          </h3>
          <p style={{ fontFamily: 'monospace', fontSize: 10, color: '#5a5a6a', marginTop: 4 }}>
            {String(track.creator).slice(0, 6)}...{String(track.creator).slice(-4)}
          </p>
        </div>

        {/* Preset reasons */}
        <div style={{ marginBottom: 16 }}>
          <p style={{
            fontFamily: 'monospace', fontSize: 10,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: '#5a5a6a', marginBottom: 10,
          }}>
            Chọn lý do
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {PRESET_REASONS.map(r => (
              <button
                key={r}
                onClick={() => setReason(r)}
                disabled={isBusy}
                style={{
                  padding: '9px 14px', borderRadius: 7, cursor: 'pointer',
                  textAlign: 'left',
                  background: reason === r ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.025)',
                  border: `1px solid ${reason === r ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.07)'}`,
                  color: reason === r ? '#f87171' : '#7a7a8a',
                  fontFamily: 'monospace', fontSize: 12,
                  transition: 'all 0.12s',
                }}
              >
                {reason === r ? '● ' : '○ '}{r}
              </button>
            ))}

            {/* Custom reason */}
            <button
              onClick={() => setReason('__custom__')}
              disabled={isBusy}
              style={{
                padding: '9px 14px', borderRadius: 7, cursor: 'pointer',
                textAlign: 'left',
                background: reason === '__custom__' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.025)',
                border: `1px solid ${reason === '__custom__' ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.07)'}`,
                color: reason === '__custom__' ? '#f87171' : '#7a7a8a',
                fontFamily: 'monospace', fontSize: 12,
              }}
            >
              {reason === '__custom__' ? '● ' : '○ '}Lý do khác...
            </button>
          </div>
        </div>

        {/* Custom input */}
        {reason === '__custom__' && (
          <div style={{ marginBottom: 16 }}>
            <textarea
              value={custom}
              onChange={e => setCustom(e.target.value)}
              placeholder="Mô tả chi tiết lý do báo cáo (ít nhất 5 ký tự)..."
              rows={3}
              disabled={isBusy}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 7,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: '#e0d5b0', fontFamily: 'Georgia, serif', fontSize: 13,
                outline: 'none', resize: 'vertical', minHeight: 72,
                boxSizing: 'border-box',
              }}
            />
            <p style={{ fontFamily: 'monospace', fontSize: 10, color: '#4a4a5a', marginTop: 4 }}>
              {custom.trim().length} / 5 ký tự tối thiểu
            </p>
          </div>
        )}

        {/* Error */}
        {errorMsg && (
          <div style={{
            padding: '10px 14px', borderRadius: 7, marginBottom: 14,
            background: 'rgba(239,68,68,0.07)',
            border: '1px solid rgba(239,68,68,0.2)',
            fontFamily: 'monospace', fontSize: 12, color: '#f87171',
          }}>
            ⚠ {errorMsg}
          </div>
        )}

        {/* Notice */}
        <div style={{
          padding: '10px 14px', borderRadius: 7, marginBottom: 18,
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
          fontFamily: 'monospace', fontSize: 11, color: '#4a4a5a', lineHeight: 1.6,
        }}>
          ⚠ Báo cáo sai lệch có thể dẫn đến hậu quả với tài khoản của bạn.
          Giao dịch này sẽ được ghi trên blockchain.
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || isBusy}
          style={{
            width: '100%', padding: '12px', borderRadius: 8,
            background: canSubmit && !isBusy
              ? 'rgba(239,68,68,0.12)'
              : 'rgba(255,255,255,0.03)',
            border: `1px solid ${canSubmit && !isBusy ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.06)'}`,
            color: canSubmit && !isBusy ? '#f87171' : '#3a3a4a',
            fontFamily: 'monospace', fontSize: 13, fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            cursor: canSubmit && !isBusy ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s',
          }}
        >
          {isBusy ? '⏳ Đang gửi...' : '⚑ Gửi báo cáo'}
        </button>
      </div>
    </div>
  );
};