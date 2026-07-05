-- Follow-up hardening (applied to prod 2026-07-06 via MCP; recorded here for reproducibility).
--
-- Removes inert anon write grants on audit/history/feedback/assessment tables. These tables have
-- only `authenticated`-role RLS policies (no anon policy), so anon could never actually write —
-- but the leftover table grants are unnecessary surface (same class PR #73 removed). The app
-- writes these via service_role / SECURITY DEFINER triggers, which bypass RLS, so this is a no-op
-- for the application.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.disciplinary_audit_log FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.task_audit_log FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.pilot_ebt_assessments FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.pilot_feedback FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.audit_logs FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.password_history FROM anon;

-- REVIEWED & ACCEPTED (not changed here — deliberate):
--   * The always-true INSERT/UPDATE policies on these tables are scoped to `authenticated`
--     (or `public` for password_history, which lacks any anon grant). With only 3 Supabase
--     auth users and both portals on custom (non-Supabase-Auth) sessions, nothing writes these
--     as the `authenticated` Postgres role — the app uses service_role. Dropping the policies
--     would make them service_role-only, but risks breaking any authenticated-role audit write
--     we haven't proven absent; the anon surface (the exploitable part) is already removed above.
--   * The remaining ~57 anon-executable SECURITY DEFINER functions are low-sensitivity helpers/
--     analytics; the high-risk action functions (pilot creation, session revocation, password,
--     cert bulk ops) were already locked in 20260706120000. Blanket-revoking the rest risks
--     breaking RLS-policy-referenced functions and is left for individual review.
--   * public.set_pilot_documents_updated_at has a mutable search_path (advisor WARN) — set
--     `SET search_path = ''` when next touched.
