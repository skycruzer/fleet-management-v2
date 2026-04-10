-- Migration: Add denormalization sync trigger for pilot_requests
-- Author: Maurice Rondeau
-- Date: December 20, 2025
--
-- Problem: pilot_requests stores denormalized pilot data (employee_number, rank, name)
-- that can become stale when pilots table is updated.
--
-- Solution: Trigger to automatically sync denormalized data when pilots change.

-- Create the sync function
CREATE OR REPLACE FUNCTION sync_pilot_request_denormalization()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if relevant fields have changed
  IF (OLD.role IS DISTINCT FROM NEW.role OR
      OLD.employee_id IS DISTINCT FROM NEW.employee_id OR
      OLD.full_name IS DISTINCT FROM NEW.full_name) THEN

    UPDATE pilot_requests
    SET
      rank = NEW.role,
      employee_number = NEW.employee_id,
      name = COALESCE(NEW.full_name, NEW.first_name || ' ' || NEW.last_name)
    WHERE pilot_id = NEW.id;

    -- Log the sync for audit purposes (optional - can be removed in production)
    RAISE NOTICE 'Synced denormalized data for pilot % - updated % requests',
      NEW.id,
      (SELECT COUNT(*) FROM pilot_requests WHERE pilot_id = NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS pilot_denorm_sync_trigger ON pilots;

CREATE TRIGGER pilot_denorm_sync_trigger
AFTER UPDATE ON pilots
FOR EACH ROW
EXECUTE FUNCTION sync_pilot_request_denormalization();

-- Add comment documenting the trigger
COMMENT ON FUNCTION sync_pilot_request_denormalization() IS
'Syncs denormalized pilot data (rank, employee_number, name) in pilot_requests when pilots table is updated';

COMMENT ON TRIGGER pilot_denorm_sync_trigger ON pilots IS
'Maintains denormalization consistency between pilots and pilot_requests tables';
