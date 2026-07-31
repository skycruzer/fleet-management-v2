-- ============================================================================
-- Security lockdown: remove anon/authenticated exposure of public.pilot_users
-- ============================================================================
-- Follow-up to 20260703000001_lockdown_auth_tables.sql, which closed the six
-- credential/session tables (an_users, admin_sessions, pilot_sessions,
-- password_reset_tokens, password_history, audit_logs) but did NOT include
-- public.pilot_users — the pilot portal's own credential store.
--
-- pilot_users holds `password_hash` (bcrypt) plus full pilot PII: email,
-- first_name, last_name, employee_id, rank, date_of_birth, phone_number,
-- address, seniority_number, auth_user_id and must_change_password.
--
-- Root cause of the exposure, in two parts:
--   1. `GRANT ALL ON TABLE public.pilot_users TO anon` from the original schema
--      dump (20251026234829_remote_schema.sql:12470) was never revoked.
--   2. Policy "pilot_users_public_read_for_login" is scoped `FOR SELECT TO public`
--      (see _applied_backup/20260127e_consolidate_rls_policies.sql:423-425),
--      which grants every approved pilot's row to the anon role.
-- Together these made the whole table readable with the public anon key that
-- ships in every browser bundle.
--
-- Contributing note: CLAUDE.md described an_users as "also aliased as
-- pilot_users". They are two distinct tables, each with its own password_hash.
-- That aliasing note is corrected in this change.
--
-- DEPLOY ORDER: the code change in lib/auth/pilot-helpers.ts MUST be deployed
-- BEFORE this migration is applied. Applying it against the OLD code would break
-- every pilot portal login, because getCurrentPilot() / getPilotFromRequest() /
-- getPilotUserRoles() / updatePilotLastLogin() previously read pilot_users with
-- the anon (SSR) client. They now use the service-role client, matching the
-- convention already used for an_users.
--
-- POST-DEPLOY: the 29 bcrypt hashes in this table must be treated as
-- compromised. Force a password reset for all portal accounts.
-- ============================================================================

-- --- Drop every policy that exposes rows to anon / public -------------------
-- The permissive one that made this exploitable:
drop policy if exists "pilot_users_public_read_for_login" on public.pilot_users;

-- Defensive: drop other blanket/legacy policies seen across the migration
-- history and the ad-hoc scripts at the repo root, so no TO public / TO anon
-- grant survives whichever of them was applied last.
drop policy if exists "pilot_users_select" on public.pilot_users;
drop policy if exists "pilot_users_update" on public.pilot_users;
drop policy if exists "Users can view own pilot_user profile" on public.pilot_users;
drop policy if exists "Users can update own pilot_user profile" on public.pilot_users;
drop policy if exists "pilot_users_pilot_read_own" on public.pilot_users;

-- --- Revoke the table grants ------------------------------------------------
revoke select, insert, update, delete, truncate, references, trigger
  on table public.pilot_users from anon, authenticated;

-- --- Ensure RLS is on -------------------------------------------------------
-- fix-all-rls-policies.sql at the repo root contains
-- `ALTER TABLE pilot_users DISABLE ROW LEVEL SECURITY;` and was evidently
-- applied by hand at some point, so re-assert this rather than assume it.
alter table public.pilot_users enable row level security;

-- Note: RLS remains ENABLED with no anon/authenticated grants and no permissive
-- policies. The table is now reachable only by the service role (which bypasses
-- RLS by design). Every legitimate reader already uses the admin/service-role
-- client:
--   * lib/auth/pilot-helpers.ts            — service role (changed in this PR)
--   * lib/services/pilot-portal-service.ts — admin client
--   * lib/services/portal-admin-service.ts — admin client
--   * lib/services/session-service.ts,
--     lib/services/redis-session-service.ts — service role
--   * app/api/portal/{profile,change-password}/route.ts — admin client
--   * app/dashboard/admin/pilot-registrations/actions.ts — admin client
--
-- Verify after applying:
--   select grantee, privilege_type
--     from information_schema.role_table_grants
--    where table_schema = 'public' and table_name = 'pilot_users'
--      and grantee in ('anon','authenticated');   -- expect zero rows
--
--   select policyname, roles, cmd
--     from pg_policies
--    where schemaname = 'public' and tablename = 'pilot_users';  -- expect no public/anon
