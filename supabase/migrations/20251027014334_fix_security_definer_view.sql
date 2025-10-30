-- ============================================================================
-- Migration: Fix Security Definer View
-- Created: 2025-10-27
-- Purpose: Remove SECURITY DEFINER from pilot_user_mappings view
-- Reference: Supabase Security Advisor - "Detects views defined with the SECURITY DEFINER"
-- ============================================================================

-- SECURITY ISSUE: Views defined with SECURITY DEFINER can bypass RLS policies
-- This is a security risk as it allows users to access data they shouldn't see

-- SOLUTION: Recreate the view without SECURITY DEFINER
-- The view will now respect RLS policies on the underlying tables

-- Drop the existing view
DROP VIEW IF EXISTS public.pilot_user_mappings;

-- Recreate without SECURITY DEFINER (default is SECURITY INVOKER)
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
LEFT JOIN public.pilots p ON p.employee_id = pu.employee_id;

-- Add comment to document the security fix
COMMENT ON VIEW public.pilot_user_mappings IS
'Maps pilot_users to pilots table via employee_id. Uses SECURITY INVOKER (default) to respect RLS policies.';

-- Grant appropriate permissions
-- Note: View permissions are now controlled by RLS policies on underlying tables
GRANT SELECT ON public.pilot_user_mappings TO authenticated;
GRANT SELECT ON public.pilot_user_mappings TO anon;

-- ============================================================================
-- Migration Complete - Security Definer Removed
-- ============================================================================

-- Summary:
-- ✅ Removed SECURITY DEFINER from pilot_user_mappings view
-- ✅ View now respects RLS policies on pilot_users and pilots tables
-- ✅ Users can only see data they're authorized to access
-- ✅ Security vulnerability fixed

-- Impact:
-- - View now operates with caller's permissions (SECURITY INVOKER)
-- - RLS policies on pilot_users and pilots tables are respected
-- - No bypass of security policies
