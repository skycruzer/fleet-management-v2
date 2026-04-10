-- Data fix migration
-- Fixes duplicate data issues before applying UNIQUE constraints
-- Only fixes tables that exist and have the relevant columns

-- =============================================================================
-- FIX DUPLICATE DOCUMENT CATEGORIES
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'document_categories'
  ) THEN
    WITH duplicates AS (
      SELECT
        id,
        name,
        ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at ASC NULLS LAST, id) as rn
      FROM document_categories
    )
    DELETE FROM document_categories
    WHERE id IN (
      SELECT id FROM duplicates WHERE rn > 1
    );
    RAISE NOTICE 'Fixed duplicate document_categories';
  END IF;
END $$;

-- =============================================================================
-- FIX DUPLICATE TASK CATEGORIES
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'task_categories'
  ) THEN
    WITH duplicates AS (
      SELECT
        id,
        name,
        ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at ASC NULLS LAST, id) as rn
      FROM task_categories
    )
    DELETE FROM task_categories
    WHERE id IN (
      SELECT id FROM duplicates WHERE rn > 1
    );
    RAISE NOTICE 'Fixed duplicate task_categories';
  END IF;
END $$;

-- =============================================================================
-- FIX DUPLICATE FEEDBACK CATEGORIES
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'feedback_categories'
  ) THEN
    WITH duplicates AS (
      SELECT
        id,
        name,
        ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at ASC NULLS LAST, id) as rn
      FROM feedback_categories
    )
    DELETE FROM feedback_categories
    WHERE id IN (
      SELECT id FROM duplicates WHERE rn > 1
    );
    RAISE NOTICE 'Fixed duplicate feedback_categories';
  END IF;
END $$;

-- =============================================================================
-- FIX DUPLICATE PILOT EMAILS
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'pilot_users'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pilot_users' AND column_name = 'email'
  ) THEN
    WITH duplicates AS (
      SELECT
        id,
        email,
        ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at ASC NULLS LAST, id) as rn
      FROM pilot_users
      WHERE email IS NOT NULL
    )
    DELETE FROM pilot_users
    WHERE id IN (
      SELECT id FROM duplicates WHERE rn > 1
    );
    RAISE NOTICE 'Fixed duplicate pilot_users emails';
  END IF;
END $$;

-- =============================================================================
-- FIX DUPLICATE EMPLOYEE IDS
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pilots' AND column_name = 'employee_id'
  ) THEN
    WITH duplicates AS (
      SELECT
        id,
        employee_id,
        ROW_NUMBER() OVER (PARTITION BY employee_id ORDER BY created_at ASC NULLS LAST, id) as rn
      FROM pilots
      WHERE employee_id IS NOT NULL
    )
    UPDATE pilots
    SET employee_id = employee_id || '-DUP-' || id::text
    WHERE id IN (
      SELECT id FROM duplicates WHERE rn > 1
    );
    RAISE NOTICE 'Fixed duplicate employee_ids (added suffix)';
  END IF;
END $$;

-- =============================================================================
-- FIX PILOT_CHECKS WITH INVALID EXPIRY DATES
-- =============================================================================

DO $$
BEGIN
  -- Fix pilot_checks where expiry_date <= created_at
  -- Set expiry_date to created_at + 1 year for invalid entries
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'pilot_checks'
  ) THEN
    UPDATE pilot_checks
    SET expiry_date = created_at + INTERVAL '1 year'
    WHERE expiry_date IS NOT NULL
      AND expiry_date <= created_at;
    RAISE NOTICE 'Fixed pilot_checks with invalid expiry dates';
  END IF;
END $$;

-- =============================================================================
-- FIX LEAVE REQUESTS WITH INVALID DATE RANGES
-- =============================================================================

DO $$
BEGIN
  -- Fix leave_requests where end_date < start_date
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'leave_requests'
  ) THEN
    UPDATE leave_requests
    SET end_date = start_date
    WHERE end_date < start_date;
    RAISE NOTICE 'Fixed leave_requests with invalid date ranges';
  END IF;
END $$;

-- =============================================================================
-- FIX DISCIPLINARY_MATTERS SEVERITY VALUES
-- =============================================================================

DO $$
BEGIN
  -- Fix invalid severity values to 'medium' as default
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'disciplinary_matters'
  ) THEN
    -- Drop existing check constraints if they exist
    ALTER TABLE disciplinary_matters
      DROP CONSTRAINT IF EXISTS disciplinary_matters_severity_check;
    ALTER TABLE disciplinary_matters
      DROP CONSTRAINT IF EXISTS disciplinary_matters_status_check;

    -- Fix severity values
    UPDATE disciplinary_matters
    SET severity = 'medium'
    WHERE severity IS NOT NULL
      AND severity NOT IN ('low', 'medium', 'high', 'critical');

    -- Fix status values (convert to lowercase)
    UPDATE disciplinary_matters
    SET status = LOWER(status)
    WHERE status IS NOT NULL;

    -- Fix invalid status values to 'under_review'
    UPDATE disciplinary_matters
    SET status = 'under_review'
    WHERE status IS NOT NULL
      AND status NOT IN ('open', 'under_review', 'resolved', 'closed');

    RAISE NOTICE 'Fixed disciplinary_matters invalid severity and status values';
  END IF;
END $$;

-- =============================================================================
-- FIX CERTIFICATION_RENEWAL_PLANS STATUS VALUES
-- =============================================================================

DO $$
BEGIN
  -- Fix certification_renewal_plans status values
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'certification_renewal_plans'
  ) THEN
    -- Drop existing check constraints if they exist
    ALTER TABLE certification_renewal_plans
      DROP CONSTRAINT IF EXISTS certification_renewal_plans_status_check;
    ALTER TABLE certification_renewal_plans
      DROP CONSTRAINT IF EXISTS valid_status;

    -- Convert status to uppercase
    UPDATE certification_renewal_plans
    SET status = UPPER(status)
    WHERE status IS NOT NULL;

    -- Fix invalid status values to 'PENDING'
    UPDATE certification_renewal_plans
    SET status = 'PENDING'
    WHERE status IS NOT NULL
      AND status NOT IN ('PENDING', 'SCHEDULED', 'COMPLETED', 'CANCELLED');

    RAISE NOTICE 'Fixed certification_renewal_plans invalid status values';
  END IF;
END $$;

-- =============================================================================
-- FIX ROSTER_PERIOD_CAPACITY FORMAT
-- =============================================================================

DO $$
BEGIN
  -- Fix roster_period_capacity format
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'roster_period_capacity'
  ) THEN
    -- Delete roster periods that don't match the format (can't fix uniquely)
    DELETE FROM roster_period_capacity
    WHERE roster_period IS NOT NULL
      AND roster_period !~ '^RP(1[0-3]|[1-9])/\d{4}$';

    RAISE NOTICE 'Fixed roster_period_capacity invalid format (deleted invalid rows)';
  END IF;
END $$;

-- =============================================================================
-- FIX FEEDBACK_CATEGORIES DISPLAY_ORDER
-- =============================================================================

DO $$
BEGIN
  -- Fix feedback_categories display_order
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'feedback_categories'
  ) THEN
    -- Fix display_order values that are less than 1
    UPDATE feedback_categories
    SET display_order = 1
    WHERE display_order IS NOT NULL
      AND display_order < 1;

    RAISE NOTICE 'Fixed feedback_categories invalid display_order values';
  END IF;
END $$;

-- =============================================================================
-- SUMMARY
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Data deduplication and validation complete';
END $$;
