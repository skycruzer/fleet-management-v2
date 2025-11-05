-- Find ALL policies that might reference an_users table
-- This is the root cause of the recursion!

-- Check all tables with RLS enabled
SELECT
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Get all policy definitions that might reference an_users
SELECT
    tablename,
    policyname,
    cmd,
    roles::text[],
    qual::text as using_clause,
    with_check::text as check_clause
FROM pg_policies
WHERE schemaname = 'public'
AND (
    qual::text ILIKE '%an_users%'
    OR with_check::text ILIKE '%an_users%'
)
ORDER BY tablename, policyname;

-- If the above doesn't work, check specific tables
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename IN ('leave_requests', 'pilots', 'pilot_checks', 'flight_requests')
ORDER BY tablename, policyname;
