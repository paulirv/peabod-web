-- Migration: Add site settings table
-- Run with: wrangler d1 execute peabod-db --file=./migrations/005_add_settings_table.sql

-- Site settings table (single row)
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),  -- Ensures only one row
  -- Core site info
  site_url TEXT,
  site_name TEXT,
  site_description TEXT,
  -- SEO/Meta
  meta_title_suffix TEXT,  -- Appended to page titles (e.g., " | Peabod")
  default_og_image_id INTEGER REFERENCES media(id) ON DELETE SET NULL,
  -- Display
  logo_media_id INTEGER REFERENCES media(id) ON DELETE SET NULL,
  copyright_text TEXT,
  -- Content settings
  posts_per_page INTEGER DEFAULT 10,
  -- Contact info
  contact_email TEXT,
  -- Social media
  social_twitter TEXT,
  social_facebook TEXT,
  social_instagram TEXT,
  social_linkedin TEXT,
  social_youtube TEXT,
  social_github TEXT,
  social_substack TEXT,
  -- Timestamps
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Initialize settings with default row
INSERT OR IGNORE INTO settings (id) VALUES (1);
