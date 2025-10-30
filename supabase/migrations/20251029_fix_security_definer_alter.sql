-- Drop and recreate view, then alter security settings
DROP VIEW IF EXISTS public.pilot_user_mappings CASCADE;

-- Create view with standard syntax
CREATE VIEW public.pilot_user_mappings AS
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

-- Set security_invoker option (removes SECURITY DEFINER behavior)
ALTER VIEW public.pilot_user_mappings SET (security_invoker = on);

-- Grant permissions
GRANT SELECT ON public.pilot_user_mappings TO authenticated;
GRANT ALL ON public.pilot_user_mappings TO service_role;

-- Verify the view is no longer using SECURITY DEFINER
SELECT
  'View recreated and security_invoker enabled' AS status,
  now() AS timestamp;
