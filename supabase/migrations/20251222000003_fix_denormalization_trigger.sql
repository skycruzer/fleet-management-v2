-- Migration: Fix Denormalization Trigger
-- Date: 2025-12-22
-- Description: Fix trigger that references non-existent pilots.full_name column
-- Author: Maurice (Skycruzer)
--
-- ISSUE: The sync_pilot_to_requests trigger referenced `pilots.full_name`
-- which doesn't exist. Pilots table has `first_name` and `last_name` separately.

-- =====================================================
-- DROP EXISTING BROKEN TRIGGER AND FUNCTION
-- =====================================================

DROP TRIGGER IF EXISTS sync_pilot_changes_to_requests ON pilots;
DROP FUNCTION IF EXISTS sync_pilot_to_requests();

-- =====================================================
-- CREATE FIXED TRIGGER FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION sync_pilot_to_requests()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if relevant pilot fields have changed
  IF (
    OLD.role IS DISTINCT FROM NEW.role OR
    OLD.employee_id IS DISTINCT FROM NEW.employee_id OR
    OLD.first_name IS DISTINCT FROM NEW.first_name OR
    OLD.last_name IS DISTINCT FROM NEW.last_name
  ) THEN
    -- Update denormalized pilot data in pilot_requests
    UPDATE pilot_requests
    SET
      pilot_name = NEW.first_name || ' ' || NEW.last_name,
      pilot_employee_id = NEW.employee_id,
      pilot_rank = NEW.role,
      updated_at = NOW()
    WHERE pilot_id = NEW.id;

    -- Log the sync for debugging
    RAISE NOTICE 'Synced pilot % (%) to pilot_requests', NEW.id, NEW.first_name || ' ' || NEW.last_name;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CREATE TRIGGER
-- =====================================================

CREATE TRIGGER sync_pilot_changes_to_requests
  AFTER UPDATE ON pilots
  FOR EACH ROW
  EXECUTE FUNCTION sync_pilot_to_requests();

-- =====================================================
-- BACKFILL: Update any stale denormalized data
-- =====================================================

-- Only run backfill if denormalized columns exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pilot_requests' AND column_name = 'pilot_name'
  ) THEN
    UPDATE pilot_requests pr
    SET
      pilot_name = p.first_name || ' ' || p.last_name,
      pilot_employee_id = p.employee_id,
      pilot_rank = p.role,
      updated_at = NOW()
    FROM pilots p
    WHERE pr.pilot_id = p.id
    AND (
      pr.pilot_name IS DISTINCT FROM (p.first_name || ' ' || p.last_name)
      OR pr.pilot_employee_id IS DISTINCT FROM p.employee_id
      OR pr.pilot_rank IS DISTINCT FROM p.role
    );
    RAISE NOTICE 'Backfilled denormalized pilot data in pilot_requests';
  ELSE
    RAISE NOTICE 'Skipping backfill - pilot_name column does not exist in pilot_requests';
  END IF;
END $$;

-- Log the migration
DO $$
BEGIN
  RAISE NOTICE 'Migration 20251222000003_fix_denormalization_trigger completed successfully';
END $$;
