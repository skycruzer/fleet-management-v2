-- Fix: Drop broken trigger that references non-existent full_name column on pilots table
-- Root cause: sync_pilot_request_denormalization() uses NEW.full_name but pilots table
-- only has first_name, middle_name, last_name (no full_name column).
-- This causes every pilot UPDATE to fail with "record has no field 'full_name'".
--
-- The sync_pilot_to_requests trigger already covers the same denormalization correctly
-- using NEW.first_name || ' ' || NEW.last_name, so this trigger is redundant.

-- Drop the broken trigger
DROP TRIGGER IF EXISTS pilot_denorm_sync_trigger ON public.pilots;

-- Drop the broken function
DROP FUNCTION IF EXISTS public.sync_pilot_request_denormalization();
