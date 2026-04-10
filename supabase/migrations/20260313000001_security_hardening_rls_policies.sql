-- ============================================================================
-- Migration: Security Hardening — Remove Overly Permissive RLS Policies
-- Date: 2026-03-13
-- Purpose: Remove anon INSERT/UPDATE/DELETE policies that bypass RLS on
--          sensitive tables. All writes use service_role (bypasses RLS),
--          so these anon policies are unnecessary and expose attack surface.
-- Also:    Fix function search_path, add missing FK index, restrict
--          materialized view access.
-- ============================================================================

BEGIN;

-- ============================================================================
-- P0: Remove dangerous anon INSERT/UPDATE policies
-- ============================================================================

-- 1. admin_sessions — anon should NOT be able to create/modify sessions
DROP POLICY IF EXISTS "admin_sessions_anon_insert" ON public.admin_sessions;
DROP POLICY IF EXISTS "admin_sessions_anon_update" ON public.admin_sessions;

-- 2. pilot_users — anon should NOT be able to create/modify user accounts
DROP POLICY IF EXISTS "pilot_users_anon_insert" ON public.pilot_users;
DROP POLICY IF EXISTS "pilot_users_anon_update" ON public.pilot_users;

-- 3. settings — anon should NOT be able to modify system settings
DROP POLICY IF EXISTS "settings_anon_insert" ON public.settings;
DROP POLICY IF EXISTS "settings_anon_update" ON public.settings;

-- 4. roster_periods — anon should NOT be able to create/modify roster periods
DROP POLICY IF EXISTS "roster_periods_anon_insert" ON public.roster_periods;
DROP POLICY IF EXISTS "roster_periods_anon_update" ON public.roster_periods;

-- 5. roster_reports — anon should NOT be able to create/modify reports
DROP POLICY IF EXISTS "roster_reports_anon_insert" ON public.roster_reports;
DROP POLICY IF EXISTS "roster_reports_anon_update" ON public.roster_reports;

-- 6. notifications — anon should NOT be able to insert notifications
DROP POLICY IF EXISTS "notifications_anon_insert" ON public.notifications;

-- 7. pilot_feedback — anon should NOT be able to insert/modify feedback
DROP POLICY IF EXISTS "pilot_feedback_anon_insert" ON public.pilot_feedback;
DROP POLICY IF EXISTS "pilot_feedback_anon_update" ON public.pilot_feedback;

-- 8. audit_logs — anon should NOT be able to insert audit entries
DROP POLICY IF EXISTS "audit_logs_anon_insert" ON public.audit_logs;

-- 9. task_audit_log — anon should NOT be able to insert audit entries
DROP POLICY IF EXISTS "task_audit_log_anon_insert" ON public.task_audit_log;

-- 10. disciplinary_audit_log — anon should NOT be able to insert audit entries
DROP POLICY IF EXISTS "disciplinary_audit_log_anon_insert" ON public.disciplinary_audit_log;

-- 11. account_lockouts — restrict to service_role only (not anon)
--     Drop the overly permissive system policy and recreate for service_role
DROP POLICY IF EXISTS "account_lockouts_system" ON public.account_lockouts;

-- 12. failed_login_attempts — restrict to service_role only (not anon)
DROP POLICY IF EXISTS "failed_attempts_insert" ON public.failed_login_attempts;

-- 13. password_reset_tokens — restrict write access (remove anon)
--     These operations happen server-side via service_role
DROP POLICY IF EXISTS "Allow authenticated insert of password reset tokens" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "Allow authenticated update of password reset tokens" ON public.password_reset_tokens;

-- Recreate password_reset_tokens policies scoped to authenticated only
-- (service_role bypasses RLS, authenticated is kept as defense-in-depth)
CREATE POLICY "authenticated_insert_password_reset_tokens"
  ON public.password_reset_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated_update_password_reset_tokens"
  ON public.password_reset_tokens
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- P0: Fix pilot_requests — scope policies to proper roles
-- Current policies use {public} role which includes anon
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users full access" ON public.pilot_requests;
DROP POLICY IF EXISTS "Service role full access" ON public.pilot_requests;

-- Recreate with proper role scoping
CREATE POLICY "authenticated_full_access"
  ON public.pilot_requests
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Note: service_role bypasses RLS entirely, so no policy needed for it.
-- But we add one for documentation clarity.
CREATE POLICY "service_role_full_access"
  ON public.pilot_requests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- P0: Remove anon SELECT on sensitive tables (writes already removed above)
-- Keep anon SELECT only where legitimately needed (roster_periods for public
-- schedule visibility, settings for public config). Remove from sensitive data.
-- ============================================================================

-- anon should NOT read audit logs
DROP POLICY IF EXISTS "audit_logs_anon_select" ON public.audit_logs;

-- anon should NOT read pilot feedback
DROP POLICY IF EXISTS "pilot_feedback_anon_select" ON public.pilot_feedback;

-- ============================================================================
-- P1: Fix function search_path vulnerability
-- ============================================================================

-- Set search_path on check_crew_availability_atomic to prevent hijacking
ALTER FUNCTION public.check_crew_availability_atomic SET search_path = public;

-- ============================================================================
-- P1: Restrict materialized view from anon/authenticated via Data API
-- ============================================================================

REVOKE SELECT ON public.pilot_dashboard_metrics FROM anon;
REVOKE SELECT ON public.pilot_dashboard_metrics FROM authenticated;

-- Only service_role should access this (used by dashboard-service-v4 server-side)
GRANT SELECT ON public.pilot_dashboard_metrics TO service_role;

-- ============================================================================
-- P1: Add missing foreign key index on pilot_checks.check_type_id
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_pilot_checks_check_type_id
  ON public.pilot_checks (check_type_id);

-- ============================================================================
-- P2: Run VACUUM ANALYZE on tables with high dead tuple ratios
-- ============================================================================

-- Note: VACUUM cannot run inside a transaction block, so we skip it here.
-- Run manually after migration: VACUUM ANALYZE;

COMMIT;
