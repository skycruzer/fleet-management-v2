-- Lock down complete_task(uuid)
--
-- `complete_task(p_task_id uuid)` (migration 20251027012541) is SECURITY DEFINER, accepts any task
-- id and performs no caller authorization. PostgreSQL grants EXECUTE on functions to PUBLIC by
-- default, so it was callable over PostgREST as /rest/v1/rpc/complete_task by anyone holding the
-- anon key — completing another user's task regardless of RLS.
--
-- The 20260706120000 hardening pass locked 13 sensitive SECURITY DEFINER functions the same way
-- but did not include this one. Same treatment: revoke from PUBLIC (revoking from `anon` alone is
-- a no-op while the PUBLIC grant stands), then grant back only to service_role, which is what the
-- application's server-side clients use.
--
-- Idempotent: safe to re-run, and a no-op if the function was already dropped.

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'complete_task'
      and pg_get_function_identity_arguments(p.oid) = 'uuid'
  ) then
    revoke all on function public.complete_task(uuid) from public;
    revoke all on function public.complete_task(uuid) from anon, authenticated;
    grant execute on function public.complete_task(uuid) to service_role;

    comment on function public.complete_task(uuid) is
      'Marks a task as completed. Locked to service_role — performs no caller authorization, so it must never be reachable with the anon key.';
  end if;
end
$$;
