-- Migration: Fix pilot_requests.pilot_user_id foreign key cascade
-- Author: Maurice Rondeau
-- Date: December 20, 2025
--
-- Problem: pilot_requests.pilot_user_id lacks ON DELETE CASCADE
-- Impact: If pilot_users record is deleted, orphaned references remain in pilot_requests
-- Solution: Add CASCADE behavior to maintain referential integrity

-- Drop existing constraint if it exists
ALTER TABLE pilot_requests
DROP CONSTRAINT IF EXISTS pilot_requests_pilot_user_id_fkey;

-- Re-add with ON DELETE CASCADE
ALTER TABLE pilot_requests
ADD CONSTRAINT pilot_requests_pilot_user_id_fkey
FOREIGN KEY (pilot_user_id) REFERENCES pilot_users(id) ON DELETE CASCADE;

-- Add comment documenting the fix
COMMENT ON CONSTRAINT pilot_requests_pilot_user_id_fkey ON pilot_requests IS
'FK to pilot_users with CASCADE delete - fixed Dec 2025 to prevent orphaned records';
