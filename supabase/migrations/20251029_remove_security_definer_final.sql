-- Drop the view completely first
DROP VIEW IF EXISTS public.pilot_user_mappings CASCADE;

-- Create the view WITHOUT any security options
-- By default, views run with the permissions of the current user (SECURITY INVOKER behavior)
CREATE VIEW public.pilot_user_mappings
WITH (security_invoker = true)
AS
SELECT
  pu.id AS pilot_user_id,
  pu.employee_id,
  pu.email,
  pu.first_name,
  pu.last_name,
  pu.rank,
  pu.seniority_number,
  pu.registration_approved,
  pu.last_login_at,
  pu.created_at AS pilot_user_created_at,
  p.id AS pilot_id,
  p.created_at AS pilot_created_at
FROM public.pilot_users pu
LEFT JOIN public.pilots p ON p.employee_id::text = pu.employee_id;

-- Grant permissions
GRANT SELECT ON public.pilot_user_mappings TO authenticated;
GRANT ALL ON public.pilot_user_mappings TO service_role;

-- Verify the view options
SELECT
  schemaname,
  viewname,
  viewowner,
  definition
FROM pg_views
WHERE schemaname = 'public'
  AND viewname = 'pilot_user_mappings';

-- Verify success
SELECT 'View recreated with security_invoker = true (no SECURITY DEFINER)' AS status, now() AS timestamp;
