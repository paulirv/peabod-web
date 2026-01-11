-- Migration: Add page_tags and media_tags junction tables
-- Run with: wrangler d1 execute peabod-db --file=./migrations/009_add_page_media_tags.sql

-- Page-Tag relationship (many-to-many)
CREATE TABLE IF NOT EXISTS page_tags (
  page_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (page_id, tag_id),
  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Media-Tag relationship (many-to-many)
CREATE TABLE IF NOT EXISTS media_tags (
  media_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (media_id, tag_id),
  FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_page_tags_page ON page_tags(page_id);
CREATE INDEX IF NOT EXISTS idx_page_tags_tag ON page_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_media_tags_media ON media_tags(media_id);
CREATE INDEX IF NOT EXISTS idx_media_tags_tag ON media_tags(tag_id);
