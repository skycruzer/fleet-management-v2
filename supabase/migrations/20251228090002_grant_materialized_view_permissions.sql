-- Migration: Grant SELECT permissions on pilot_dashboard_metrics materialized view
-- Author: Maurice Rondeau
-- Date: 2025-12-28
-- Purpose: Fix "permission denied for materialized view pilot_dashboard_metrics" error
--          Materialized views in PostgreSQL require explicit GRANT for SELECT access

-- ============================================
-- Grant SELECT on materialized view
-- ============================================

-- Grant to authenticated users (logged in via Supabase Auth)
GRANT SELECT ON pilot_dashboard_metrics TO authenticated;

-- Grant to anon role (for custom session-based auth like admin-session/pilot-session)
GRANT SELECT ON pilot_dashboard_metrics TO anon;

-- Grant to service_role for admin operations
GRANT SELECT ON pilot_dashboard_metrics TO service_role;

-- ============================================
-- Verification
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'SELECT permissions granted on pilot_dashboard_metrics materialized view';
  RAISE NOTICE 'Roles with access: authenticated, anon, service_role';
END $$;
