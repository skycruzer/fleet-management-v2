-- Migration: Add user profile fields for personalized dashboard
-- Developer: Maurice Rondeau
-- Date: 2026-02-09

ALTER TABLE an_users ADD COLUMN IF NOT EXISTS display_name TEXT DEFAULT NULL;
ALTER TABLE an_users ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL;

COMMENT ON COLUMN an_users.display_name IS 'User display name for personalized greeting';
COMMENT ON COLUMN an_users.avatar_url IS 'URL to user avatar image';
