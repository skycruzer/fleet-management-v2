-- Production hardening — authored by production-readiness review 2026-07-06
--
-- STATUS: DRAFT — review, then apply with `npm run db:deploy` (or `supabase db push`).
-- NOT auto-applied to production by the review.
--
-- Rationale: all application access to these objects goes through the service-role
-- client (createServiceRoleClient), which BYPASSES RLS. So tightening anon/authenticated
-- grants and removing always-true policies does not affect the app's own read/write paths.
-- These changes remove exposure reachable only via the public anon key or a stray
-- authenticated Supabase JWT over PostgREST.
--
-- Verified facts (2026-07-06):
--   * ebt schema is PostgREST-exposed; ebt.medicals/licences/pilot_ext/profiles had
--     SELECT policies `USING (true)` for role `authenticated` (35 PII rows each).
--   * ebt tables carried broad anon grants (INSERT/UPDATE/DELETE/…); RLS blocked anon
--     because no anon policy exists, but the grants are an unnecessary surface.
--   * public.renewal_plan_history had an INSERT policy for role `public` (incl. anon)
--     WITH CHECK (true) plus an anon INSERT grant → anon could write audit rows.
--   * App reads/writes ebt exclusively via service-role (see lib/ebt/supabase/server.ts,
--     todo Phase C2) and renewal_plan_history via createServiceRoleClient.

-- 1) EBT schema: remove all anon/authenticated access. Service-role only.
--    Neutralizes the medical/licence PII read exposure and the anon over-grants.
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA ebt FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA ebt FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA ebt FROM anon, authenticated;
REVOKE USAGE ON SCHEMA ebt FROM anon, authenticated;

-- Keep future ebt objects locked down as well.
ALTER DEFAULT PRIVILEGES IN SCHEMA ebt REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA ebt REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA ebt REVOKE ALL ON FUNCTIONS FROM anon, authenticated;

-- 2) public.renewal_plan_history: stop anon/public writes to the append-only audit table.
--    Drop the always-true public INSERT policy; service-role inserts still work (RLS bypass).
DROP POLICY IF EXISTS "System can insert renewal history" ON public.renewal_plan_history;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.renewal_plan_history FROM anon;

-- 3) Lock down sensitive SECURITY DEFINER functions exposed over /rest/v1/rpc.
--    NOTE: functions default to `GRANT EXECUTE TO PUBLIC`, which anon + authenticated inherit —
--    so `REVOKE ... FROM anon` alone is a no-op. Must REVOKE FROM PUBLIC and GRANT back to
--    service_role (the role the app's admin/service-role clients connect as; verified every
--    .rpc() caller uses SUPABASE_SERVICE_ROLE_KEY).
--    EXCLUDED: is_admin() (27 RLS-policy refs) and current_user_is_an_admin() (3) — revoking
--    those from PUBLIC would break RLS evaluation for anon/authenticated. Left as-is.
DO $$
DECLARE sig text;
BEGIN
  FOREACH sig IN ARRAY ARRAY[
    'public.auth_get_user_role()',
    'public.is_admin_user()',
    'public.batch_update_certifications(jsonb[])',
    'public.bulk_delete_certifications(uuid[])',
    'public.cleanup_expired_admin_sessions()',
    'public.cleanup_expired_pilot_sessions()',
    'public.create_pilot_with_certifications(jsonb, jsonb[])',
    'public.get_auth_user_from_pilot_user(uuid)',
    'public.get_password_age_days(uuid)',
    'public.get_password_history_count(uuid)',
    'public.get_pending_pilot_registrations()',
    'public.revoke_all_pilot_sessions(uuid)',
    'public.validate_pilot_session(text)'
  ]
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', sig);
  END LOOP;
END $$;

-- NOTE (left for a follow-up migration after per-item review — NOT included here to avoid
-- breaking legitimate authenticated-role writers that may still exist):
--   * public.audit_logs.audit_logs_authenticated_insert (WITH CHECK true)
--   * public.disciplinary_audit_log.disciplinary_audit_log_insert (WITH CHECK true)
--   * public.password_history "System can insert/delete password history" (true)
--   * public.pilot_ebt_assessments allow-authenticated insert/update (true)
--   * public.pilot_feedback authenticated update (true)
--   * public.task_audit_log task_audit_log_insert (WITH CHECK true)
--   * the remaining ~57 anon-executable SECURITY DEFINER functions in public (per-function triage).
--   * public.set_pilot_documents_updated_at mutable search_path → SET search_path = ''.
