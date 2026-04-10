-- Migration: Sync pilot_users.rank when pilots.role changes
-- Author: Maurice Rondeau
-- Date: February 23, 2026
--
-- Problem: pilot_users.rank is set at registration time and never updated
-- when a pilot's role changes in the pilots table. This causes the pilot
-- portal to show stale rank data.
--
-- Solution: Extend the existing denormalization sync to also update pilot_users.rank.
-- Also adds a one-time backfill to correct any existing mismatches.

-- Update the sync function to also sync pilot_users.rank
CREATE OR REPLACE FUNCTION sync_pilot_request_denormalization()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only update if relevant fields have changed
  IF (OLD.role IS DISTINCT FROM NEW.role OR
      OLD.employee_id IS DISTINCT FROM NEW.employee_id OR
      OLD.full_name IS DISTINCT FROM NEW.full_name) THEN

    -- Sync pilot_requests denormalized fields
    UPDATE pilot_requests
    SET
      rank = NEW.role,
      employee_number = NEW.employee_id,
      name = COALESCE(NEW.full_name, NEW.first_name || ' ' || NEW.last_name)
    WHERE pilot_id = NEW.id;

    -- Sync pilot_users.rank when role changes
    IF (OLD.role IS DISTINCT FROM NEW.role) THEN
      UPDATE pilot_users
      SET rank = NEW.role::TEXT
      WHERE pilot_id = NEW.id;
    END IF;

    RAISE NOTICE 'Synced denormalized data for pilot % - updated requests and pilot_users',
      NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- One-time backfill: Fix any existing pilot_users with stale rank
UPDATE pilot_users pu
SET rank = p.role::TEXT
FROM pilots p
WHERE pu.pilot_id = p.id
  AND pu.rank IS DISTINCT FROM p.role::TEXT;
