-- Migration: Add missing FK constraints to pilot_requests table
-- Fixes: 500 error when viewing portal-submitted leave requests
-- The getPilotRequestById query uses Supabase's !foreign_key_name join syntax
-- which requires actual FK constraints to exist in the database.
--
-- Author: Maurice Rondeau
-- Created: 2026-02-02

-- Add FK constraint for reviewed_by -> an_users
-- This allows the query to join reviewer name when viewing requests
ALTER TABLE pilot_requests
ADD CONSTRAINT pilot_requests_reviewed_by_fkey
FOREIGN KEY (reviewed_by) REFERENCES an_users(id) ON DELETE SET NULL;

-- Add FK constraint for submitted_by_admin_id -> an_users
-- This allows the query to join submitter name for admin-submitted requests
ALTER TABLE pilot_requests
ADD CONSTRAINT pilot_requests_submitted_by_admin_id_fkey
FOREIGN KEY (submitted_by_admin_id) REFERENCES an_users(id) ON DELETE SET NULL;

-- Add indexes for the new FK columns to improve join performance
CREATE INDEX IF NOT EXISTS idx_pilot_requests_reviewed_by ON pilot_requests(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_pilot_requests_submitted_by_admin_id ON pilot_requests(submitted_by_admin_id);

-- Add comment explaining the constraints
COMMENT ON CONSTRAINT pilot_requests_reviewed_by_fkey ON pilot_requests IS 'FK to an_users for reviewer lookup in admin portal';
COMMENT ON CONSTRAINT pilot_requests_submitted_by_admin_id_fkey ON pilot_requests IS 'FK to an_users for admin submitter lookup';
