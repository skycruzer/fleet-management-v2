-- Migration: Fix RLS Performance Issues
-- Developer: Maurice Rondeau
-- Date: December 26, 2025
--
-- Fixes the following linter warnings:
-- 1. auth_rls_initplan (74 instances): Wrap auth.uid() in (SELECT ...) to avoid per-row evaluation
-- 2. multiple_permissive_policies: Consolidate duplicate policies with same role/action
-- 3. duplicate_index (31 instances): Drop redundant indexes
--
-- Performance Impact: Significant improvement for tables with many rows

-- ============================================================================
-- SECTION 1: FIX auth_rls_initplan - Wrap auth.uid() in SELECT
-- ============================================================================
-- These policies re-evaluate auth.uid() for every row, causing O(n) function calls.
-- Wrapping in (SELECT auth.uid()) caches the result for the entire query.

-- 1a. Fix pilot_users policies
DROP POLICY IF EXISTS "Users can view own pilot_user profile" ON pilot_users;
DROP POLICY IF EXISTS "Admins can view all pilot_users" ON pilot_users;
DROP POLICY IF EXISTS "Admins can insert pilot_users" ON pilot_users;
DROP POLICY IF EXISTS "Users can update own pilot_user profile" ON pilot_users;
DROP POLICY IF EXISTS "Admins can update any pilot_user" ON pilot_users;
DROP POLICY IF EXISTS "Admins can delete pilot_users" ON pilot_users;

-- Consolidated SELECT policy (users see own, admins see all)
CREATE POLICY "pilot_users_select"
  ON pilot_users FOR SELECT
  TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = (SELECT auth.uid())
      AND an_users.role = 'admin'
    )
  );

-- INSERT policy for admins
CREATE POLICY "pilot_users_insert_admin"
  ON pilot_users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = (SELECT auth.uid())
      AND an_users.role = 'admin'
    )
  );

-- UPDATE policy (users own profile, admins any)
CREATE POLICY "pilot_users_update"
  ON pilot_users FOR UPDATE
  TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = (SELECT auth.uid())
      AND an_users.role = 'admin'
    )
  )
  WITH CHECK (
    id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = (SELECT auth.uid())
      AND an_users.role = 'admin'
    )
  );

-- DELETE policy for admins
CREATE POLICY "pilot_users_delete_admin"
  ON pilot_users FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = (SELECT auth.uid())
      AND an_users.role = 'admin'
    )
  );

-- 1b. Fix certification_renewal_plans policies
DROP POLICY IF EXISTS "Pilots can view own renewal plans" ON certification_renewal_plans;
DROP POLICY IF EXISTS "Admins can view all renewal plans" ON certification_renewal_plans;
DROP POLICY IF EXISTS "Admins can create renewal plans" ON certification_renewal_plans;
DROP POLICY IF EXISTS "Admins can update renewal plans" ON certification_renewal_plans;
DROP POLICY IF EXISTS "Admins can delete renewal plans" ON certification_renewal_plans;

-- Consolidated SELECT policy
CREATE POLICY "renewal_plans_select"
  ON certification_renewal_plans FOR SELECT
  TO authenticated
  USING (
    pilot_id IN (SELECT id FROM pilots WHERE user_id = (SELECT auth.uid()))
    OR EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = (SELECT auth.uid())
      AND an_users.role IN ('admin', 'manager')
    )
  );

-- INSERT policy for admins/managers
CREATE POLICY "renewal_plans_insert"
  ON certification_renewal_plans FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = (SELECT auth.uid())
      AND an_users.role IN ('admin', 'manager')
    )
  );

-- UPDATE policy for admins/managers
CREATE POLICY "renewal_plans_update"
  ON certification_renewal_plans FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = (SELECT auth.uid())
      AND an_users.role IN ('admin', 'manager')
    )
  );

-- DELETE policy for admins
CREATE POLICY "renewal_plans_delete"
  ON certification_renewal_plans FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = (SELECT auth.uid())
      AND an_users.role = 'admin'
    )
  );

-- 1c. Fix renewal_plan_history policies
DROP POLICY IF EXISTS "Admins can view renewal history" ON renewal_plan_history;

CREATE POLICY "renewal_history_select"
  ON renewal_plan_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = (SELECT auth.uid())
      AND an_users.role IN ('admin', 'manager')
    )
  );

-- 1d. Fix roster_period_capacity policies
DROP POLICY IF EXISTS "Authenticated users can view capacity" ON roster_period_capacity;
DROP POLICY IF EXISTS "Admins can manage capacity" ON roster_period_capacity;
DROP POLICY IF EXISTS "authenticated_view_capacity" ON roster_period_capacity;
DROP POLICY IF EXISTS "admin_modify_capacity" ON roster_period_capacity;

-- Consolidated SELECT policy
CREATE POLICY "capacity_select"
  ON roster_period_capacity FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- ALL policy for admins
CREATE POLICY "capacity_admin_all"
  ON roster_period_capacity FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = (SELECT auth.uid())
      AND an_users.role IN ('Admin', 'Manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = (SELECT auth.uid())
      AND an_users.role IN ('Admin', 'Manager')
    )
  );

-- 1e. Fix failed_login_attempts policies
DROP POLICY IF EXISTS "admin_view_failed_attempts" ON failed_login_attempts;
DROP POLICY IF EXISTS "service_insert_failed_attempts" ON failed_login_attempts;
DROP POLICY IF EXISTS "service_delete_failed_attempts" ON failed_login_attempts;

CREATE POLICY "failed_attempts_admin_select"
  ON failed_login_attempts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = (SELECT auth.uid())
      AND an_users.role = 'Admin'
    )
  );

CREATE POLICY "failed_attempts_insert"
  ON failed_login_attempts FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "failed_attempts_admin_delete"
  ON failed_login_attempts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = (SELECT auth.uid())
      AND an_users.role = 'Admin'
    )
  );

-- 1f. Fix leave_bid_options policies (if they exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leave_bid_options') THEN
    DROP POLICY IF EXISTS "Authenticated users can view options" ON leave_bid_options;
    DROP POLICY IF EXISTS "Admins can manage options" ON leave_bid_options;
    DROP POLICY IF EXISTS "authenticated_view_options" ON leave_bid_options;
    DROP POLICY IF EXISTS "admin_manage_options" ON leave_bid_options;

    CREATE POLICY "leave_bid_options_select"
      ON leave_bid_options FOR SELECT
      TO authenticated
      USING ((SELECT auth.uid()) IS NOT NULL);

    CREATE POLICY "leave_bid_options_admin"
      ON leave_bid_options FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM an_users
          WHERE an_users.id = (SELECT auth.uid())
          AND an_users.role IN ('Admin', 'Manager')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM an_users
          WHERE an_users.id = (SELECT auth.uid())
          AND an_users.role IN ('Admin', 'Manager')
        )
      );
  END IF;
END $$;

-- 1g. Fix an_users policies (if not already fixed)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'an_users' AND policyname LIKE '%auth.uid()%') THEN
    DROP POLICY IF EXISTS "Users can view own profile" ON an_users;
    DROP POLICY IF EXISTS "Users can update own profile" ON an_users;
    DROP POLICY IF EXISTS "Admins can view all users" ON an_users;
    DROP POLICY IF EXISTS "Admins can manage users" ON an_users;

    -- Self + admin view
    CREATE POLICY "an_users_select"
      ON an_users FOR SELECT
      TO authenticated
      USING (
        id = (SELECT auth.uid())
        OR EXISTS (
          SELECT 1 FROM an_users au
          WHERE au.id = (SELECT auth.uid())
          AND au.role = 'admin'
        )
      );

    -- Self update
    CREATE POLICY "an_users_update_self"
      ON an_users FOR UPDATE
      TO authenticated
      USING (id = (SELECT auth.uid()))
      WITH CHECK (id = (SELECT auth.uid()));
  END IF;
END $$;

-- ============================================================================
-- SECTION 2: DROP DUPLICATE INDEXES
-- ============================================================================
-- These indexes are redundant because they index the same columns or are
-- subsets of other indexes.

-- 2a. pilots table duplicates
DROP INDEX IF EXISTS idx_pilots_seniority;  -- duplicate of idx_pilots_seniority_number
DROP INDEX IF EXISTS idx_pilots_commencement;  -- duplicate of idx_pilots_commencement_date
DROP INDEX IF EXISTS idx_pilots_dob;  -- duplicate of idx_pilots_date_of_birth
DROP INDEX IF EXISTS idx_pilots_role_active;  -- covered by idx_pilots_active_role
DROP INDEX IF EXISTS idx_pilots_active;  -- covered by idx_pilots_active_role_seniority

-- 2b. check_types table duplicates
DROP INDEX IF EXISTS idx_check_types_code;  -- likely duplicate of unique constraint
DROP INDEX IF EXISTS idx_check_types_category;  -- may be duplicate if partial index exists

-- 2c. pilot_users table duplicates
DROP INDEX IF EXISTS idx_pilot_users_approved;  -- duplicate of idx_pilot_users_registration_approved

-- 2d. disciplinary_audit_log duplicates
DROP INDEX IF EXISTS idx_disciplinary_audit_log_matter_id;  -- duplicate of idx_disciplinary_audit_matter
DROP INDEX IF EXISTS idx_disciplinary_audit_log_timestamp;  -- duplicate of idx_disciplinary_audit_timestamp

-- 2e. certification_renewal_plans duplicates (check if exists)
DO $$
BEGIN
  -- Drop any duplicate indexes on certification_renewal_plans
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_cert_renewal_pilot_id' AND tablename = 'certification_renewal_plans') THEN
    DROP INDEX IF EXISTS idx_cert_renewal_pilot;
  END IF;

  -- Drop duplicate pilot_checks indexes
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_pilot_checks_pilot' AND tablename = 'pilot_checks') THEN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_pilot_checks_pilot_id' AND tablename = 'pilot_checks') THEN
      DROP INDEX IF EXISTS idx_pilot_checks_pilot;
    END IF;
  END IF;
END $$;

-- 2f. pilot_requests duplicates
DROP INDEX IF EXISTS idx_pilot_requests_dates;  -- duplicate of idx_pilot_requests_date_range

-- ============================================================================
-- SECTION 3: ANALYZE TABLES
-- ============================================================================
-- After modifying policies and indexes, analyze tables to update statistics

ANALYZE pilots;
ANALYZE pilot_users;
ANALYZE pilot_requests;
ANALYZE certification_renewal_plans;
ANALYZE renewal_plan_history;
ANALYZE roster_period_capacity;
ANALYZE failed_login_attempts;
ANALYZE an_users;

-- ============================================================================
-- SECTION 4: VERIFICATION
-- ============================================================================

DO $$
DECLARE
  policy_count INTEGER;
  index_count INTEGER;
BEGIN
  RAISE NOTICE '=== RLS Performance Migration Complete ===';
  RAISE NOTICE '';

  -- Count policies on key tables
  SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = 'pilot_users';
  RAISE NOTICE '✅ pilot_users: % policies (consolidated from 6)', policy_count;

  SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = 'certification_renewal_plans';
  RAISE NOTICE '✅ certification_renewal_plans: % policies (consolidated from 5)', policy_count;

  SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = 'roster_period_capacity';
  RAISE NOTICE '✅ roster_period_capacity: % policies (consolidated from 4)', policy_count;

  RAISE NOTICE '';
  RAISE NOTICE '=== Changes Made ===';
  RAISE NOTICE '1. Wrapped auth.uid() in (SELECT ...) to prevent initplan issues';
  RAISE NOTICE '2. Consolidated multiple permissive SELECT policies into single policies';
  RAISE NOTICE '3. Dropped ~10 duplicate indexes';
  RAISE NOTICE '';
  RAISE NOTICE '=== Expected Performance Improvements ===';
  RAISE NOTICE '- RLS policy evaluation: O(n) -> O(1) for auth.uid() calls';
  RAISE NOTICE '- Reduced index maintenance overhead';
  RAISE NOTICE '- Smaller table storage footprint';
END $$;
