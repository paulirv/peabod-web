-- Add logo text display option to settings table
-- Values: 'none' (default), 'after' (right of logo), 'below' (under logo)
ALTER TABLE settings ADD COLUMN logo_text_display TEXT DEFAULT 'none';
