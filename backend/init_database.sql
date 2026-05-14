
CREATE DATABASE IF NOT EXISTS tunechain
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE tunechain;

CREATE TABLE IF NOT EXISTS track_views (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  track_id    VARCHAR(100) NOT NULL UNIQUE  COMMENT 'ID track trên blockchain (số hoặc chuỗi)',
  view_count  BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Tổng số lượt xem',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_track_id (track_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Tổng view count của mỗi track';

CREATE TABLE IF NOT EXISTS view_logs (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  track_id    VARCHAR(100) NOT NULL    COMMENT 'ID track được xem',
  ip_address  VARCHAR(45)  NOT NULL    COMMENT 'IP người xem (IPv4 hoặc IPv6)',
  viewed_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm xem',
  -- Index idx_track_ip giúp tăng tốc độ kiểm tra Rate-limit (1 view/IP/24h) khi user gọi API View
  INDEX idx_track_ip (track_id, ip_address),
  -- Index idx_viewed_at giúp Cron Job (cleanup) quét và xóa các log rác cũ nhanh hơn
  INDEX idx_viewed_at (viewed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Lịch sử từng lượt xem (dùng cho rate-limit)';

SHOW TABLES;