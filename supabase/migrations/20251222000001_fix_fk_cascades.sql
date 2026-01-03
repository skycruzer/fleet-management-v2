-- Migration: Fix Foreign Key Cascades
-- Date: 2025-12-22
-- Description: Add ON DELETE CASCADE to pilot_users.pilot_id and pilot_requests.pilot_user_id
-- Author: Maurice (Skycruzer)

-- =====================================================
-- FIX 1: pilot_users.pilot_id -> pilots.id CASCADE
-- =====================================================
-- This ensures that when a pilot record is deleted,
-- the corresponding pilot_users record is also deleted
-- (prevents orphaned portal user accounts)

DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'pilot_users_pilot_id_fkey'
    AND table_name = 'pilot_users'
  ) THEN
    ALTER TABLE pilot_users DROP CONSTRAINT pilot_users_pilot_id_fkey;
  END IF;
END $$;

-- Add constraint with CASCADE
ALTER TABLE pilot_users
ADD CONSTRAINT pilot_users_pilot_id_fkey
  FOREIGN KEY (pilot_id)
  REFERENCES pilots(id)
  ON DELETE CASCADE;

-- =====================================================
-- FIX 2: pilot_requests.pilot_user_id -> pilot_users.id CASCADE
-- =====================================================
-- This ensures that when a pilot_user record is deleted,
-- the corresponding pilot_requests are also deleted
-- (prevents orphaned request records)

DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'pilot_requests_pilot_user_id_fkey'
    AND table_name = 'pilot_requests'
  ) THEN
    ALTER TABLE pilot_requests DROP CONSTRAINT pilot_requests_pilot_user_id_fkey;
  END IF;
END $$;

-- Add constraint with CASCADE (only if pilot_user_id column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pilot_requests'
    AND column_name = 'pilot_user_id'
  ) THEN
    ALTER TABLE pilot_requests
    ADD CONSTRAINT pilot_requests_pilot_user_id_fkey
      FOREIGN KEY (pilot_user_id)
      REFERENCES pilot_users(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Log the migration
DO $$
BEGIN
  RAISE NOTICE 'Migration 20251222000001_fix_fk_cascades completed successfully';
END $$;
