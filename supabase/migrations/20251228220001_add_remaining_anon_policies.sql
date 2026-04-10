-- Add remaining ANON policies for tables used by admin portal
-- Specifically an_users which is needed for authorization checks
-- Author: Maurice Rondeau
-- Date: 2025-12-28

-- ============================================================================
-- AN_USERS - Admin user accounts (needed for authorization checks)
-- ============================================================================

DROP POLICY IF EXISTS "an_users_anon_select" ON an_users;
DROP POLICY IF EXISTS "an_users_anon_insert" ON an_users;
DROP POLICY IF EXISTS "an_users_anon_update" ON an_users;

CREATE POLICY "an_users_anon_select"
  ON an_users
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "an_users_anon_insert"
  ON an_users
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "an_users_anon_update"
  ON an_users
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- ADMIN_SESSIONS - Admin session tokens (if exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_sessions') THEN
    EXECUTE 'DROP POLICY IF EXISTS "admin_sessions_anon_select" ON admin_sessions';
    EXECUTE 'DROP POLICY IF EXISTS "admin_sessions_anon_insert" ON admin_sessions';
    EXECUTE 'DROP POLICY IF EXISTS "admin_sessions_anon_update" ON admin_sessions';

    EXECUTE 'CREATE POLICY "admin_sessions_anon_select" ON admin_sessions FOR SELECT TO anon USING (true)';
    EXECUTE 'CREATE POLICY "admin_sessions_anon_insert" ON admin_sessions FOR INSERT TO anon WITH CHECK (true)';
    EXECUTE 'CREATE POLICY "admin_sessions_anon_update" ON admin_sessions FOR UPDATE TO anon USING (true) WITH CHECK (true)';

    RAISE NOTICE 'Added ANON policies for admin_sessions table';
  END IF;
END $$;

-- ============================================================================
-- PILOT_SESSIONS - Pilot session tokens (if exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pilot_sessions') THEN
    EXECUTE 'DROP POLICY IF EXISTS "pilot_sessions_anon_select" ON pilot_sessions';
    EXECUTE 'DROP POLICY IF EXISTS "pilot_sessions_anon_insert" ON pilot_sessions';
    EXECUTE 'DROP POLICY IF EXISTS "pilot_sessions_anon_update" ON pilot_sessions';

    EXECUTE 'CREATE POLICY "pilot_sessions_anon_select" ON pilot_sessions FOR SELECT TO anon USING (true)';
    EXECUTE 'CREATE POLICY "pilot_sessions_anon_insert" ON pilot_sessions FOR INSERT TO anon WITH CHECK (true)';
    EXECUTE 'CREATE POLICY "pilot_sessions_anon_update" ON pilot_sessions FOR UPDATE TO anon USING (true) WITH CHECK (true)';

    RAISE NOTICE 'Added ANON policies for pilot_sessions table';
  END IF;
END $$;

-- ============================================================================
-- TASK_CATEGORIES - Task category reference data
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_categories') THEN
    EXECUTE 'DROP POLICY IF EXISTS "task_categories_anon_select" ON task_categories';
    EXECUTE 'DROP POLICY IF EXISTS "task_categories_anon_insert" ON task_categories';
    EXECUTE 'DROP POLICY IF EXISTS "task_categories_anon_update" ON task_categories';

    EXECUTE 'CREATE POLICY "task_categories_anon_select" ON task_categories FOR SELECT TO anon USING (true)';
    EXECUTE 'CREATE POLICY "task_categories_anon_insert" ON task_categories FOR INSERT TO anon WITH CHECK (true)';
    EXECUTE 'CREATE POLICY "task_categories_anon_update" ON task_categories FOR UPDATE TO anon USING (true) WITH CHECK (true)';

    RAISE NOTICE 'Added ANON policies for task_categories table';
  END IF;
END $$;

-- ============================================================================
-- CHECK_TYPES - Certification type reference data
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'check_types') THEN
    EXECUTE 'DROP POLICY IF EXISTS "check_types_anon_select" ON check_types';
    EXECUTE 'DROP POLICY IF EXISTS "check_types_anon_insert" ON check_types';
    EXECUTE 'DROP POLICY IF EXISTS "check_types_anon_update" ON check_types';

    EXECUTE 'CREATE POLICY "check_types_anon_select" ON check_types FOR SELECT TO anon USING (true)';
    EXECUTE 'CREATE POLICY "check_types_anon_insert" ON check_types FOR INSERT TO anon WITH CHECK (true)';
    EXECUTE 'CREATE POLICY "check_types_anon_update" ON check_types FOR UPDATE TO anon USING (true) WITH CHECK (true)';

    RAISE NOTICE 'Added ANON policies for check_types table';
  END IF;
END $$;

-- ============================================================================
-- SETTINGS - Application settings
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'settings') THEN
    EXECUTE 'DROP POLICY IF EXISTS "settings_anon_select" ON settings';
    EXECUTE 'DROP POLICY IF EXISTS "settings_anon_insert" ON settings';
    EXECUTE 'DROP POLICY IF EXISTS "settings_anon_update" ON settings';

    EXECUTE 'CREATE POLICY "settings_anon_select" ON settings FOR SELECT TO anon USING (true)';
    EXECUTE 'CREATE POLICY "settings_anon_insert" ON settings FOR INSERT TO anon WITH CHECK (true)';
    EXECUTE 'CREATE POLICY "settings_anon_update" ON settings FOR UPDATE TO anon USING (true) WITH CHECK (true)';

    RAISE NOTICE 'Added ANON policies for settings table';
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'ANON policies added for: an_users, admin_sessions, pilot_sessions, task_categories, check_types, settings';
END $$;
