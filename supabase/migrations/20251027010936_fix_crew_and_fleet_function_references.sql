-- ============================================================================
-- Migration: Fix Crew and Fleet Function References
-- Created: 2025-10-27
-- Purpose: Update functions to reference pilots table instead of non-existent crew_members/fleet
-- Reference: DATABASE_CLEANUP_REPORT.md - User Feedback: "crew members are the pilots"
-- ============================================================================

-- IMPORTANT: In this system, "crew members" ARE pilots. There is no separate crew_members table.
-- This migration updates all functions that incorrectly reference crew_members/fleet to use pilots instead.

-- ============================================================================
-- PHASE 1: Drop Broken Functions That Reference Non-Existent Tables
-- ============================================================================

-- These functions reference crew_members table which doesn't exist
DROP FUNCTION IF EXISTS get_database_performance_metrics();
DROP FUNCTION IF EXISTS get_crew_expiry_summary(uuid);
DROP FUNCTION IF EXISTS get_crew_member_expiring_items(uuid);
DROP FUNCTION IF EXISTS get_crew_audit_trail(uuid);
DROP FUNCTION IF EXISTS add_crew_check(uuid, uuid, date, text, text);
DROP FUNCTION IF EXISTS find_crew_member_by_name(text);
DROP FUNCTION IF EXISTS import_crew_check(uuid, uuid, date, text);
DROP FUNCTION IF EXISTS insert_crew_checks_batch(jsonb[]);
DROP FUNCTION IF EXISTS map_crew_name_to_id(text);
DROP FUNCTION IF EXISTS update_crew_certification_status(uuid, text);
DROP FUNCTION IF EXISTS update_crew_instructor_status(uuid, boolean);
DROP FUNCTION IF EXISTS validate_crew_member_completeness(uuid);
DROP FUNCTION IF EXISTS validate_crew_references(uuid);

-- These functions reference fleet table which doesn't exist (not needed)
DROP FUNCTION IF EXISTS get_fleet_compliance_stats();
DROP FUNCTION IF EXISTS get_fleet_expiry_statistics();

-- ============================================================================
-- PHASE 2: Recreate Essential Functions Using Pilots Table
-- ============================================================================

-- Recreate get_database_performance_metrics using pilots
CREATE OR REPLACE FUNCTION get_database_performance_metrics()
RETURNS TABLE(metric_name text, metric_value numeric, metric_unit text, status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT
        'Total Active Pilots' as metric_name,
        (SELECT COUNT(*)::NUMERIC FROM pilots WHERE is_active = true) as metric_value,
        'count' as metric_unit,
        'INFO' as status

    UNION ALL

    SELECT
        'Compliance Percentage',
        ROUND(
            (SELECT COUNT(DISTINCT pilot_id)::NUMERIC
             FROM pilot_checks pc
             WHERE pc.expiry_date > CURRENT_DATE
               AND EXISTS (SELECT 1 FROM pilots p WHERE p.id = pc.pilot_id AND p.is_active = true)
            ) * 100.0 /
            NULLIF((SELECT COUNT(*)::NUMERIC FROM pilots WHERE is_active = true), 0),
            2
        ),
        'percentage',
        CASE
            WHEN ROUND(
                (SELECT COUNT(DISTINCT pilot_id)::NUMERIC
                 FROM pilot_checks pc
                 WHERE pc.expiry_date > CURRENT_DATE
                   AND EXISTS (SELECT 1 FROM pilots p WHERE p.id = pc.pilot_id AND p.is_active = true)
                ) * 100.0 /
                NULLIF((SELECT COUNT(*)::NUMERIC FROM pilots WHERE is_active = true), 0),
                2
            ) >= 95 THEN 'GOOD'
            WHEN ROUND(
                (SELECT COUNT(DISTINCT pilot_id)::NUMERIC
                 FROM pilot_checks pc
                 WHERE pc.expiry_date > CURRENT_DATE
                   AND EXISTS (SELECT 1 FROM pilots p WHERE p.id = pc.pilot_id AND p.is_active = true)
                ) * 100.0 /
                NULLIF((SELECT COUNT(*)::NUMERIC FROM pilots WHERE is_active = true), 0),
                2
            ) >= 85 THEN 'WARNING'
            ELSE 'CRITICAL'
        END

    UNION ALL

    SELECT
        'Expiring Certifications (30 Days)',
        (SELECT COUNT(*)::NUMERIC
         FROM pilot_checks
         WHERE expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
           AND EXISTS (SELECT 1 FROM pilots p WHERE p.id = pilot_checks.pilot_id AND p.is_active = true)
        ),
        'count',
        CASE
            WHEN (SELECT COUNT(*)
                  FROM pilot_checks
                  WHERE expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
                    AND EXISTS (SELECT 1 FROM pilots p WHERE p.id = pilot_checks.pilot_id AND p.is_active = true)
                 ) > 10 THEN 'WARNING'
            WHEN (SELECT COUNT(*)
                  FROM pilot_checks
                  WHERE expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
                    AND EXISTS (SELECT 1 FROM pilots p WHERE p.id = pilot_checks.pilot_id AND p.is_active = true)
                 ) > 5 THEN 'INFO'
            ELSE 'GOOD'
        END

    UNION ALL

    SELECT
        'Expired Certifications',
        (SELECT COUNT(*)::NUMERIC
         FROM pilot_checks
         WHERE expiry_date < CURRENT_DATE
           AND EXISTS (SELECT 1 FROM pilots p WHERE p.id = pilot_checks.pilot_id AND p.is_active = true)
        ),
        'count',
        CASE
            WHEN (SELECT COUNT(*)
                  FROM pilot_checks
                  WHERE expiry_date < CURRENT_DATE
                    AND EXISTS (SELECT 1 FROM pilots p WHERE p.id = pilot_checks.pilot_id AND p.is_active = true)
                 ) > 0 THEN 'CRITICAL'
            ELSE 'GOOD'
        END;
END;
$$;

COMMENT ON FUNCTION get_database_performance_metrics IS
'Returns key database performance metrics using pilots table (crew members ARE pilots)';

-- Recreate get_pilot_expiry_summary (renamed from get_crew_expiry_summary)
DROP FUNCTION IF EXISTS get_pilot_expiry_summary(uuid);

CREATE OR REPLACE FUNCTION get_pilot_expiry_summary(p_pilot_id UUID)
RETURNS TABLE(
    pilot_id UUID,
    pilot_name TEXT,
    employee_id TEXT,
    total_certifications INTEGER,
    expired_count INTEGER,
    expiring_soon_count INTEGER,
    valid_count INTEGER,
    next_expiry_date DATE,
    next_expiry_type TEXT,
    days_to_next_expiry INTEGER,
    compliance_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_next_expiry_date DATE;
    v_next_expiry_type TEXT;
BEGIN
    -- Get next expiry (earliest upcoming expiry)
    SELECT MIN(expiry_date), check_type_id::TEXT
    INTO v_next_expiry_date, v_next_expiry_type
    FROM pilot_checks
    WHERE pilot_id = p_pilot_id
      AND expiry_date >= CURRENT_DATE
    GROUP BY check_type_id
    ORDER BY MIN(expiry_date)
    LIMIT 1;

    RETURN QUERY
    SELECT
        p.id as pilot_id,
        (p.first_name || ' ' || p.last_name) as pilot_name,
        p.employee_id,
        (SELECT COUNT(*)::INTEGER FROM pilot_checks WHERE pilot_id = p.id) as total_certifications,
        (SELECT COUNT(*)::INTEGER FROM pilot_checks WHERE pilot_id = p.id AND expiry_date < CURRENT_DATE) as expired_count,
        (SELECT COUNT(*)::INTEGER FROM pilot_checks WHERE pilot_id = p.id AND expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days') as expiring_soon_count,
        (SELECT COUNT(*)::INTEGER FROM pilot_checks WHERE pilot_id = p.id AND expiry_date > CURRENT_DATE + INTERVAL '30 days') as valid_count,
        v_next_expiry_date as next_expiry_date,
        COALESCE((SELECT name FROM check_types WHERE id::TEXT = v_next_expiry_type), 'Unknown') as next_expiry_type,
        CASE
            WHEN v_next_expiry_date IS NOT NULL THEN (v_next_expiry_date - CURRENT_DATE)::INTEGER
            ELSE NULL
        END as days_to_next_expiry,
        CASE
            WHEN EXISTS (SELECT 1 FROM pilot_checks WHERE pilot_id = p.id AND expiry_date < CURRENT_DATE) THEN 'NON_COMPLIANT'
            WHEN EXISTS (SELECT 1 FROM pilot_checks WHERE pilot_id = p.id AND expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days') THEN 'WARNING'
            ELSE 'COMPLIANT'
        END as compliance_status
    FROM pilots p
    WHERE p.id = p_pilot_id;
END;
$$;

COMMENT ON FUNCTION get_pilot_expiry_summary IS
'Returns certification expiry summary for a pilot (replaces get_crew_expiry_summary)';

-- Recreate get_pilot_expiring_items (renamed from get_crew_member_expiring_items)
CREATE OR REPLACE FUNCTION get_pilot_expiring_items(
    p_pilot_id UUID,
    p_days_threshold INTEGER DEFAULT 30
)
RETURNS TABLE(
    check_type_name TEXT,
    expiry_date DATE,
    days_until_expiry INTEGER,
    status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ct.name as check_type_name,
        pc.expiry_date,
        (pc.expiry_date - CURRENT_DATE)::INTEGER as days_until_expiry,
        CASE
            WHEN pc.expiry_date < CURRENT_DATE THEN 'EXPIRED'
            WHEN pc.expiry_date <= CURRENT_DATE + (p_days_threshold || ' days')::INTERVAL THEN 'EXPIRING_SOON'
            ELSE 'VALID'
        END as status
    FROM pilot_checks pc
    JOIN check_types ct ON pc.check_type_id = ct.id
    WHERE pc.pilot_id = p_pilot_id
      AND pc.expiry_date <= CURRENT_DATE + (p_days_threshold || ' days')::INTERVAL
    ORDER BY pc.expiry_date ASC;
END;
$$;

COMMENT ON FUNCTION get_pilot_expiring_items IS
'Returns expiring certifications for a pilot within specified days threshold';

-- Recreate find_pilot_by_name (renamed from find_crew_member_by_name)
CREATE OR REPLACE FUNCTION find_pilot_by_name(p_search_name TEXT)
RETURNS TABLE(
    pilot_id UUID,
    full_name TEXT,
    employee_id TEXT,
    role pilot_role,
    is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id as pilot_id,
        (p.first_name || ' ' || p.last_name) as full_name,
        p.employee_id,
        p.role,
        p.is_active
    FROM pilots p
    WHERE
        LOWER(p.first_name || ' ' || p.last_name) LIKE LOWER('%' || p_search_name || '%')
        OR LOWER(p.employee_id) LIKE LOWER('%' || p_search_name || '%')
    ORDER BY p.last_name, p.first_name;
END;
$$;

COMMENT ON FUNCTION find_pilot_by_name IS
'Searches for pilots by name or employee ID (replaces find_crew_member_by_name)';

-- Recreate get_fleet_compliance_stats (simplified - no fleet, just pilot compliance)
CREATE OR REPLACE FUNCTION get_fleet_compliance_stats()
RETURNS TABLE(
    total_pilots INTEGER,
    compliant_pilots INTEGER,
    non_compliant_pilots INTEGER,
    compliance_percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*)::INTEGER FROM pilots WHERE is_active = true) as total_pilots,
        (SELECT COUNT(DISTINCT pilot_id)::INTEGER
         FROM pilot_checks pc
         WHERE pc.expiry_date > CURRENT_DATE
           AND EXISTS (SELECT 1 FROM pilots p WHERE p.id = pc.pilot_id AND p.is_active = true)
        ) as compliant_pilots,
        (SELECT COUNT(*)::INTEGER FROM pilots WHERE is_active = true) -
        (SELECT COUNT(DISTINCT pilot_id)::INTEGER
         FROM pilot_checks pc
         WHERE pc.expiry_date > CURRENT_DATE
           AND EXISTS (SELECT 1 FROM pilots p WHERE p.id = pc.pilot_id AND p.is_active = true)
        ) as non_compliant_pilots,
        ROUND(
            (SELECT COUNT(DISTINCT pilot_id)::NUMERIC
             FROM pilot_checks pc
             WHERE pc.expiry_date > CURRENT_DATE
               AND EXISTS (SELECT 1 FROM pilots p WHERE p.id = pc.pilot_id AND p.is_active = true)
            ) * 100.0 /
            NULLIF((SELECT COUNT(*)::NUMERIC FROM pilots WHERE is_active = true), 0),
            2
        ) as compliance_percentage;
END;
$$;

COMMENT ON FUNCTION get_fleet_compliance_stats IS
'Returns fleet-wide pilot compliance statistics (no separate fleet table needed)';

-- Recreate get_fleet_expiry_statistics (renamed to get_pilot_fleet_expiry_statistics)
CREATE OR REPLACE FUNCTION get_pilot_fleet_expiry_statistics()
RETURNS TABLE(
    time_period TEXT,
    expiring_count INTEGER,
    expired_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT
        'Next 7 Days' as time_period,
        (SELECT COUNT(*)::INTEGER
         FROM pilot_checks
         WHERE expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
           AND EXISTS (SELECT 1 FROM pilots p WHERE p.id = pilot_checks.pilot_id AND p.is_active = true)
        ) as expiring_count,
        (SELECT COUNT(*)::INTEGER
         FROM pilot_checks
         WHERE expiry_date < CURRENT_DATE
           AND EXISTS (SELECT 1 FROM pilots p WHERE p.id = pilot_checks.pilot_id AND p.is_active = true)
        ) as expired_count

    UNION ALL

    SELECT
        'Next 30 Days',
        (SELECT COUNT(*)::INTEGER
         FROM pilot_checks
         WHERE expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
           AND EXISTS (SELECT 1 FROM pilots p WHERE p.id = pilot_checks.pilot_id AND p.is_active = true)
        ),
        (SELECT COUNT(*)::INTEGER
         FROM pilot_checks
         WHERE expiry_date < CURRENT_DATE
           AND EXISTS (SELECT 1 FROM pilots p WHERE p.id = pilot_checks.pilot_id AND p.is_active = true)
        )

    UNION ALL

    SELECT
        'Next 90 Days',
        (SELECT COUNT(*)::INTEGER
         FROM pilot_checks
         WHERE expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days'
           AND EXISTS (SELECT 1 FROM pilots p WHERE p.id = pilot_checks.pilot_id AND p.is_active = true)
        ),
        (SELECT COUNT(*)::INTEGER
         FROM pilot_checks
         WHERE expiry_date < CURRENT_DATE
           AND EXISTS (SELECT 1 FROM pilots p WHERE p.id = pilot_checks.pilot_id AND p.is_active = true)
        );
END;
$$;

COMMENT ON FUNCTION get_pilot_fleet_expiry_statistics IS
'Returns expiry statistics for all pilots across different time periods';

-- ============================================================================
-- PHASE 3: Update Existing Views (If They Reference Crew/Fleet)
-- ============================================================================

-- Note: We already have these views that work correctly:
-- - expiring_checks (uses pilots table)
-- - detailed_expiring_checks (uses pilots table)
-- - compliance_dashboard (uses pilots table)
-- - pilot_report_summary (uses pilots table)
-- - captain_qualifications_summary (uses pilots table)
-- - dashboard_metrics (uses pilots table)

-- No view updates needed - they already use pilots table correctly

-- ============================================================================
-- PHASE 4: Create Aliases for Backward Compatibility
-- ============================================================================

-- Create function aliases so existing code that calls old function names still works

-- Alias: get_crew_expiry_summary -> get_pilot_expiry_summary
DROP FUNCTION IF EXISTS get_crew_expiry_summary(uuid);

CREATE OR REPLACE FUNCTION get_crew_expiry_summary(crew_member_uuid uuid)
RETURNS TABLE(
    pilot_id UUID,
    pilot_name TEXT,
    employee_id TEXT,
    total_certifications INTEGER,
    expired_count INTEGER,
    expiring_soon_count INTEGER,
    valid_count INTEGER,
    next_expiry_date DATE,
    next_expiry_type TEXT,
    days_to_next_expiry INTEGER,
    compliance_status TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT * FROM get_pilot_expiry_summary(crew_member_uuid);
$$;

COMMENT ON FUNCTION get_crew_expiry_summary IS
'DEPRECATED: Use get_pilot_expiry_summary instead. Kept for backward compatibility.';

-- Alias: get_crew_member_expiring_items -> get_pilot_expiring_items
DROP FUNCTION IF EXISTS get_crew_member_expiring_items(uuid, integer);
DROP FUNCTION IF EXISTS get_crew_member_expiring_items(uuid);

CREATE OR REPLACE FUNCTION get_crew_member_expiring_items(
    crew_member_id UUID,
    days_threshold INTEGER DEFAULT 30
)
RETURNS TABLE(
    check_type_name TEXT,
    expiry_date DATE,
    days_until_expiry INTEGER,
    status TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT * FROM get_pilot_expiring_items(crew_member_id, days_threshold);
$$;

COMMENT ON FUNCTION get_crew_member_expiring_items IS
'DEPRECATED: Use get_pilot_expiring_items instead. Kept for backward compatibility.';

-- Alias: find_crew_member_by_name -> find_pilot_by_name
DROP FUNCTION IF EXISTS find_crew_member_by_name(text);

CREATE OR REPLACE FUNCTION find_crew_member_by_name(search_name TEXT)
RETURNS TABLE(
    pilot_id UUID,
    full_name TEXT,
    employee_id TEXT,
    role pilot_role,
    is_active BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT * FROM find_pilot_by_name(search_name);
$$;

COMMENT ON FUNCTION find_crew_member_by_name IS
'DEPRECATED: Use find_pilot_by_name instead. Kept for backward compatibility.';

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Summary of changes:
--  Dropped 13 broken functions referencing crew_members table
--  Dropped 2 broken functions referencing fleet table
--  Recreated 6 essential functions using pilots table
--  Created 3 backward compatibility aliases for existing code
--  All functions now correctly reference pilots table

-- Key concept: In this system, CREW MEMBERS = PILOTS
-- There is no separate crew_members or fleet table needed

-- Run this after migration:
-- npm run db:types  -- Regenerate TypeScript types
-- supabase db lint  -- Verify fewer errors
