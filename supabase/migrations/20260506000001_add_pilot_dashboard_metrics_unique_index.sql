-- ============================================================================
-- Migration: Unique index on pilot_dashboard_metrics for CONCURRENTLY refresh
-- Date: 2026-05-06
-- Purpose: refresh_dashboard_metrics() runs REFRESH MATERIALIZED VIEW
--          CONCURRENTLY, which Postgres requires a unique index for. The
--          index has been missing since the materialized view shipped, so
--          every POST /api/dashboard/refresh raised
--          "55000: cannot refresh materialized view ... concurrently".
--          Surfaced by the May 2026 audit smoke test alongside the
--          notification_settings column gap.
--
-- Index:   pilot_dashboard_metrics is a CROSS JOIN of single-row aggregates,
--          so it always emits exactly one row with schema_version = 'v2.0.0'.
--          A unique index on schema_version both satisfies the CONCURRENTLY
--          requirement and acts as a sentinel: if the view ever produces
--          more than one row, the refresh fails loudly instead of silently
--          inflating the cache.
-- ============================================================================

BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS pilot_dashboard_metrics_schema_version_uidx
  ON public.pilot_dashboard_metrics (schema_version);

COMMIT;
