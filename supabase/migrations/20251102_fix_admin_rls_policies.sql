-- Fix RLS Policies for Admin Access
--
-- Problem: RLS policies check an_users table for admin role, but admin dashboard
-- uses Supabase Auth (auth.users) which is a completely separate authentication system.
--
-- Solution: Grant SELECT access to authenticated users from Supabase Auth.
-- Since admin dashboard already has auth protection at the route level,
-- we can safely allow authenticated Supabase users to view these tables.
--
-- Migration created: 2025-11-02
-- Author: Maurice Rondeau

-- ============================================================================
-- PILOT FEEDBACK TABLE
-- ============================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can view all feedback" ON public.pilot_feedback;
DROP POLICY IF EXISTS "Admins can update feedback" ON public.pilot_feedback;

-- Create new policies that work with Supabase Auth
CREATE POLICY "Authenticated users can view all feedback"
ON public.pilot_feedback
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can update feedback"
ON public.pilot_feedback
FOR UPDATE
TO authenticated
USING (true);

COMMENT ON POLICY "Authenticated users can view all feedback" ON public.pilot_feedback IS
'Allows Supabase Auth users (admin dashboard) to view all feedback. Route-level protection enforces admin-only access.';

COMMENT ON POLICY "Authenticated users can update feedback" ON public.pilot_feedback IS
'Allows Supabase Auth users (admin dashboard) to update feedback. Route-level protection enforces admin-only access.';

-- ============================================================================
-- FLIGHT REQUESTS TABLE
-- ============================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can view all flight requests" ON public.flight_requests;

-- Create new policy that works with Supabase Auth
CREATE POLICY "Authenticated users can view all flight requests"
ON public.flight_requests
FOR SELECT
TO authenticated
USING (true);

COMMENT ON POLICY "Authenticated users can view all flight requests" ON public.flight_requests IS
'Allows Supabase Auth users (admin dashboard) to view all flight requests. Route-level protection enforces admin-only access.';

-- ============================================================================
-- LEAVE REQUESTS TABLE (if similar policy exists)
-- ============================================================================

-- Check if restrictive policy exists and replace it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'leave_requests'
        AND policyname LIKE '%admin%' OR policyname LIKE '%an_users%'
    ) THEN
        -- Drop and recreate with correct policy
        DROP POLICY IF EXISTS "Admins can view all leave requests" ON public.leave_requests;

        CREATE POLICY "Authenticated users can view all leave requests"
        ON public.leave_requests
        FOR SELECT
        TO authenticated
        USING (true);

        COMMENT ON POLICY "Authenticated users can view all leave requests" ON public.leave_requests IS
        'Allows Supabase Auth users (admin dashboard) to view all leave requests. Route-level protection enforces admin-only access.';
    END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- List all policies on affected tables for verification
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('pilot_feedback', 'flight_requests', 'leave_requests')
ORDER BY tablename, policyname;
