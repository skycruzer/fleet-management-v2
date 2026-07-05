-- ============================================================================
-- Security lockdown: remove anon/authenticated exposure of credential/session tables
-- ============================================================================
-- Addresses audit findings C1, C2, C3, H2.
--
-- Before this migration, the public `anon` role (whose key ships in every
-- browser) could SELECT these tables via `USING (true)` policies + table grants,
-- exposing an_users.password_hash and plaintext session / reset tokens.
--
-- All legitimate reads of these tables run server-side with the service role:
--   * proxy.ts (middleware) — refactored to a service-role client
--   * lib/services/redis-session-service.ts — service role
--   * lib/middleware/admin-auth-helper.ts, components/layout/professional-sidebar.tsx,
--     lib/auth/pilot-helpers.ts — admin (service-role) client
--   * pilot-portal-service.ts / admin-auth-service.ts login lookups — service role
--
-- DEPLOY ORDER: the code changes above MUST be deployed BEFORE this migration is
-- applied. Applying it against the OLD code would break custom-session logins,
-- because the old proxy read these tables with the anon key.
-- ============================================================================

-- --- an_users (C1) --------------------------------------------------------
drop policy if exists "an_users_anon_select_v2" on public.an_users;
-- Defensive: drop any other anon/authenticated blanket SELECT policies if present.
drop policy if exists "an_users_authenticated_select" on public.an_users;

revoke select, insert, update, delete, truncate, references, trigger
  on table public.an_users from anon, authenticated;

-- --- admin_sessions (C2) --------------------------------------------------
drop policy if exists "admin_sessions_select_by_token" on public.admin_sessions;
revoke select, insert, update, delete, truncate, references, trigger
  on table public.admin_sessions from anon, authenticated;

-- --- pilot_sessions (C2) --------------------------------------------------
drop policy if exists "pilot_sessions_select_by_token" on public.pilot_sessions;
revoke select, insert, update, delete, truncate, references, trigger
  on table public.pilot_sessions from anon, authenticated;

-- --- password_reset_tokens (C3) -------------------------------------------
drop policy if exists "Allow authenticated read of password reset tokens" on public.password_reset_tokens;
drop policy if exists "authenticated_insert" on public.password_reset_tokens;
drop policy if exists "authenticated_update" on public.password_reset_tokens;
-- live policy names carry a table suffix — drop those too so nothing inert lingers
drop policy if exists "authenticated_insert_password_reset_tokens" on public.password_reset_tokens;
drop policy if exists "authenticated_update_password_reset_tokens" on public.password_reset_tokens;
revoke select, insert, update, delete, truncate, references, trigger
  on table public.password_reset_tokens from anon, authenticated;

-- --- password_history (H2) — service-role-only, written by password flows ---
revoke select, insert, update, delete, truncate, references, trigger
  on table public.password_history from anon, authenticated;

-- --- audit_logs (H2) — append-only; writes go through service role/triggers ---
revoke select, insert, update, delete, truncate, references, trigger
  on table public.audit_logs from anon, authenticated;

-- Note: RLS remains ENABLED on all of the above. With the anon/authenticated
-- grants removed and the permissive policies dropped, these tables are now
-- reachable only by the service role (which bypasses RLS by design).
