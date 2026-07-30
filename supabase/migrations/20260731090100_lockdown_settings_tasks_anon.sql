-- ============================================================================
-- Security: remove anonymous read access to settings, tasks, task_categories
-- and check_types
-- ============================================================================
-- Companion to 20260731090000_lockdown_pilot_users.sql.
--
-- Migration 20251228220001_add_remaining_anon_policies.sql created blanket
-- `FOR SELECT TO anon USING (true)` policies across six tables. The July 2026
-- lockdown neutralised three of them (an_users, admin_sessions, pilot_sessions)
-- by revoking the underlying table grants, but settings, task_categories and
-- check_types kept both the policy and the grant.
--
-- Verified live with the anon key (the key that ships in every browser bundle):
--   * public.settings returns all 5 rows. The exposed `admin_notification_emails`
--     value is a real internal address list — a ready-made phishing target list.
--     Also exposed: alert_thresholds, pilot_requirements,
--     certification_notification_intervals, app_title.
--   * public.tasks returns all 37 rows with all 24 columns, including title,
--     description, assigned_to, related_pilot_id and related_matter_id. The last
--     links tasks to disciplinary matters, so the internal task board leaks
--     personnel context even though disciplinary_matters itself is closed to anon.
--
-- `tasks` is a slightly different shape: it has no anon POLICY (its `tasks_select`
-- is scoped TO authenticated), only `GRANT ALL ... TO anon`. Rows should therefore
-- have been filtered by RLS — that they are readable indicates RLS is currently
-- DISABLED on the table, consistent with the ad-hoc `*.sql` scripts at the repo
-- root having been applied by hand. Hence the explicit ENABLE below.
--
-- 20260313000001 already dropped settings_anon_insert/update but left
-- settings_anon_select in place.
--
-- No code change is required for this migration: every reader of these four
-- tables already uses the admin/service-role client. Verified by inspection —
--   settings          -> unified-cache-service, leave-eligibility-service, admin-service
--   tasks             -> task-service, pilot-service
--   task_categories   -> task-service
--   check_types       -> check-types-service, admin-service, pdf-service,
--                        unified-cache-service, renewal-planning services,
--                        ebt/reports/queries, api/check-types/[id]/reminders
-- ============================================================================

-- --- settings ---------------------------------------------------------------
drop policy if exists "settings_anon_select" on public.settings;
drop policy if exists "settings_anon_insert" on public.settings;
drop policy if exists "settings_anon_update" on public.settings;

revoke select, insert, update, delete, truncate, references, trigger
  on table public.settings from anon, authenticated;

alter table public.settings enable row level security;

-- --- tasks ------------------------------------------------------------------
revoke select, insert, update, delete, truncate, references, trigger
  on table public.tasks from anon, authenticated;

alter table public.tasks enable row level security;

-- --- task_categories --------------------------------------------------------
drop policy if exists "task_categories_anon_select" on public.task_categories;
drop policy if exists "task_categories_anon_insert" on public.task_categories;
drop policy if exists "task_categories_anon_update" on public.task_categories;

revoke select, insert, update, delete, truncate, references, trigger
  on table public.task_categories from anon, authenticated;

alter table public.task_categories enable row level security;

-- --- check_types ------------------------------------------------------------
-- Reference data rather than PII, but the same blanket anon policy pattern and
-- the same all-service-role reader set, so close it alongside the others.
drop policy if exists "check_types_anon_select" on public.check_types;
drop policy if exists "check_types_anon_insert" on public.check_types;
drop policy if exists "check_types_anon_update" on public.check_types;

revoke select, insert, update, delete, truncate, references, trigger
  on table public.check_types from anon, authenticated;

alter table public.check_types enable row level security;

-- Verify after applying — expect zero rows from both:
--
--   select table_name, grantee, privilege_type
--     from information_schema.role_table_grants
--    where table_schema = 'public'
--      and table_name in ('settings','tasks','task_categories','check_types')
--      and grantee in ('anon','authenticated');
--
--   select tablename, policyname, roles, cmd
--     from pg_policies
--    where schemaname = 'public'
--      and tablename in ('settings','tasks','task_categories','check_types')
--      and (roles::text like '%anon%' or roles::text like '%public%');
