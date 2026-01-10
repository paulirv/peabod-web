-- Migration: Add user roles, approval workflow, and content ownership
-- Run with: wrangler d1 execute peabod-db --file=./shared/migrations/003_add_user_roles.sql

-- Add role column (admin, editor, author)
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'author';

-- Add approval columns
ALTER TABLE users ADD COLUMN is_approved INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN approved_at TEXT;
ALTER TABLE users ADD COLUMN approved_by INTEGER REFERENCES users(id);

-- First user (admin) should already be approved
UPDATE users SET role = 'admin', is_approved = 1 WHERE id = 1;

-- Add author_id for ownership tracking
ALTER TABLE articles ADD COLUMN author_id INTEGER REFERENCES users(id);
ALTER TABLE pages ADD COLUMN author_id INTEGER REFERENCES users(id);
ALTER TABLE media ADD COLUMN author_id INTEGER REFERENCES users(id);

-- Set existing content to admin (user 1)
UPDATE articles SET author_id = 1 WHERE author_id IS NULL;
UPDATE pages SET author_id = 1 WHERE author_id IS NULL;
UPDATE media SET author_id = 1 WHERE author_id IS NULL;

-- Indexes for role queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_approved ON users(is_approved);

-- Indexes for content ownership
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_pages_author_id ON pages(author_id);
CREATE INDEX IF NOT EXISTS idx_media_author_id ON media(author_id);
