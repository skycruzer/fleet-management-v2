-- Migration: Add approval_checklist column to pilot_requests
-- Author: Maurice Rondeau
-- Date: December 21, 2025
-- Purpose: Store persistent approval checklist state for leave request workflow

-- Add approval_checklist JSONB column to pilot_requests table
ALTER TABLE pilot_requests
ADD COLUMN IF NOT EXISTS approval_checklist jsonb DEFAULT NULL;

-- Structure documentation:
-- {
--   "checked_items": ["crew_coverage", "seniority", "notice_period", "oracle_entry"],
--   "checked_by": "user-uuid-here",
--   "checked_at": "2025-12-20T14:30:00.000Z"
-- }

-- Create an index for querying requests with pending checklists
CREATE INDEX IF NOT EXISTS idx_pilot_requests_approval_checklist
ON pilot_requests USING gin (approval_checklist)
WHERE approval_checklist IS NOT NULL;

-- Add a comment for documentation
COMMENT ON COLUMN pilot_requests.approval_checklist IS
'JSON object storing approval checklist state: checked_items (array of item keys), checked_by (user UUID), checked_at (timestamp)';
