-- Migration 004: Add Cloudflare Stream video fields
-- Run with: wrangler d1 execute peabod-db --file=./migrations/004_add_stream_video_fields.sql

-- Stream video identifier (returned after upload)
ALTER TABLE media ADD COLUMN stream_uid TEXT;

-- Video duration in seconds
ALTER TABLE media ADD COLUMN duration REAL;

-- Thumbnail URL from Stream
ALTER TABLE media ADD COLUMN thumbnail_url TEXT;

-- Processing status: 'uploading', 'processing', 'ready', 'error'
ALTER TABLE media ADD COLUMN stream_status TEXT;

-- Error message if processing failed
ALTER TABLE media ADD COLUMN stream_error TEXT;

-- Stream metadata (JSON blob for additional data like input/playback info)
ALTER TABLE media ADD COLUMN stream_meta TEXT;

-- Indexes for Stream fields
CREATE INDEX IF NOT EXISTS idx_media_stream_uid ON media(stream_uid);
CREATE INDEX IF NOT EXISTS idx_media_stream_status ON media(stream_status);
