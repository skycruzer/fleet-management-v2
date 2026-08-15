-- Notifications are delivered to two application-user tables:
--   * public.an_users for the admin portal
--   * public.pilot_users for the pilot portal
--
-- Neither table's UUIDs are interchangeable with auth.users. The historical
-- auth.users foreign key therefore rejected legitimate pilot notifications
-- (including the certification-expiry cron job). Replace it with a trigger
-- that preserves the actual invariant: every recipient must exist in at least
-- one of the two supported application-user tables.

begin;

alter table public.notifications
  drop constraint if exists notifications_recipient_id_fkey;

create or replace function public.validate_notification_recipient()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.an_users where id = new.recipient_id)
     and not exists (select 1 from public.pilot_users where id = new.recipient_id) then
    raise exception using
      errcode = 'foreign_key_violation',
      message = 'notification recipient must be an admin or pilot portal user';
  end if;

  return new;
end;
$$;

revoke all on function public.validate_notification_recipient() from public, anon, authenticated;
grant execute on function public.validate_notification_recipient() to service_role;

drop trigger if exists notifications_validate_recipient on public.notifications;
create trigger notifications_validate_recipient
before insert or update of recipient_id on public.notifications
for each row execute function public.validate_notification_recipient();

-- Notification reads and writes go through the server-side service-role client.
-- Remove inert browser-role grants and retain RLS as defense in depth.
revoke select, insert, update, delete, truncate, references, trigger
  on table public.notifications from anon, authenticated;
alter table public.notifications enable row level security;

commit;
