-- Migration 001: Add Media table for Digital Asset Management
-- Run with: wrangler d1 execute peabod-db --file=./shared/migrations/001_add_media_table.sql

-- Create media table
CREATE TABLE IF NOT EXISTS media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  alt TEXT,
  filename TEXT NOT NULL,
  path TEXT UNIQUE NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  lat REAL,
  lon REAL,
  date_taken TEXT,
  type TEXT NOT NULL DEFAULT 'image',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for media table
CREATE INDEX IF NOT EXISTS idx_media_path ON media(path);
CREATE INDEX IF NOT EXISTS idx_media_type ON media(type);
CREATE INDEX IF NOT EXISTS idx_media_created ON media(created_at);

-- Add media_id column to articles (SQLite requires separate ALTER statements)
ALTER TABLE articles ADD COLUMN media_id INTEGER REFERENCES media(id) ON DELETE SET NULL;

-- Add media_id column to pages
ALTER TABLE pages ADD COLUMN media_id INTEGER REFERENCES media(id) ON DELETE SET NULL;

-- Add indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_articles_media ON articles(media_id);
CREATE INDEX IF NOT EXISTS idx_pages_media ON pages(media_id);
