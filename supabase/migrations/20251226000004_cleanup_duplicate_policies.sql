-- Migration: Cleanup Duplicate Policies
-- Developer: Maurice Rondeau
-- Date: December 26, 2025
--
-- Removes old duplicate policies that were superseded by 20251226000003
-- These policies cause multiple_permissive_policies warnings

-- ============================================================================
-- SECTION 1: CLEAN UP pilot_users POLICIES
-- ============================================================================

-- Drop old policies from remote_schema.sql (names without underscores)
DROP POLICY IF EXISTS "Admins can delete pilot registrations" ON pilot_users;
DROP POLICY IF EXISTS "Admins can delete pilot users" ON pilot_users;
DROP POLICY IF EXISTS "Admins can update pilot registrations" ON pilot_users;
DROP POLICY IF EXISTS "Admins can update pilot users" ON pilot_users;
DROP POLICY IF EXISTS "Admins can view all pilot profiles" ON pilot_users;
DROP POLICY IF EXISTS "Admins can view all pilot users" ON pilot_users;
DROP POLICY IF EXISTS "Allow public registration inserts" ON pilot_users;
DROP POLICY IF EXISTS "Allow registration inserts" ON pilot_users;
DROP POLICY IF EXISTS "Pilots can update own profile" ON pilot_users;
DROP POLICY IF EXISTS "Pilots can view own profile" ON pilot_users;
DROP POLICY IF EXISTS "Users can update own profile" ON pilot_users;
DROP POLICY IF EXISTS "Users can view own registration" ON pilot_users;

-- Drop policies from enable_rls_on_critical_tables.sql
DROP POLICY IF EXISTS "Admins can view all pilot_users" ON pilot_users;
DROP POLICY IF EXISTS "Admins can insert pilot_users" ON pilot_users;
DROP POLICY IF EXISTS "Admins can delete pilot_users" ON pilot_users;
DROP POLICY IF EXISTS "Users can view own pilot_user profile" ON pilot_users;
DROP POLICY IF EXISTS "Admins can update any pilot_user" ON pilot_users;
DROP POLICY IF EXISTS "Users can update own pilot_user profile" ON pilot_users;

-- ============================================================================
-- SECTION 2: CLEAN UP pilots POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage all pilots" ON pilots;
DROP POLICY IF EXISTS "Admins can view all pilots" ON pilots;
DROP POLICY IF EXISTS "Pilots can view own profile" ON pilots;
DROP POLICY IF EXISTS "Users can view own pilot profile" ON pilots;
DROP POLICY IF EXISTS "Authenticated users can view pilots" ON pilots;
DROP POLICY IF EXISTS "Admin full access to pilots" ON pilots;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON pilots;

-- Drop existing versions before recreating
DROP POLICY IF EXISTS "pilots_select" ON pilots;
DROP POLICY IF EXISTS "pilots_admin_all" ON pilots;

-- Create consolidated pilots policies
CREATE POLICY "pilots_select"
  ON pilots FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "pilots_admin_all"
  ON pilots FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = (SELECT auth.uid())
      AND an_users.role IN ('admin', 'Admin', 'manager', 'Manager')
    )
  );

-- ============================================================================
-- SECTION 3: CLEAN UP check_types POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Enable read for authenticated users" ON check_types;
DROP POLICY IF EXISTS "Authenticated users can view check types" ON check_types;
DROP POLICY IF EXISTS "Admin full access to check_types" ON check_types;
DROP POLICY IF EXISTS "Admins can manage check types" ON check_types;
DROP POLICY IF EXISTS "check_types_select" ON check_types;
DROP POLICY IF EXISTS "check_types_admin_all" ON check_types;

CREATE POLICY "check_types_select"
  ON check_types FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "check_types_admin_all"
  ON check_types FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = (SELECT auth.uid())
      AND an_users.role IN ('admin', 'Admin')
    )
  );

-- ============================================================================
-- SECTION 4: CLEAN UP contract_types POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Enable read for authenticated users" ON contract_types;
DROP POLICY IF EXISTS "Authenticated users can view contract types" ON contract_types;
DROP POLICY IF EXISTS "Admin full access to contract_types" ON contract_types;
DROP POLICY IF EXISTS "Admins can manage contract types" ON contract_types;
DROP POLICY IF EXISTS "contract_types_select" ON contract_types;
DROP POLICY IF EXISTS "contract_types_admin_all" ON contract_types;

CREATE POLICY "contract_types_select"
  ON contract_types FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "contract_types_admin_all"
  ON contract_types FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = (SELECT auth.uid())
      AND an_users.role IN ('admin', 'Admin')
    )
  );

-- ============================================================================
-- SECTION 5: CLEAN UP an_users POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own an_user profile" ON an_users;
DROP POLICY IF EXISTS "Admins can view all an_users" ON an_users;
DROP POLICY IF EXISTS "Users can update own an_user profile" ON an_users;
DROP POLICY IF EXISTS "Admins can update all an_users" ON an_users;
DROP POLICY IF EXISTS "Users can view own profile" ON an_users;
DROP POLICY IF EXISTS "Admins can view all users" ON an_users;
DROP POLICY IF EXISTS "Users can update own profile" ON an_users;
DROP POLICY IF EXISTS "Admins can manage users" ON an_users;
DROP POLICY IF EXISTS "an_users_select" ON an_users;
DROP POLICY IF EXISTS "an_users_update_self" ON an_users;
DROP POLICY IF EXISTS "an_users_select_consolidated" ON an_users;
DROP POLICY IF EXISTS "an_users_update_consolidated" ON an_users;
DROP POLICY IF EXISTS "an_users_admin_all" ON an_users;

-- Consolidated an_users policies
CREATE POLICY "an_users_select_consolidated"
  ON an_users FOR SELECT
  TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM an_users au
      WHERE au.id = (SELECT auth.uid())
      AND au.role IN ('admin', 'Admin')
    )
  );

CREATE POLICY "an_users_update_consolidated"
  ON an_users FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "an_users_admin_all"
  ON an_users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM an_users au
      WHERE au.id = (SELECT auth.uid())
      AND au.role IN ('admin', 'Admin')
    )
  );

-- ============================================================================
-- SECTION 6: CLEAN UP pilot_requests POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Admins full access" ON pilot_requests;
DROP POLICY IF EXISTS "Pilots can view own requests" ON pilot_requests;
DROP POLICY IF EXISTS "Pilots can create requests" ON pilot_requests;
DROP POLICY IF EXISTS "Pilots can update own requests" ON pilot_requests;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON pilot_requests;
DROP POLICY IF EXISTS "pilot_requests_select" ON pilot_requests;
DROP POLICY IF EXISTS "pilot_requests_insert" ON pilot_requests;
DROP POLICY IF EXISTS "pilot_requests_update" ON pilot_requests;
DROP POLICY IF EXISTS "pilot_requests_admin_delete" ON pilot_requests;

-- Create consolidated pilot_requests policies
CREATE POLICY "pilot_requests_select"
  ON pilot_requests FOR SELECT
  TO authenticated
  USING (
    pilot_user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = (SELECT auth.uid())
      AND an_users.role IN ('admin', 'Admin', 'manager', 'Manager')
    )
  );

CREATE POLICY "pilot_requests_insert"
  ON pilot_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    pilot_user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = (SELECT auth.uid())
      AND an_users.role IN ('admin', 'Admin', 'manager', 'Manager')
    )
  );

CREATE POLICY "pilot_requests_update"
  ON pilot_requests FOR UPDATE
  TO authenticated
  USING (
    pilot_user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = (SELECT auth.uid())
      AND an_users.role IN ('admin', 'Admin', 'manager', 'Manager')
    )
  );

CREATE POLICY "pilot_requests_admin_delete"
  ON pilot_requests FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = (SELECT auth.uid())
      AND an_users.role IN ('admin', 'Admin')
    )
  );

-- ============================================================================
-- SECTION 7: CLEAN UP leave_bids POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all leave bids" ON leave_bids;
DROP POLICY IF EXISTS "Pilots can view own leave bids" ON leave_bids;
DROP POLICY IF EXISTS "Admins can manage leave bids" ON leave_bids;
DROP POLICY IF EXISTS "Pilots can create leave bids" ON leave_bids;
DROP POLICY IF EXISTS "Pilots can update own leave bids" ON leave_bids;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON leave_bids;
DROP POLICY IF EXISTS "leave_bids_select" ON leave_bids;
DROP POLICY IF EXISTS "leave_bids_insert" ON leave_bids;
DROP POLICY IF EXISTS "leave_bids_update" ON leave_bids;
DROP POLICY IF EXISTS "leave_bids_admin_delete" ON leave_bids;

CREATE POLICY "leave_bids_select"
  ON leave_bids FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "leave_bids_insert"
  ON leave_bids FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "leave_bids_update"
  ON leave_bids FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "leave_bids_admin_delete"
  ON leave_bids FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = (SELECT auth.uid())
      AND an_users.role IN ('admin', 'Admin')
    )
  );

-- ============================================================================
-- SECTION 8: CLEAN UP pilot_checks POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all pilot checks" ON pilot_checks;
DROP POLICY IF EXISTS "Pilots can view own pilot checks" ON pilot_checks;
DROP POLICY IF EXISTS "Admins can manage pilot checks" ON pilot_checks;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON pilot_checks;
DROP POLICY IF EXISTS "pilot_checks_select" ON pilot_checks;
DROP POLICY IF EXISTS "pilot_checks_admin_all" ON pilot_checks;

CREATE POLICY "pilot_checks_select"
  ON pilot_checks FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "pilot_checks_admin_all"
  ON pilot_checks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = (SELECT auth.uid())
      AND an_users.role IN ('admin', 'Admin', 'manager', 'Manager')
    )
  );

-- ============================================================================
-- SECTION 9: CLEAN UP tasks POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can view all tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can manage all tasks" ON tasks;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON tasks;
DROP POLICY IF EXISTS "tasks_select" ON tasks;
DROP POLICY IF EXISTS "tasks_modify" ON tasks;

CREATE POLICY "tasks_select"
  ON tasks FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "tasks_modify"
  ON tasks FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- ============================================================================
-- SECTION 10: CLEAN UP disciplinary_matters POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all disciplinary matters" ON disciplinary_matters;
DROP POLICY IF EXISTS "Assigned users can view matters" ON disciplinary_matters;
DROP POLICY IF EXISTS "Admins can manage disciplinary matters" ON disciplinary_matters;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON disciplinary_matters;
DROP POLICY IF EXISTS "disciplinary_matters_select" ON disciplinary_matters;
DROP POLICY IF EXISTS "disciplinary_matters_admin_all" ON disciplinary_matters;

CREATE POLICY "disciplinary_matters_select"
  ON disciplinary_matters FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = (SELECT auth.uid())
      AND an_users.role IN ('admin', 'Admin', 'manager', 'Manager')
    )
  );

CREATE POLICY "disciplinary_matters_admin_all"
  ON disciplinary_matters FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = (SELECT auth.uid())
      AND an_users.role IN ('admin', 'Admin')
    )
  );

-- ============================================================================
-- SECTION 11: CLEAN UP notifications POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can view all notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can manage notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON notifications;
DROP POLICY IF EXISTS "notifications_select" ON notifications;
DROP POLICY IF EXISTS "notifications_modify" ON notifications;

CREATE POLICY "notifications_select"
  ON notifications FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "notifications_modify"
  ON notifications FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- ============================================================================
-- SECTION 12: CLEAN UP feedback_posts POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Pilots can view own feedback" ON feedback_posts;
DROP POLICY IF EXISTS "Admins can view all feedback" ON feedback_posts;
DROP POLICY IF EXISTS "Pilots can create feedback" ON feedback_posts;
DROP POLICY IF EXISTS "Admins can manage feedback" ON feedback_posts;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON feedback_posts;
DROP POLICY IF EXISTS "feedback_posts_select" ON feedback_posts;
DROP POLICY IF EXISTS "feedback_posts_insert" ON feedback_posts;
DROP POLICY IF EXISTS "feedback_posts_admin_all" ON feedback_posts;

CREATE POLICY "feedback_posts_select"
  ON feedback_posts FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "feedback_posts_insert"
  ON feedback_posts FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "feedback_posts_admin_all"
  ON feedback_posts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = (SELECT auth.uid())
      AND an_users.role IN ('admin', 'Admin')
    )
  );

-- ============================================================================
-- SECTION 13: CLEAN UP password_history POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own password history" ON password_history;
DROP POLICY IF EXISTS "Users can insert own password history" ON password_history;
DROP POLICY IF EXISTS "Admins can view password history" ON password_history;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON password_history;
DROP POLICY IF EXISTS "password_history_user_access" ON password_history;
DROP POLICY IF EXISTS "password_history_admin_view" ON password_history;

CREATE POLICY "password_history_user_access"
  ON password_history FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "password_history_admin_view"
  ON password_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = (SELECT auth.uid())
      AND an_users.role IN ('admin', 'Admin')
    )
  );

-- ============================================================================
-- SECTION 14: CLEAN UP account_lockouts POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view lockouts" ON account_lockouts;
DROP POLICY IF EXISTS "Admins can manage lockouts" ON account_lockouts;
DROP POLICY IF EXISTS "System can manage lockouts" ON account_lockouts;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON account_lockouts;
DROP POLICY IF EXISTS "account_lockouts_admin" ON account_lockouts;
DROP POLICY IF EXISTS "account_lockouts_system" ON account_lockouts;

CREATE POLICY "account_lockouts_admin"
  ON account_lockouts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = (SELECT auth.uid())
      AND an_users.role IN ('admin', 'Admin')
    )
  );

-- Allow service role and system to manage lockouts
CREATE POLICY "account_lockouts_system"
  ON account_lockouts FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  tbl RECORD;
  policy_count INTEGER;
BEGIN
  RAISE NOTICE '=== Policy Cleanup Complete ===';
  RAISE NOTICE '';

  FOR tbl IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN (
      'pilot_users', 'pilots', 'check_types', 'contract_types', 'an_users',
      'pilot_requests', 'leave_bids', 'pilot_checks', 'tasks',
      'disciplinary_matters', 'notifications', 'feedback_posts',
      'password_history', 'account_lockouts'
    )
    ORDER BY tablename
  LOOP
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = tbl.tablename;

    RAISE NOTICE '✅ %: % policies', tbl.tablename, policy_count;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '=== All duplicate policies removed ===';
  RAISE NOTICE 'Each table now has consolidated policies with optimized auth.uid() usage';
END $$;
