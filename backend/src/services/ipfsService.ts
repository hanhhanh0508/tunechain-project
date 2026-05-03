// src/services/ipfsService.ts
// Upload file và JSON metadata lên IPFS thông qua Pinata
// Được dùng bởi frontend khi creator upload nhạc

import axios from "axios";
import FormData from "form-data";
import { env } from "../config/env.js";

const PINATA_BASE_URL = "https://api.pinata.cloud";

// Headers xác thực với Pinata API
const pinataHeaders = {
  pinata_api_key: env.pinataApiKey,
  pinata_secret_api_key: env.pinataSecretKey,
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PinataResponse {
  IpfsHash: string;    // CID của file trên IPFS
  PinSize: number;     // Kích thước file (bytes)
  Timestamp: string;   // Thời điểm pin
}

export interface TrackMetadata {
  name: string;          // Tên bài hát
  description?: string;  // Mô tả
  creator: string;       // Địa chỉ ví creator
  audioHash: string;     // CID của file audio
  coverHash?: string;    // CID của ảnh bìa (nếu có)
  duration?: number;     // Thời lượng (giây)
  genre?: string;        // Thể loại nhạc
  createdAt: string;     // ISO date string
}

// ─── Hàm upload file (audio, ảnh...) ──────────────────────────────────────────

/**
 * Upload một file binary lên IPFS qua Pinata
 * Dùng cho: file âm thanh (.mp3, .wav, .flac), ảnh bìa
 *
 * @param fileBuffer  - Nội dung file dạng Buffer
 * @param fileName    - Tên file (vd: "track.mp3")
 * @param mimeType    - MIME type (vd: "audio/mpeg")
 * @returns           - CID (IPFS hash) của file
 */
export async function uploadFile(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const formData = new FormData();

  // Thêm file vào form
  formData.append("file", fileBuffer, {
    filename: fileName,
    contentType: mimeType,
  });

  // Metadata tùy chọn cho Pinata (hiển thị trong dashboard Pinata)
  formData.append(
    "pinataMetadata",
    JSON.stringify({ name: `TuneChain - ${fileName}` })
  );

  // Tùy chọn pin
  formData.append(
    "pinataOptions",
    JSON.stringify({ cidVersion: 1 })
  );

  const response = await axios.post<PinataResponse>(
    `${PINATA_BASE_URL}/pinning/pinFileToIPFS`,
    formData,
    {
      headers: {
        ...pinataHeaders,
        ...formData.getHeaders(),
      },
      maxBodyLength: Infinity,  // Không giới hạn kích thước file
      maxContentLength: Infinity,
    }
  );

  console.log(`[IPFS] Upload file thành công: ${response.data.IpfsHash}`);
  return response.data.IpfsHash;
}

/**
 * Upload JSON metadata lên IPFS qua Pinata
 * Dùng để lưu thông tin bài hát (tên, mô tả, CID audio...)
 *
 * @param metadata  - Object metadata của track
 * @returns         - CID của file JSON metadata
 */
export async function uploadJSON(metadata: TrackMetadata): Promise<string> {
  const body = {
    pinataContent: metadata,
    pinataMetadata: {
      name: `TuneChain Metadata - ${metadata.name}`,
    },
    pinataOptions: {
      cidVersion: 1,
    },
  };

  const response = await axios.post<PinataResponse>(
    `${PINATA_BASE_URL}/pinning/pinJSONToIPFS`,
    body,
    { headers: pinataHeaders }
  );

  console.log(`[IPFS] Upload JSON thành công: ${response.data.IpfsHash}`);
  return response.data.IpfsHash;
}

/**
 * Tạo URL đầy đủ để truy cập file trên IPFS
 *
 * @param cid  - IPFS CID
 */
export function getIpfsUrl(cid: string): string {
  return `${env.pinataGateway}/${cid}`;
}

/**
 * Kiểm tra Pinata API có hoạt động không
 * Dùng khi khởi động server
 */
export async function testPinataConnection(): Promise<void> {
  await axios.get(`${PINATA_BASE_URL}/data/testAuthentication`, {
    headers: pinataHeaders,
  });
  console.log("[Pinata] Kết nối API thành công!");
}