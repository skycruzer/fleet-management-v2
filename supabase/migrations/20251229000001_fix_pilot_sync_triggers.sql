-- Migration: Fix Pilot Sync Triggers
-- Date: 2025-12-29
-- Description: Fix sync_pilot_to_requests and sync_pilot_request_denormalization
--              triggers that incorrectly reference pilots.full_name column
-- Author: Maurice (Skycruzer)
--
-- ISSUE: The triggers reference `OLD.full_name` and `NEW.full_name` but the pilots
-- table only has `first_name` and `last_name` columns separately.
-- This causes error: record "old" has no field "full_name"

-- =====================================================
-- FIX: sync_pilot_to_requests
-- =====================================================

CREATE OR REPLACE FUNCTION public.sync_pilot_to_requests()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync pilot data to pilot_requests when pilot is updated
  IF TG_OP = 'UPDATE' THEN
    UPDATE public.pilot_requests
    SET
      rank = NEW.role,
      employee_number = NEW.employee_id,
      -- Use first_name and last_name instead of non-existent full_name
      name = NEW.first_name || ' ' || NEW.last_name
    WHERE pilot_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- =====================================================
-- FIX: sync_pilot_request_denormalization
-- =====================================================

CREATE OR REPLACE FUNCTION public.sync_pilot_request_denormalization()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if relevant fields have changed
  -- Compare first_name and last_name instead of non-existent full_name
  IF (OLD.role IS DISTINCT FROM NEW.role OR
      OLD.employee_id IS DISTINCT FROM NEW.employee_id OR
      OLD.first_name IS DISTINCT FROM NEW.first_name OR
      OLD.last_name IS DISTINCT FROM NEW.last_name) THEN

    UPDATE public.pilot_requests
    SET
      rank = NEW.role,
      employee_number = NEW.employee_id,
      name = NEW.first_name || ' ' || NEW.last_name
    WHERE pilot_id = NEW.id;

    RAISE NOTICE 'Synced denormalized data for pilot %', NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- Log the migration
DO $$
BEGIN
  RAISE NOTICE 'Migration 20251229000001_fix_pilot_sync_triggers completed - fixed full_name references';
END $$;
