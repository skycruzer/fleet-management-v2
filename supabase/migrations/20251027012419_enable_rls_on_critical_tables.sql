-- ============================================================================
-- Migration: Enable RLS on Critical Tables
-- Created: 2025-10-27
-- Purpose: Fix CRITICAL security vulnerability - pilot_users and other tables exposed
-- Reference: SUPABASE_DATABASE_REVIEW.md - Critical Issue #1
-- ============================================================================

-- CRITICAL SECURITY FIX: These tables have NO Row Level Security enabled
-- This means anyone can read/modify all data without authentication!

-- ============================================================================
-- PHASE 1: Enable RLS on pilot_users (CRITICAL)
-- ============================================================================

-- Enable RLS on pilot_users table
ALTER TABLE pilot_users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own pilot_user profile
CREATE POLICY "Users can view own pilot_user profile"
  ON pilot_users FOR SELECT
  USING (id = auth.uid());

-- Policy: Admins can view all pilot_users
CREATE POLICY "Admins can view all pilot_users"
  ON pilot_users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role = 'admin'
    )
  );

-- Policy: Admins can insert pilot_users
CREATE POLICY "Admins can insert pilot_users"
  ON pilot_users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role = 'admin'
    )
  );

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own pilot_user profile"
  ON pilot_users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Policy: Admins can update any pilot_user
CREATE POLICY "Admins can update any pilot_user"
  ON pilot_users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role = 'admin'
    )
  );

-- Policy: Admins can delete pilot_users
CREATE POLICY "Admins can delete pilot_users"
  ON pilot_users FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role = 'admin'
    )
  );

COMMENT ON TABLE pilot_users IS
'Pilot portal user accounts linked to pilot records - RLS ENABLED for security';

-- ============================================================================
-- PHASE 2: Enable RLS on certification_renewal_plans
-- ============================================================================

-- Enable RLS on certification_renewal_plans
ALTER TABLE certification_renewal_plans ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own renewal plans
CREATE POLICY "Pilots can view own renewal plans"
  ON certification_renewal_plans FOR SELECT
  USING (
    pilot_id IN (
      SELECT id FROM pilots WHERE user_id = auth.uid()
    )
  );

-- Policy: Admins and managers can view all renewal plans
CREATE POLICY "Admins can view all renewal plans"
  ON certification_renewal_plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role IN ('admin', 'manager')
    )
  );

-- Policy: Admins and managers can create renewal plans
CREATE POLICY "Admins can create renewal plans"
  ON certification_renewal_plans FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role IN ('admin', 'manager')
    )
  );

-- Policy: Admins and managers can update renewal plans
CREATE POLICY "Admins can update renewal plans"
  ON certification_renewal_plans FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role IN ('admin', 'manager')
    )
  );

-- Policy: Admins can delete renewal plans
CREATE POLICY "Admins can delete renewal plans"
  ON certification_renewal_plans FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role = 'admin'
    )
  );

COMMENT ON TABLE certification_renewal_plans IS
'Stores planned renewal schedule for pilot certifications - RLS ENABLED';

-- ============================================================================
-- PHASE 3: Enable RLS on renewal_plan_history
-- ============================================================================

-- Enable RLS on renewal_plan_history (audit trail - read-only for most users)
ALTER TABLE renewal_plan_history ENABLE ROW LEVEL SECURITY;

-- Policy: Admins and managers can view renewal history
CREATE POLICY "Admins can view renewal history"
  ON renewal_plan_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role IN ('admin', 'manager')
    )
  );

-- Policy: System can insert history records (for triggers)
CREATE POLICY "System can insert renewal history"
  ON renewal_plan_history FOR INSERT
  WITH CHECK (true);  -- Allow inserts from triggers

-- Policy: Prevent updates to history (audit integrity)
CREATE POLICY "Prevent updates to renewal history"
  ON renewal_plan_history FOR UPDATE
  USING (false);

-- Policy: Prevent deletions (audit integrity)
CREATE POLICY "Prevent deletions of renewal history"
  ON renewal_plan_history FOR DELETE
  USING (false);

COMMENT ON TABLE renewal_plan_history IS
'Audit trail for renewal plan changes - RLS ENABLED, insert-only for audit integrity';

-- ============================================================================
-- PHASE 4: Enable RLS on roster_period_capacity (Optional)
-- ============================================================================

-- Enable RLS on roster_period_capacity
ALTER TABLE roster_period_capacity ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view capacity data
CREATE POLICY "Authenticated users can view capacity"
  ON roster_period_capacity FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy: Admins can manage capacity settings
CREATE POLICY "Admins can manage capacity"
  ON roster_period_capacity FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role = 'admin'
    )
  );

COMMENT ON TABLE roster_period_capacity IS
'Tracks capacity limits for each roster period - RLS ENABLED';

-- ============================================================================
-- Migration Complete - Security Hardened
-- ============================================================================

-- Summary of changes:
--  pilot_users - RLS ENABLED (CRITICAL SECURITY FIX)
--  certification_renewal_plans - RLS ENABLED
--  renewal_plan_history - RLS ENABLED (audit trail protected)
--  roster_period_capacity - RLS ENABLED

-- Before: 25/29 tables protected (86%)
-- After:  29/29 tables protected (100%) 

-- Security Status: ALL TABLES NOW PROTECTED
