import { describe, it, expect, jest } from '@jest/globals';
import request from "supertest";

const API_URL = "http://localhost:5000";

describe("Kiểm thử API Upload (uploadApi.ts)", () => {
  // Pinata đẩy file có thể tốn vài giây, nên ta tăng thời gian chờ của Jest lên 15s để không bị timeout
  jest.setTimeout(15000);

  it("1. POST /api/upload/audio - Phải chặn khi gửi sai định dạng file (Lỗi 400)", async () => {
    const res = await request(API_URL)
      .post("/api/upload/audio")
      .send({
        fileBase64: "aGVsbG8=", // Chuỗi base64 ngẫu nhiên
        fileName: "test_image.png",
        mimeType: "image/png" // Cố tình gửi định dạng ảnh thay vì nhạc
      });

    // Mong đợi server bắt được lỗi và ném ra status 400 (Bad Request)
    expect(res.status).toBe(400); 
    expect(res.body.success).toBe(false);
  });

  it("2. POST /api/upload/audio - Phải upload thành công với file hợp lệ", async () => {
    // Chuỗi base64 siêu nhỏ gọn để test, tránh làm nặng hệ thống Pinata của ông
    const tinyAudioBase64 = "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYwLjE2LjEwMAAAAAAAAAAAAAAA";
    const res = await request(API_URL)
      .post("/api/upload/audio")
      .send({
        fileBase64: tinyAudioBase64,
        fileName: "tiny_test_audio.mp3",
        mimeType: "audio/mpeg" // Đúng định dạng cho phép
      });

    // Mong đợi kết nối thành công và trả về mã Hash (CID)
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.cid).toBeDefined();
  });

  it("3. POST /api/upload/metadata - Phải tạo metadata JSON thành công", async () => {
    const res = await request(API_URL)
      .post("/api/upload/metadata")
      .send({
        name: "Test Bài Hát Jest",
        creator: "0x123456789abcdef",
        audioHash: "QmDemoHash123456",
        description: "Đây là bài hát để test tự động",
        genre: "Pop"
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.cid).toBeDefined();
  });
});