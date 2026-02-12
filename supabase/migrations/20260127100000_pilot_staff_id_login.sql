-- Migration: Pilot Staff ID Login with Default Password
-- Developer: Maurice Rondeau
-- Date: 2026-01-27
--
-- Adds must_change_password column, syncs employee_ids,
-- sets default password "niugini" for pilots without one,
-- and creates pilot_users records for any pilots missing one.

-- 1. Add must_change_password column to pilot_users
ALTER TABLE public.pilot_users
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT true;

-- 2. Existing users with a password_hash already changed their password
UPDATE public.pilot_users
  SET must_change_password = false
  WHERE password_hash IS NOT NULL;

-- 3. Sync employee_id from pilots table where missing
UPDATE public.pilot_users pu
SET employee_id = p.employee_id
FROM public.pilots p
WHERE pu.pilot_id = p.id
  AND (pu.employee_id IS NULL OR pu.employee_id = '');

-- 4. Set default password "niugini" for users without a password
UPDATE public.pilot_users
SET
  password_hash = extensions.crypt('niugini', extensions.gen_salt('bf', 10)),
  must_change_password = true,
  registration_approved = true
WHERE password_hash IS NULL;

-- 5. Create pilot_users records for any pilots missing one
INSERT INTO public.pilot_users (
  email, first_name, last_name, rank, employee_id, pilot_id,
  registration_approved, must_change_password, password_hash
)
SELECT
  p.employee_id || '@airniugini.com.pg',
  p.first_name, p.last_name, p.role, p.employee_id, p.id,
  true, true,
  extensions.crypt('niugini', extensions.gen_salt('bf', 10))
FROM public.pilots p
WHERE p.is_active = true
  AND NOT EXISTS (SELECT 1 FROM public.pilot_users pu WHERE pu.pilot_id = p.id);
