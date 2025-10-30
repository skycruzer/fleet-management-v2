/**
 * Extract RLS Policies - SQL Script
 *
 * Run this in Supabase SQL Editor to extract all RLS policies
 *
 * Developer: Maurice Rondeau
 * Sprint: Sprint 1 Days 3-4 (Task 4)
 */

-- =====================================================
-- PART 1: List all tables with RLS status
-- =====================================================
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  (SELECT COUNT(*)
   FROM pg_policies p
   WHERE p.schemaname = t.schemaname
     AND p.tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY tablename;

-- =====================================================
-- PART 2: List all RLS policies with details
-- =====================================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- PART 3: Count policies by table
-- =====================================================
SELECT
  tablename,
  COUNT(*) as policy_count,
  COUNT(*) FILTER (WHERE cmd = 'SELECT') as select_policies,
  COUNT(*) FILTER (WHERE cmd = 'INSERT') as insert_policies,
  COUNT(*) FILTER (WHERE cmd = 'UPDATE') as update_policies,
  COUNT(*) FILTER (WHERE cmd = 'DELETE') as delete_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC, tablename;

-- =====================================================
-- PART 4: Identify potentially problematic policies
-- =====================================================

-- Tables without RLS enabled
SELECT
  tablename,
  'No RLS enabled' as issue
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
ORDER BY tablename;

-- Policies with no restrictions (qual IS NULL or qual = 'true')
SELECT
  tablename,
  policyname,
  cmd,
  'Overly permissive - no restrictions' as issue,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual IS NULL OR qual = 'true' OR qual = '')
ORDER BY tablename, policyname;

-- DELETE policies without restrictions
SELECT
  tablename,
  policyname,
  'DELETE policy with no restrictions' as issue,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd = 'DELETE'
  AND (qual IS NULL OR qual = 'true' OR qual = '')
ORDER BY tablename, policyname;

-- Policies applying to public/anon roles
SELECT
  tablename,
  policyname,
  cmd,
  roles,
  'Policy applies to public/anon role' as warning
FROM pg_policies
WHERE schemaname = 'public'
  AND ('public' = ANY(roles) OR 'anon' = ANY(roles))
ORDER BY tablename, policyname;

-- =====================================================
-- PART 5: Role-based policy analysis
-- =====================================================
SELECT
  unnest(roles) as role,
  COUNT(*) as policy_count,
  COUNT(*) FILTER (WHERE cmd = 'SELECT') as select_count,
  COUNT(*) FILTER (WHERE cmd = 'INSERT') as insert_count,
  COUNT(*) FILTER (WHERE cmd = 'UPDATE') as update_count,
  COUNT(*) FILTER (WHERE cmd = 'DELETE') as delete_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY role
ORDER BY policy_count DESC;
