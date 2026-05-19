// frontend/src/utils/apiClient.ts
// Wrapper gọi backend API (upload IPFS, view tracking)

const BASE_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:5000';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? `HTTP ${res.status}`);
  }
  return json as T;
}

// ── IPFS ────────────────────────────────────────────────────

export interface UploadAudioResponse {
  success: boolean;
  cid: string;
  url: string;
}

export interface UploadMetadataResponse {
  success: boolean;
  cid: string;
  url: string;
}

/**
 * Upload file audio lên IPFS qua backend Pinata
 * @param file  File object từ input
 * @returns     CID của file audio
 */
export async function uploadAudio(file: File): Promise<string> {
  const fileBase64 = await fileToBase64(file);
  const body = JSON.stringify({
    fileBase64,
    fileName: file.name,
    mimeType: file.type,
  });

  const res = await request<UploadAudioResponse>('/api/upload/audio', {
    method: 'POST',
    body,
  });
  return res.cid;
}

/**
 * Upload metadata JSON lên IPFS
 * @returns CID của metadata
 */
export async function uploadMetadata(payload: {
  name: string;
  creator: string;
  audioHash: string;
  description?: string;
  genre?: string;
}): Promise<string> {
  const res = await request<UploadMetadataResponse>('/api/upload/metadata', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.cid;
}

// ── VIEW TRACKING ───────────────────────────────────────────

export interface ViewCountResponse {
  success: boolean;
  trackId: string;
  viewCount: number;
}

export async function recordView(trackId: string | number): Promise<number> {
  try {
    const res = await request<ViewCountResponse>('/api/view', {
      method: 'POST',
      body: JSON.stringify({ trackId: String(trackId) }),
    });
    return res.viewCount;
  } catch {
    // rate-limited hoặc lỗi không quan trọng – bỏ qua
    return 0;
  }
}

export async function getViewCount(trackId: string | number): Promise<number> {
  try {
    const res = await request<ViewCountResponse>(`/api/views/${trackId}`);
    return res.viewCount;
  } catch {
    return 0;
  }
}

export interface BatchViewResponse {
  success: boolean;
  views: Record<string, number>;
}

export async function getBatchViewCounts(
  trackIds: (string | number)[]
): Promise<Record<string, number>> {
  if (trackIds.length === 0) return {};
  try {
    const res = await request<BatchViewResponse>('/api/views/batch', {
      method: 'POST',
      body: JSON.stringify({ trackIds: trackIds.map(String) }),
    });
    return res.views;
  } catch {
    return {};
  }
}

// ── Helpers ─────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // strip data:...;base64, prefix
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}