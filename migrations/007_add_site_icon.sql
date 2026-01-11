-- Add site icon field to settings table
ALTER TABLE settings ADD COLUMN site_icon_id INTEGER REFERENCES media(id) ON DELETE SET NULL;
