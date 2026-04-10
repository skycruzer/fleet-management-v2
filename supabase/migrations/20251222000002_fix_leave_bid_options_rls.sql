-- Migration: Fix leave_bid_options RLS Policies
-- Date: 2025-12-22
-- Description: Update RLS policies to work with pilot portal custom auth (pilot_users)
-- Author: Maurice (Skycruzer)
--
-- ISSUE: Original RLS checked `pilots.user_id = auth.uid()` but pilot portal
-- uses custom authentication via `pilot_users` table, not Supabase Auth.
--
-- SOLUTION: Use a session variable `app.current_pilot_user_id` that the
-- pilot portal API sets for authenticated requests.

-- =====================================================
-- DROP EXISTING BROKEN POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Pilots can view their own bid options" ON leave_bid_options;
DROP POLICY IF EXISTS "Pilots can insert their own bid options" ON leave_bid_options;
DROP POLICY IF EXISTS "Pilots can update their own bid options" ON leave_bid_options;
DROP POLICY IF EXISTS "Pilots can delete their own bid options" ON leave_bid_options;
DROP POLICY IF EXISTS "Admins can manage all bid options" ON leave_bid_options;

-- =====================================================
-- CREATE HELPER FUNCTION FOR PILOT PORTAL AUTH
-- =====================================================

CREATE OR REPLACE FUNCTION get_current_pilot_user_id()
RETURNS uuid AS $$
BEGIN
  -- Try to get pilot_user_id from session variable (set by pilot portal API)
  RETURN NULLIF(current_setting('app.current_pilot_user_id', true), '')::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper function to check if current user owns the bid
CREATE OR REPLACE FUNCTION user_owns_leave_bid(bid_uuid uuid)
RETURNS boolean AS $$
DECLARE
  pilot_user_uuid uuid;
BEGIN
  -- Get the pilot_user_id from session
  pilot_user_uuid := get_current_pilot_user_id();

  IF pilot_user_uuid IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check if this pilot_user owns the bid via pilot_id
  RETURN EXISTS (
    SELECT 1
    FROM leave_bids lb
    INNER JOIN pilot_users pu ON lb.pilot_id = pu.pilot_id
    WHERE lb.id = bid_uuid
    AND pu.id = pilot_user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- CREATE NEW RLS POLICIES
-- =====================================================

-- Policy: Allow service role full access (for admin operations)
CREATE POLICY "Service role full access to bid options"
ON leave_bid_options
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Policy: Pilots can view their own bid options
CREATE POLICY "Pilots can view their own bid options"
ON leave_bid_options
FOR SELECT
USING (
  user_owns_leave_bid(bid_id)
  OR auth.role() = 'service_role'
  OR (SELECT current_user_is_an_admin())
);

-- Policy: Pilots can insert their own bid options
CREATE POLICY "Pilots can insert their own bid options"
ON leave_bid_options
FOR INSERT
WITH CHECK (
  user_owns_leave_bid(bid_id)
  OR auth.role() = 'service_role'
);

-- Policy: Pilots can update their own bid options
CREATE POLICY "Pilots can update their own bid options"
ON leave_bid_options
FOR UPDATE
USING (
  user_owns_leave_bid(bid_id)
  OR auth.role() = 'service_role'
)
WITH CHECK (
  user_owns_leave_bid(bid_id)
  OR auth.role() = 'service_role'
);

-- Policy: Pilots can delete their own bid options
CREATE POLICY "Pilots can delete their own bid options"
ON leave_bid_options
FOR DELETE
USING (
  user_owns_leave_bid(bid_id)
  OR auth.role() = 'service_role'
);

-- =====================================================
-- ADMIN POLICY (for dashboard access)
-- =====================================================

CREATE POLICY "Admins can manage all bid options"
ON leave_bid_options
FOR ALL
USING (
  (SELECT current_user_is_an_admin())
)
WITH CHECK (
  (SELECT current_user_is_an_admin())
);

-- Log the migration
DO $$
BEGIN
  RAISE NOTICE 'Migration 20251222000002_fix_leave_bid_options_rls completed successfully';
END $$;
