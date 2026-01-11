-- Migration: Add GitHub and Substack to settings
-- Run with: wrangler d1 execute peabod-db --file=./migrations/006_add_social_github_substack.sql

ALTER TABLE settings ADD COLUMN social_github TEXT;
ALTER TABLE settings ADD COLUMN social_substack TEXT;
