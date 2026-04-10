-- Migration: Fix pilot_users emails
-- Developer: Maurice Rondeau
-- Date: 2026-02-13
--
-- Backfills correct emails from the pilots table into pilot_users.
-- The original migration (20260127100000) incorrectly generated emails
-- as employee_id@airniugini.com.pg instead of using actual pilot emails.

UPDATE public.pilot_users pu
SET email = p.email
FROM public.pilots p
WHERE pu.pilot_id = p.id
  AND p.email IS NOT NULL
  AND p.email != ''
  AND pu.email ~ '^\d+@airniugini\.com\.pg$';
