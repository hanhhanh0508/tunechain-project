// src/api/uploadApi.ts
// Endpoint để frontend upload file nhạc lên IPFS qua Pinata
// Frontend gửi file lên đây, backend upload lên Pinata và trả về CID

import { Router, Request, Response } from "express";
import { uploadFile, uploadJSON, getIpfsUrl, TrackMetadata } from "../services/ipfsService";

const router = Router();

// ─── POST /upload/audio ────────────────────────────────────────────────────
/**
 * Upload file audio lên IPFS
 *
 * Body: multipart/form-data với field "file" (audio file)
 * Response: { success: true, cid: string, url: string }
 *
 * Lưu ý: Để đơn giản, endpoint này nhận base64 thay vì multipart
 * (Frontend mã hoá file thành base64 trước khi gửi)
 */
router.post("/upload/audio", async (req: Request, res: Response) => {
  try {
    const { fileBase64, fileName, mimeType } = req.body as {
      fileBase64?: string;
      fileName?: string;
      mimeType?: string;
    };

    // Validate
    if (!fileBase64 || !fileName || !mimeType) {
      res.status(400).json({
        success: false,
        error: "Thiếu fileBase64, fileName hoặc mimeType",
      });
      return;
    }

    // Kiểm tra định dạng file được phép
    const allowedMimeTypes = ["audio/mpeg", "audio/wav", "audio/flac", "audio/aac", "audio/ogg"];
    if (!allowedMimeTypes.includes(mimeType)) {
      res.status(400).json({
        success: false,
        error: `Định dạng không hỗ trợ. Chấp nhận: ${allowedMimeTypes.join(", ")}`,
      });
      return;
    }

    // Decode base64 thành Buffer
    const fileBuffer = Buffer.from(fileBase64, "base64");

    // Kiểm tra kích thước (tối đa 50MB)
    const maxSizeBytes = 50 * 1024 * 1024;
    if (fileBuffer.length > maxSizeBytes) {
      res.status(400).json({
        success: false,
        error: "File quá lớn. Tối đa 50MB",
      });
      return;
    }

    // Upload lên Pinata
    const cid = await uploadFile(fileBuffer, fileName, mimeType);
    const url = getIpfsUrl(cid);

    res.status(200).json({
      success: true,
      cid,
      url,
    });
  } catch (error) {
    console.error("[uploadApi] Lỗi POST /upload/audio:", error);
    res.status(500).json({
      success: false,
      error: "Upload thất bại. Kiểm tra lại Pinata API key.",
    });
  }
});

// ─── POST /upload/metadata ─────────────────────────────────────────────────
/**
 * Upload JSON metadata của track lên IPFS
 *
 * Body: { name, creator, audioHash, description?, coverHash?, duration?, genre? }
 * Response: { success: true, cid: string, url: string }
 */
router.post("/upload/metadata", async (req: Request, res: Response) => {
  try {
    const { name, creator, audioHash, description, coverHash, duration, genre } =
      req.body as Partial<TrackMetadata>;

    // Validate bắt buộc
    if (!name || !creator || !audioHash) {
      res.status(400).json({
        success: false,
        error: "Thiếu các trường bắt buộc: name, creator, audioHash",
      });
      return;
    }

    const metadata: TrackMetadata = {
      name,
      creator,
      audioHash,
      description,
      coverHash,
      duration,
      genre,
      createdAt: new Date().toISOString(),
    };

    const cid = await uploadJSON(metadata);
    const url = getIpfsUrl(cid);

    res.status(200).json({
      success: true,
      cid,
      url,
      metadata,
    });
  } catch (error) {
    console.error("[uploadApi] Lỗi POST /upload/metadata:", error);
    res.status(500).json({
      success: false,
      error: "Upload metadata thất bại.",
    });
  }
});

export default router;