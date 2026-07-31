-- Consume a pilot password-reset token and update all database-backed auth
-- state atomically. The caller must hash and validate the password first.

create or replace function public.consume_pilot_password_reset(
  p_token text,
  p_password_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_employee_id text;
  v_email text;
  v_now timestamptz := statement_timestamp();
begin
  select token_row.user_id, pilot.employee_id, pilot.email
    into v_user_id, v_employee_id, v_email
  from public.password_reset_tokens as token_row
  join public.pilot_users as pilot on pilot.id = token_row.user_id
  where token_row.token = p_token
    and token_row.used_at is null
    and token_row.expires_at > v_now
  order by token_row.created_at desc
  limit 1
  for update of token_row;

  if v_user_id is null then
    return null;
  end if;

  update public.pilot_users
  set password_hash = p_password_hash,
      updated_at = v_now
  where id = v_user_id;

  -- Invalidate every outstanding reset link for this account, not only the
  -- submitted token, so an older email cannot overwrite the new password.
  update public.password_reset_tokens
  set used_at = v_now
  where user_id = v_user_id
    and used_at is null;

  update public.pilot_sessions
  set is_active = false
  where pilot_user_id = v_user_id
    and is_active = true;

  delete from public.failed_login_attempts
  where lower(email) = any (
    array[lower(v_employee_id), lower(v_email)]
  );

  delete from public.account_lockouts
  where lower(email) = any (
    array[lower(v_employee_id), lower(v_email)]
  );

  return jsonb_build_object(
    'userId', v_user_id,
    'staffId', v_employee_id,
    'email', v_email
  );
end;
$$;

revoke all on function public.consume_pilot_password_reset(text, text) from public;
revoke all on function public.consume_pilot_password_reset(text, text) from anon;
revoke all on function public.consume_pilot_password_reset(text, text) from authenticated;
grant execute on function public.consume_pilot_password_reset(text, text) to service_role;

comment on function public.consume_pilot_password_reset(text, text) is
  'Atomically consumes a pilot reset token, changes the password, invalidates sibling reset tokens, revokes DB sessions, and clears lockout state.';
