// frontend/src/pages/UploadPage.tsx
import React, { useState, useRef } from 'react';
import { useWallet } from '../hooks/useWallet';
import { uploadAudio, uploadMetadata } from '../utils/apiClient';
import { uploadTrack, getTCTBalance, getCurrentAddress } from '../utils/contractUtils';

const SUPPORTED_TYPES = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/ogg'];
const MAX_SIZE_MB = 50;

type UploadStep = 'idle' | 'uploading-audio' | 'uploading-meta' | 'on-chain' | 'done' | 'error';

export const UploadPage: React.FC = () => {
  const { isConnected, account } = useWallet();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging]   = useState(false);
  const [file, setFile]               = useState<File | null>(null);
  const [title, setTitle]             = useState('');
  const [genre, setGenre]             = useState('');
  const [description, setDescription] = useState('');

  const [step, setStep]       = useState<UploadStep>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [txHash, setTxHash]   = useState('');
  const [audioCID, setAudioCID] = useState('');

  const inputStyle: React.CSSProperties = {
    width: '100%', marginTop: 6, padding: '10px 14px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 6, outline: 'none',
    color: '#e0d5b0', fontFamily: 'Georgia, serif', fontSize: 13,
    boxSizing: 'border-box', transition: 'border-color 0.15s',
  };

  // ── File validation ─────────────────────────────────────
  const validateFile = (f: File): string | null => {
    if (!SUPPORTED_TYPES.includes(f.type)) return `Định dạng không hỗ trợ: ${f.type}`;
    if (f.size > MAX_SIZE_MB * 1024 * 1024) return `File quá lớn (tối đa ${MAX_SIZE_MB}MB)`;
    return null;
  };

  const pickFile = (f: File) => {
    const err = validateFile(f);
    if (err) { setErrorMsg(err); return; }
    setErrorMsg('');
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) pickFile(f);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) pickFile(f);
  };

  // ── Upload flow ─────────────────────────────────────────
  const handleUpload = async () => {
    if (!file) { setErrorMsg('Chọn file nhạc trước'); return; }
    if (!title.trim()) { setErrorMsg('Nhập tên bài hát'); return; }

    setErrorMsg('');
    setProgress(0);

    try {
      // Step 1: Upload audio → IPFS
      setStep('uploading-audio');
      setProgress(10);
      const cid = await uploadAudio(file);
      setAudioCID(cid);
      setProgress(40);

      // Step 2: Upload metadata → IPFS
      setStep('uploading-meta');
      const addr = await getCurrentAddress();
      await uploadMetadata({
        name: title.trim(),
        creator: addr,
        audioHash: cid,
        description: description.trim() || undefined,
        genre: genre.trim() || undefined,
      });
      setProgress(65);

      // Step 3: On-chain uploadTrack
      setStep('on-chain');
      const receipt = await uploadTrack(cid, title.trim());
      setTxHash(receipt?.hash ?? '');
      setProgress(100);
      setStep('done');

    } catch (e: any) {
      setErrorMsg(e?.reason ?? e?.message ?? 'Upload thất bại');
      setStep('error');
    }
  };

  const resetForm = () => {
    setFile(null); setTitle(''); setGenre(''); setDescription('');
    setStep('idle'); setProgress(0); setErrorMsg(''); setTxHash(''); setAudioCID('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isBusy = ['uploading-audio', 'uploading-meta', 'on-chain'].includes(step);

  // ── Step labels ─────────────────────────────────────────
  const stepLabel = {
    'idle': '',
    'uploading-audio': '⏳ Đang upload audio lên IPFS...',
    'uploading-meta':  '⏳ Đang upload metadata lên IPFS...',
    'on-chain':        '⛓ Đang ghi lên blockchain (confirm MetaMask)...',
    'done':            '✓ Upload thành công!',
    'error':           '✗ Lỗi',
  }[step];

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
          Connect your wallet to upload music
        </p>
      </div>
    );
  }

  // ── Done state ───────────────────────────────────────────
  if (step === 'done') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 560, margin: '0 auto' }}>
        <div style={{
          padding: '40px 32px', borderRadius: 14, textAlign: 'center',
          background: 'rgba(34,197,94,0.05)',
          border: '1px solid rgba(34,197,94,0.2)',
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', fontSize: 32,
          }}>✓</div>
          <h3 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 24, color: '#f0e6c8', marginBottom: 12,
          }}>Upload thành công!</h3>
          <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b6b7b', marginBottom: 8 }}>
            {title}
          </p>
          {audioCID && (
            <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#4a4a5a', wordBreak: 'break-all', marginBottom: 8 }}>
              IPFS: {audioCID}
            </p>
          )}
          {txHash && (
            <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#4a4a5a', wordBreak: 'break-all', marginBottom: 20 }}>
              TX: {txHash}
            </p>
          )}
          <button
            onClick={resetForm}
            style={{
              padding: '10px 28px', borderRadius: 8,
              background: 'linear-gradient(135deg, #d4af37, #f5d06e)',
              color: '#1a1400', border: 'none',
              fontFamily: 'monospace', fontSize: 12, fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            Upload thêm bài
          </button>
        </div>
      </div>
    );
  }

  // ── Main form ─────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(20px, 5vw, 32px)' }}>

      {/* Page header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 20 }}>
        <p style={{
          fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.2em',
          textTransform: 'uppercase', color: '#d4af37', marginBottom: 8,
        }}>↑ New Track</p>
        <h2 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 700, color: '#f0e6c8',
        }}>Upload Music</h2>
      </div>

      {/* Drop zone */}
      <div
        onClick={() => !isBusy && fileInputRef.current?.click()}
        onDragEnter={e => { e.preventDefault(); setIsDragging(true); }}
        onDragOver={e => e.preventDefault()}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        style={{
          borderRadius: 14, padding: 'clamp(40px, 8vw, 72px) 32px',
          textAlign: 'center', cursor: isBusy ? 'default' : 'pointer',
          transition: 'all 0.25s',
          background: file
            ? 'rgba(34,197,94,0.04)'
            : isDragging
            ? 'rgba(212, 175, 55, 0.06)'
            : 'rgba(255,255,255,0.015)',
          border: file
            ? '2px dashed rgba(34,197,94,0.4)'
            : isDragging
            ? '2px dashed rgba(212,175,55,0.5)'
            : '2px dashed rgba(255,255,255,0.08)',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />

        {/* Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: file
            ? 'rgba(34,197,94,0.1)'
            : isDragging ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${file ? 'rgba(34,197,94,0.3)' : isDragging ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.08)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px', transition: 'all 0.25s',
          fontSize: 28, color: file ? '#4ade80' : isDragging ? '#d4af37' : '#5a5a6a',
        }}>
          {file ? '♪' : '↑'}
        </div>

        {file ? (
          <>
            <p style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 16, color: '#4ade80', marginBottom: 6,
            }}>
              {file.name}
            </p>
            <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#5a5a6a' }}>
              {(file.size / 1024 / 1024).toFixed(2)} MB · {file.type}
            </p>
          </>
        ) : (
          <>
            <p style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 18, color: isDragging ? '#d4af37' : '#8a8070', marginBottom: 8,
            }}>
              Drop your music files here
            </p>
            <p style={{
              fontFamily: 'monospace', fontSize: 11, color: '#4a4a5a',
              letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 24,
            }}>
              MP3 · WAV · FLAC · AAC · max {MAX_SIZE_MB}MB
            </p>
            <button
              onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 24px', borderRadius: 6,
                background: 'linear-gradient(135deg, #d4af37, #f5d06e)',
                color: '#1a1400', border: 'none',
                fontFamily: 'monospace', fontSize: 12, fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
                boxShadow: '0 0 16px rgba(212,175,55,0.25)',
              }}
            >
              ↑ Choose Files
            </button>
          </>
        )}
      </div>

      {/* Form */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12, padding: 24,
      }}>
        <p style={{
          fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.15em',
          textTransform: 'uppercase', color: '#5a5a6a', marginBottom: 18,
        }}>
          Thông tin bài hát
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontFamily: 'monospace', fontSize: 11, color: '#6b6b7b' }}>
              Tên bài hát *
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Nhập tên bài hát..."
              disabled={isBusy}
              style={inputStyle}
              onFocus={e => ((e.target as HTMLInputElement).style.borderColor = 'rgba(212,175,55,0.4)')}
              onBlur={e => ((e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.08)')}
            />
          </div>
          <div>
            <label style={{ fontFamily: 'monospace', fontSize: 11, color: '#6b6b7b' }}>
              Thể loại
            </label>
            <input
              value={genre}
              onChange={e => setGenre(e.target.value)}
              placeholder="Pop / Ballad / R&B..."
              disabled={isBusy}
              style={inputStyle}
              onFocus={e => ((e.target as HTMLInputElement).style.borderColor = 'rgba(212,175,55,0.4)')}
              onBlur={e => ((e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.08)')}
            />
          </div>
        </div>

        <div>
          <label style={{ fontFamily: 'monospace', fontSize: 11, color: '#6b6b7b' }}>
            Mô tả
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Nhập mô tả tác phẩm..."
            rows={3}
            disabled={isBusy}
            style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
            onFocus={e => ((e.target as HTMLTextAreaElement).style.borderColor = 'rgba(212,175,55,0.4)')}
            onBlur={e => ((e.target as HTMLTextAreaElement).style.borderColor = 'rgba(255,255,255,0.08)')}
          />
        </div>
      </div>

      {/* Error */}
      {errorMsg && (
        <div style={{
          padding: '12px 16px', borderRadius: 8,
          background: 'rgba(239,68,68,0.07)',
          border: '1px solid rgba(239,68,68,0.2)',
          fontFamily: 'monospace', fontSize: 12, color: '#f87171',
        }}>
          ⚠ {errorMsg}
        </div>
      )}

      {/* Progress bar */}
      {isBusy && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#d4af37' }}>{stepLabel}</span>
            <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#5a5a6a' }}>{progress}%</span>
          </div>
          <div style={{
            height: 4, borderRadius: 2,
            background: 'rgba(255,255,255,0.06)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: 2,
              background: 'linear-gradient(90deg, #d4af37, #f5d06e)',
              width: `${progress}%`,
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>
      )}

      {/* Upload button */}
      <button
        onClick={handleUpload}
        disabled={isBusy || !file || !title.trim()}
        style={{
          width: '100%', padding: '14px',
          borderRadius: 8,
          background: isBusy || !file || !title.trim()
            ? 'rgba(255,255,255,0.04)'
            : 'linear-gradient(135deg, #d4af37, #f5d06e)',
          color: isBusy || !file || !title.trim() ? '#4a4a5a' : '#1a1400',
          border: 'none',
          fontFamily: 'monospace', fontSize: 14, fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          cursor: isBusy || !file || !title.trim() ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          boxShadow: !isBusy && file && title.trim()
            ? '0 0 24px rgba(212,175,55,0.3)'
            : 'none',
        }}
      >
        {isBusy ? stepLabel : '↑ Upload to Blockchain'}
      </button>

      {/* Fee notice */}
      <div style={{
        padding: '12px 16px', borderRadius: 8,
        background: 'rgba(212,175,55,0.04)',
        border: '1px solid rgba(212,175,55,0.1)',
        fontFamily: 'monospace', fontSize: 11, color: '#8a7a4a', lineHeight: 1.6,
      }}>
        ⚠ Upload fee: <strong style={{ color: '#d4af37' }}>10 TCT</strong> được trừ tự động. Đảm bảo ví có đủ TCT và đã approve contract.
      </div>
    </div>
  );
};