-- Remove SECURITY DEFINER from pilot_user_mappings view
-- This view currently enforces permissions of the creator instead of the querying user
-- Recreating without SECURITY DEFINER to follow security best practices

-- Drop existing view
DROP VIEW IF EXISTS public.pilot_user_mappings;

-- Recreate view without SECURITY DEFINER property
CREATE OR REPLACE VIEW public.pilot_user_mappings AS
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

-- Grant appropriate permissions
GRANT SELECT ON public.pilot_user_mappings TO authenticated;
GRANT ALL ON public.pilot_user_mappings TO service_role;

-- Verify view was created successfully
SELECT 'pilot_user_mappings view recreated without SECURITY DEFINER' AS status, now() AS timestamp;
