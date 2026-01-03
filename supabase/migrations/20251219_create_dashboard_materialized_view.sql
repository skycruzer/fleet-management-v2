-- ============================================================================
-- MATERIALIZED VIEW: pilot_dashboard_metrics
-- ============================================================================
-- Purpose: Consolidate dashboard queries into single pre-computed view
-- Updated: December 19, 2025 - Uses pilot_requests instead of deprecated leave_requests
--
-- Developer: Maurice Rondeau
-- ============================================================================

-- Drop existing view if exists
DROP MATERIALIZED VIEW IF EXISTS pilot_dashboard_metrics CASCADE;

-- Create materialized view with comprehensive dashboard data
CREATE MATERIALIZED VIEW pilot_dashboard_metrics AS
WITH
  -- CTE 1: Pilot Statistics
  pilot_stats AS (
    SELECT
      COUNT(*) AS total_pilots,
      COUNT(*) FILTER (WHERE is_active = true) AS active_pilots,
      COUNT(*) FILTER (WHERE role = 'Captain') AS total_captains,
      COUNT(*) FILTER (WHERE role = 'First Officer') AS total_first_officers,
      COUNT(*) FILTER (
        WHERE role = 'Captain'
        AND captain_qualifications @> '["training_captain"]'::jsonb
      ) AS training_captains,
      COUNT(*) FILTER (
        WHERE role = 'Captain'
        AND captain_qualifications @> '["examiner"]'::jsonb
      ) AS examiners
    FROM pilots
  ),

  -- CTE 2: Certification Statistics
  cert_stats AS (
    SELECT
      COUNT(*) AS total_certifications,
      COUNT(*) FILTER (
        WHERE expiry_date IS NULL OR expiry_date > (CURRENT_DATE + INTERVAL '30 days')
      ) AS current_certifications,
      COUNT(*) FILTER (
        WHERE expiry_date IS NOT NULL
        AND expiry_date <= (CURRENT_DATE + INTERVAL '30 days')
        AND expiry_date > CURRENT_DATE
      ) AS expiring_certifications,
      COUNT(*) FILTER (
        WHERE expiry_date IS NOT NULL AND expiry_date <= CURRENT_DATE
      ) AS expired_certifications,
      COUNT(*) FILTER (
        WHERE expiry_date IS NOT NULL
        AND expiry_date <= (CURRENT_DATE + INTERVAL '7 days')
        AND expiry_date > CURRENT_DATE
      ) AS expiring_this_week
    FROM pilot_checks
  ),

  -- CTE 3: Leave Request Statistics (using unified pilot_requests table)
  leave_stats AS (
    SELECT
      COUNT(*) FILTER (WHERE workflow_status = 'PENDING' OR workflow_status = 'SUBMITTED') AS pending_leave,
      COUNT(*) FILTER (WHERE workflow_status = 'APPROVED') AS approved_leave,
      COUNT(*) FILTER (WHERE workflow_status = 'DENIED') AS denied_leave,
      COUNT(*) FILTER (
        WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
      ) AS leave_this_month
    FROM pilot_requests
    WHERE request_category = 'LEAVE'
  ),

  -- CTE 4: Retirement Statistics
  retirement_stats AS (
    SELECT
      COUNT(*) FILTER (
        WHERE is_active = true
        AND date_of_birth IS NOT NULL
        AND EXTRACT(YEAR FROM AGE(date_of_birth)) >= 60
      ) AS pilots_past_retirement,
      COUNT(*) FILTER (
        WHERE is_active = true
        AND date_of_birth IS NOT NULL
        AND EXTRACT(YEAR FROM AGE(date_of_birth)) BETWEEN 58 AND 59
      ) AS pilots_retiring_soon,
      COUNT(*) FILTER (
        WHERE is_active = true
        AND date_of_birth IS NOT NULL
        AND EXTRACT(YEAR FROM AGE(date_of_birth)) BETWEEN 55 AND 59
      ) AS pilots_nearing_retirement
    FROM pilots
  ),

  -- CTE 5: Category Compliance Breakdown
  category_compliance AS (
    SELECT
      jsonb_object_agg(
        category,
        jsonb_build_object(
          'total', total_checks,
          'current', current_checks,
          'compliance_rate', ROUND((current_checks::numeric / NULLIF(total_checks, 0) * 100)::numeric, 1)
        )
      ) AS categories
    FROM (
      SELECT
        COALESCE(ct.category, 'Other') AS category,
        COUNT(*) AS total_checks,
        COUNT(*) FILTER (
          WHERE pc.expiry_date IS NULL OR pc.expiry_date > CURRENT_DATE
        ) AS current_checks
      FROM pilot_checks pc
      LEFT JOIN check_types ct ON pc.check_type_id = ct.id
      WHERE pc.expiry_date IS NOT NULL
      GROUP BY COALESCE(ct.category, 'Other')
    ) cat_stats
  )

-- Combine all CTEs into final metrics view
SELECT
  -- Pilot Metrics
  ps.total_pilots,
  ps.active_pilots,
  ps.total_captains,
  ps.total_first_officers,
  ps.training_captains,
  ps.examiners,

  -- Certification Metrics
  cs.total_certifications,
  cs.current_certifications,
  cs.expiring_certifications,
  cs.expired_certifications,
  cs.expiring_this_week,
  COALESCE(
    ROUND((cs.current_certifications::numeric / NULLIF(cs.total_certifications, 0) * 100)::numeric, 1),
    100.0
  ) AS compliance_rate,

  -- Leave Metrics
  ls.pending_leave,
  ls.approved_leave,
  ls.denied_leave,
  ls.leave_this_month,

  -- Alert Counts
  cs.expired_certifications AS critical_alerts,
  cs.expiring_this_week AS warning_alerts,

  -- Retirement Metrics
  rs.pilots_past_retirement AS overdue_retirement,
  rs.pilots_retiring_soon AS retirement_due_soon,
  rs.pilots_nearing_retirement,

  -- Category Breakdown (JSONB)
  COALESCE(cc.categories, '{}'::jsonb) AS category_compliance,

  -- Metadata
  CURRENT_TIMESTAMP AS last_refreshed,
  'v2.0.0'::text AS schema_version

FROM pilot_stats ps
CROSS JOIN cert_stats cs
CROSS JOIN leave_stats ls
CROSS JOIN retirement_stats rs
CROSS JOIN category_compliance cc;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX idx_pilot_dashboard_metrics_version ON pilot_dashboard_metrics (schema_version);

-- Create function to refresh materialized view concurrently
CREATE OR REPLACE FUNCTION refresh_dashboard_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY pilot_dashboard_metrics;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION refresh_dashboard_metrics() TO authenticated;

-- Initial refresh
REFRESH MATERIALIZED VIEW pilot_dashboard_metrics;
