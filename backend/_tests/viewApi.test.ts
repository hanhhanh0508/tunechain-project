import { describe, it, expect } from '@jest/globals';
import request from "supertest";

// Trỏ thẳng vào server đang chạy của ông
const API_URL = "http://localhost:5000";

describe("Kiểm thử API View (viewApi.ts)", () => {
const testTrackId = `jest_test_track_${Date.now()}`;

  it("1. POST /api/view - Phải tăng view thành công ở lần nghe đầu tiên", async () => {
    const res = await request(API_URL)
      .post("/api/view")
      .send({ trackId: testTrackId });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.trackId).toBe(testTrackId);
  });

  it("2. POST /api/view - Phải bị chặn (Lỗi 429) ở lần thứ 6 (Rate Limit BR-04)", async () => {
    let lastStatus = 200;
    
    // Bắn liên tục 5 phát nữa để chạm ngưỡng (Cộng phát đầu là 6)
    for (let i = 0; i < 5; i++) {
      const res = await request(API_URL)
        .post("/api/view")
        .send({ trackId: testTrackId });
      lastStatus = res.status;
    }

    // Lần cuối cùng phải bị chặn 429
    expect(lastStatus).toBe(429);
  });

  it("3. GET /api/views/:trackId - Phải lấy được tổng view chính xác", async () => {
    const res = await request(API_URL).get(`/api/views/${testTrackId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Vì bị chặn ở lần 6, số view lưu trong DB chỉ được phép là 5
    expect(res.body.viewCount).toBe(5); 
  });
});