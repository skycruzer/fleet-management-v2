-- ============================================================================
-- Security lockdown: remove anon/authenticated grants on pilot_user_mappings
-- ============================================================================
-- Companion to 20260731090000_lockdown_pilot_users.sql, which closed the base
-- table public.pilot_users but left this view's grants untouched.
--
-- pilot_user_mappings is a VIEW (not a table) over
--   pilot_users pu LEFT JOIN pilots p ON p.employee_id::text = pu.employee_id
-- exposing employee_id, email, first_name, last_name, rank, seniority_number,
-- registration_approved and last_login_at. No password_hash column.
--
-- Measured against production on 2026-08-15, before 20260731090000 was applied:
--   GET /rest/v1/pilot_user_mappings?select=* with the public anon key
--   returned HTTP 200 and a row.
--
-- The view already carries security_invoker=on, so once pilot_users lost its
-- anon grants the read stopped resolving. These grants are therefore inert
-- today — this migration removes them so the view can never become a side door
-- if a base-table grant is ever restored, and so the browser roles hold no
-- INSERT/UPDATE/DELETE on a view that is writable through to pilot_users.
--
-- Views do not support ALTER TABLE ... ENABLE ROW LEVEL SECURITY; the
-- security_invoker setting is what makes the base tables' RLS apply here.
--
-- Every legitimate reader already uses the service-role admin client:
--   * lib/services/notification-service.ts:64
--   * lib/services/unified-request-service.ts:956
--   * lib/services/feedback-service.ts:410
--   * app/api/cron/certification-expiry-alerts/route.ts:145
-- so removing the browser-role grants changes no supported code path.
-- ============================================================================

begin;

revoke select, insert, update, delete, truncate, references, trigger
  on table public.pilot_user_mappings from anon, authenticated;

-- Re-assert rather than assume: without this the view would run with its
-- owner's rights and bypass the base tables' RLS entirely.
alter view public.pilot_user_mappings set (security_invoker = on);

commit;

-- Verify after applying:
--   select grantee, privilege_type
--     from information_schema.role_table_grants
--    where table_schema = 'public' and table_name = 'pilot_user_mappings'
--      and grantee in ('anon','authenticated');            -- expect zero rows
--
--   GET /rest/v1/pilot_user_mappings?select=*&limit=1 with the anon key
--                                                          -- expect 401
