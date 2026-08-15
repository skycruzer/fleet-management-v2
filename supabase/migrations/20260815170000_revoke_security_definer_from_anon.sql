-- ============================================================================
-- Close anon EXECUTE on SECURITY DEFINER functions reachable over PostgREST
-- ============================================================================
-- PostgreSQL grants EXECUTE to PUBLIC by default, so every SECURITY DEFINER
-- function in `public` was callable as /rest/v1/rpc/<name> with the anon key
-- that ships in every browser bundle. SECURITY DEFINER runs as the owner, so
-- these calls bypass RLS entirely.
--
-- Measured against production on 2026-08-15 with the public anon key:
--   POST /rest/v1/rpc/get_fleet_compliance_stats      -> 200, fleet compliance %
--   POST /rest/v1/rpc/get_expiry_statistics           -> 200, expiry counts
--   POST /rest/v1/rpc/get_check_category_distribution -> 200, per-category counts
--   POST /rest/v1/rpc/get_monthly_expiry_data         -> 200, 12-month series
--   POST /rest/v1/rpc/get_pilot_fleet_expiry_statistics -> 200, expiry summary
--
-- This also finishes 20260728120000_revoke_complete_task_from_public.sql, which
-- applied cleanly but did nothing: it guarded on
-- `pg_get_function_identity_arguments(oid) = 'uuid'`, and this server returns
-- `p_task_id uuid` for that function, so the DO block's IF was never true and
-- complete_task(uuid) kept its anon and PUBLIC grants. This migration uses no
-- such guard.
--
-- Scope and safety:
--   * Trigger functions are excluded — they are not callable over PostgREST and
--     revoking EXECUTE would not affect trigger firing.
--   * The four functions referenced inside RLS policies — is_admin(),
--     is_admin_or_manager(), current_user_is_an_admin(), user_owns_leave_bid()
--     — are deliberately NOT touched. Policy expressions run as the querying
--     role, so revoking them would make policy evaluation fail for every
--     authenticated read.
--   * No browser code calls any RPC. The only importer of the browser Supabase
--     client (components/shared/feedback-post.tsx) uses it solely for a realtime
--     channel subscription. Every .rpc() call in the codebase lives in
--     lib/services/* behind the admin or service-role client.
--   * Functions the admin portal may reach through the authenticated role keep
--     an explicit grant to `authenticated`; writes, maintenance jobs and
--     lockout probes are narrowed to `service_role` only.
-- ============================================================================

begin;

-- --- Group 1: service_role only ---------------------------------------------
-- Writes, scheduled maintenance, and account-lockout probes (which would
-- otherwise let an anonymous caller enumerate locked accounts).

revoke all on function public.complete_task(uuid) from public, anon, authenticated;
grant execute on function public.complete_task(uuid) to service_role;

revoke all on function public.cleanup_expired_lockouts() from public, anon, authenticated;
grant execute on function public.cleanup_expired_lockouts() to service_role;

revoke all on function public.cleanup_expired_password_reset_tokens() from public, anon, authenticated;
grant execute on function public.cleanup_expired_password_reset_tokens() to service_role;

revoke all on function public.cleanup_old_failed_attempts() from public, anon, authenticated;
grant execute on function public.cleanup_old_failed_attempts() to service_role;

revoke all on function public.cleanup_password_history(uuid) from public, anon, authenticated;
grant execute on function public.cleanup_password_history(uuid) to service_role;

revoke all on function public.refresh_all_expiry_views() from public, anon, authenticated;
grant execute on function public.refresh_all_expiry_views() to service_role;

revoke all on function public.refresh_dashboard_metrics() from public, anon, authenticated;
grant execute on function public.refresh_dashboard_metrics() to service_role;

revoke all on function public.refresh_dashboard_views() from public, anon, authenticated;
grant execute on function public.refresh_dashboard_views() to service_role;

revoke all on function public.refresh_expiry_materialized_views() from public, anon, authenticated;
grant execute on function public.refresh_expiry_materialized_views() to service_role;

revoke all on function public.remove_upvote_feedback_post(uuid, uuid) from public, anon, authenticated;
grant execute on function public.remove_upvote_feedback_post(uuid, uuid) to service_role;

revoke all on function public.upvote_feedback_post(uuid, uuid) from public, anon, authenticated;
grant execute on function public.upvote_feedback_post(uuid, uuid) to service_role;

revoke all on function public.submit_feedback_post_tx(uuid, text, text, uuid, boolean) from public, anon, authenticated;
grant execute on function public.submit_feedback_post_tx(uuid, text, text, uuid, boolean) to service_role;

revoke all on function public.is_account_locked(character varying) from public, anon, authenticated;
grant execute on function public.is_account_locked(character varying) to service_role;

revoke all on function public.get_lockout_expiry(character varying) from public, anon, authenticated;
grant execute on function public.get_lockout_expiry(character varying) to service_role;

revoke all on function public.get_database_performance_metrics() from public, anon, authenticated;
grant execute on function public.get_database_performance_metrics() to service_role;

-- --- Group 2: authenticated + service_role ----------------------------------
-- Read helpers and pure calculations. Closed to the anon key; still reachable
-- by a signed-in admin session and by every server-side client.

revoke all on function public.alert_level(integer) from public, anon;
grant execute on function public.alert_level(integer) to authenticated, service_role;

revoke all on function public.calculate_days_until_expiry(date) from public, anon;
grant execute on function public.calculate_days_until_expiry(date) to authenticated, service_role;

revoke all on function public.calculate_years_in_service(uuid) from public, anon;
grant execute on function public.calculate_years_in_service(uuid) to authenticated, service_role;

revoke all on function public.current_user_email() from public, anon;
grant execute on function public.current_user_email() to authenticated, service_role;

revoke all on function public.current_user_role() from public, anon;
grant execute on function public.current_user_role() to authenticated, service_role;

revoke all on function public.days_until_expiry(date) from public, anon;
grant execute on function public.days_until_expiry(date) to authenticated, service_role;

revoke all on function public.find_crew_member_by_name(text) from public, anon;
grant execute on function public.find_crew_member_by_name(text) to authenticated, service_role;

revoke all on function public.get_check_category_distribution() from public, anon;
grant execute on function public.get_check_category_distribution() to authenticated, service_role;

revoke all on function public.get_crew_expiry_summary(uuid) from public, anon;
grant execute on function public.get_crew_expiry_summary(uuid) to authenticated, service_role;

revoke all on function public.get_crew_member_expiring_items(uuid, integer) from public, anon;
grant execute on function public.get_crew_member_expiring_items(uuid, integer) to authenticated, service_role;

revoke all on function public.get_current_pilot_user_id() from public, anon;
grant execute on function public.get_current_pilot_user_id() to authenticated, service_role;

revoke all on function public.get_expiry_statistics() from public, anon;
grant execute on function public.get_expiry_statistics() to authenticated, service_role;

revoke all on function public.get_fleet_compliance_stats() from public, anon;
grant execute on function public.get_fleet_compliance_stats() to authenticated, service_role;

revoke all on function public.get_monthly_expiry_data() from public, anon;
grant execute on function public.get_monthly_expiry_data() to authenticated, service_role;

revoke all on function public.get_pilot_expiring_items(uuid, integer) from public, anon;
grant execute on function public.get_pilot_expiring_items(uuid, integer) to authenticated, service_role;

revoke all on function public.get_pilot_expiry_summary(uuid) from public, anon;
grant execute on function public.get_pilot_expiry_summary(uuid) to authenticated, service_role;

revoke all on function public.get_pilot_feedback_posts(uuid, integer, integer) from public, anon;
grant execute on function public.get_pilot_feedback_posts(uuid, integer, integer) to authenticated, service_role;

revoke all on function public.get_pilot_fleet_expiry_statistics() from public, anon;
grant execute on function public.get_pilot_fleet_expiry_statistics() to authenticated, service_role;

revoke all on function public.get_pilot_warning_count(uuid) from public, anon;
grant execute on function public.get_pilot_warning_count(uuid) to authenticated, service_role;

revoke all on function public.is_current_user(uuid) from public, anon;
grant execute on function public.is_current_user(uuid) to authenticated, service_role;

revoke all on function public.is_current_user_admin() from public, anon;
grant execute on function public.is_current_user_admin() to authenticated, service_role;

revoke all on function public.parse_excel_date(text) from public, anon;
grant execute on function public.parse_excel_date(text) to authenticated, service_role;

commit;

-- Verify after applying — expect zero rows:
--   select p.oid::regprocedure::text
--     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--    where n.nspname = 'public' and p.prosecdef
--      and pg_get_function_result(p.oid) <> 'trigger'
--      and has_function_privilege('anon', p.oid, 'EXECUTE')
--      and p.proname not in ('is_admin','is_admin_or_manager',
--                            'current_user_is_an_admin','user_owns_leave_bid');
