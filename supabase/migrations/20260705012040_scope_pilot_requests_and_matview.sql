-- ============================================================================
-- Tighten pilot_requests RLS + remove materialized view from the Data API
-- ============================================================================
-- Addresses audit findings H1 and H3.
--
-- H1: `authenticated_full_access` on pilot_requests was ALL / USING(true) /
--     WITH CHECK(true) — any holder of a Supabase JWT could CRUD every leave/
--     flight/RDO/SDO request. All legitimate access is service-role (admin
--     dashboard services + pilot portal API), so the `authenticated` role is
--     restricted to admins/managers via is_admin_or_manager(). Service-role
--     access is unaffected (it bypasses RLS).
--
-- H3: pilot_dashboard_metrics is a MATERIALIZED view, which cannot enforce the
--     caller's RLS. It was selectable by anon/authenticated over the Data API,
--     leaking aggregated compliance data. Dashboard code reads it with the
--     service role (dashboard-service-v4), so revoke public API access.
--
-- DEPLOY ORDER: deploy the code first. In particular
-- components/dashboard/compact-roster-display.tsx was switched to the service-role
-- client; applying this before that ships would blank the dashboard roster counts
-- for admins authenticated via the custom admin-session (no Supabase JWT).
-- ============================================================================

-- --- H1: pilot_requests ---------------------------------------------------
drop policy if exists "authenticated_full_access" on public.pilot_requests;
-- idempotent: drop our own policy first so re-application never errors
drop policy if exists "pilot_requests_admin_manager_all" on public.pilot_requests;

create policy "pilot_requests_admin_manager_all"
  on public.pilot_requests
  as permissive
  for all
  to authenticated
  using (public.is_admin_or_manager())
  with check (public.is_admin_or_manager());

-- --- H3: pilot_dashboard_metrics materialized view ------------------------
revoke select on public.pilot_dashboard_metrics from anon, authenticated;
