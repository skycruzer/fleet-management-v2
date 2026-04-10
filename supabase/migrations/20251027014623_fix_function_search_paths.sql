-- ============================================================================
-- Migration: Fix Function Search Path Security
-- Created: 2025-10-27
-- Purpose: Set explicit search_path on existing SECURITY DEFINER functions
-- Reference: Supabase Security Advisor - "Function Search Path Mutable"
-- ============================================================================

-- SECURITY ISSUE: Functions with SECURITY DEFINER and mutable search_path
-- are vulnerable to search_path attacks.

-- SOLUTION: Set explicit search_path on all existing SECURITY DEFINER functions

-- Fix all functions that exist (use IF EXISTS to skip non-existent ones)
DO $$
BEGIN
  -- Transaction Functions
  PERFORM 1 FROM pg_proc WHERE proname = 'submit_flight_request_tx';
  IF FOUND THEN
    ALTER FUNCTION public.submit_flight_request_tx(uuid, text, date, text, jsonb) SET search_path TO 'public';
  END IF;

  PERFORM 1 FROM pg_proc WHERE proname = 'submit_leave_request_tx';
  IF FOUND THEN
    ALTER FUNCTION public.submit_leave_request_tx(uuid, text, date, date, integer, text, text) SET search_path TO 'public';
  END IF;

  PERFORM 1 FROM pg_proc WHERE proname = 'approve_leave_request';
  IF FOUND THEN
    ALTER FUNCTION public.approve_leave_request(uuid, uuid, text) SET search_path TO 'public';
  END IF;

  -- Pilot Management Functions
  PERFORM 1 FROM pg_proc WHERE proname = 'create_pilot_with_certifications';
  IF FOUND THEN
    ALTER FUNCTION public.create_pilot_with_certifications(jsonb, jsonb[]) SET search_path TO 'public';
  END IF;

  PERFORM 1 FROM pg_proc WHERE proname = 'delete_pilot_with_cascade';
  IF FOUND THEN
    ALTER FUNCTION public.delete_pilot_with_cascade(uuid) SET search_path TO 'public';
  END IF;

  PERFORM 1 FROM pg_proc WHERE proname = 'get_pilot_expiring_items';
  IF FOUND THEN
    ALTER FUNCTION public.get_pilot_expiring_items(uuid, integer) SET search_path TO 'public';
  END IF;

  PERFORM 1 FROM pg_proc WHERE proname = 'get_pilot_expiry_summary';
  IF FOUND THEN
    ALTER FUNCTION public.get_pilot_expiry_summary(uuid) SET search_path TO 'public';
  END IF;

  PERFORM 1 FROM pg_proc WHERE proname = 'calculate_years_in_service';
  IF FOUND THEN
    ALTER FUNCTION public.calculate_years_in_service(uuid) SET search_path TO 'public';
  END IF;

  PERFORM 1 FROM pg_proc WHERE proname = 'get_crew_expiry_summary';
  IF FOUND THEN
    ALTER FUNCTION public.get_crew_expiry_summary(uuid) SET search_path TO 'public';
  END IF;

  PERFORM 1 FROM pg_proc WHERE proname = 'get_crew_member_expiring_items';
  IF FOUND THEN
    ALTER FUNCTION public.get_crew_member_expiring_items(uuid, integer) SET search_path TO 'public';
  END IF;

  PERFORM 1 FROM pg_proc WHERE proname = 'find_crew_member_by_name';
  IF FOUND THEN
    ALTER FUNCTION public.find_crew_member_by_name(text) SET search_path TO 'public';
  END IF;

  -- Certification Management Functions
  PERFORM 1 FROM pg_proc WHERE proname = 'batch_update_certifications';
  IF FOUND THEN
    ALTER FUNCTION public.batch_update_certifications(jsonb[]) SET search_path TO 'public';
  END IF;

  PERFORM 1 FROM pg_proc WHERE proname = 'bulk_delete_certifications';
  IF FOUND THEN
    ALTER FUNCTION public.bulk_delete_certifications(uuid[]) SET search_path TO 'public';
  END IF;

  PERFORM 1 FROM pg_proc WHERE proname = 'get_check_category_distribution';
  IF FOUND THEN
    ALTER FUNCTION public.get_check_category_distribution() SET search_path TO 'public';
  END IF;

  PERFORM 1 FROM pg_proc WHERE proname = 'calculate_optimal_renewal_date';
  IF FOUND THEN
    ALTER FUNCTION public.calculate_optimal_renewal_date(date) SET search_path TO 'public';
  END IF;

  -- Trigger Functions
  PERFORM 1 FROM pg_proc WHERE proname = 'update_pilot_feedback_updated_at';
  IF FOUND THEN
    ALTER FUNCTION public.update_pilot_feedback_updated_at() SET search_path TO 'public';
  END IF;

  PERFORM 1 FROM pg_proc WHERE proname = 'update_feedback_posts_updated_at';
  IF FOUND THEN
    ALTER FUNCTION public.update_feedback_posts_updated_at() SET search_path TO 'public';
  END IF;

  PERFORM 1 FROM pg_proc WHERE proname = 'update_feedback_comments_updated_at';
  IF FOUND THEN
    ALTER FUNCTION public.update_feedback_comments_updated_at() SET search_path TO 'public';
  END IF;

  PERFORM 1 FROM pg_proc WHERE proname = 'update_renewal_plan_timestamp';
  IF FOUND THEN
    ALTER FUNCTION public.update_renewal_plan_timestamp() SET search_path TO 'public';
  END IF;

  PERFORM 1 FROM pg_proc WHERE proname = 'log_pilot_users_changes';
  IF FOUND THEN
    ALTER FUNCTION public.log_pilot_users_changes() SET search_path TO 'public';
  END IF;

  PERFORM 1 FROM pg_proc WHERE proname = 'log_renewal_plan_change';
  IF FOUND THEN
    ALTER FUNCTION public.log_renewal_plan_change() SET search_path TO 'public';
  END IF;

  -- Utility Functions
  PERFORM 1 FROM pg_proc WHERE proname = 'complete_task';
  IF FOUND THEN
    ALTER FUNCTION public.complete_task(uuid) SET search_path TO 'public';
  END IF;

  PERFORM 1 FROM pg_proc WHERE proname = 'get_auth_user_from_pilot_user';
  IF FOUND THEN
    ALTER FUNCTION public.get_auth_user_from_pilot_user(uuid) SET search_path TO 'public';
  END IF;

  PERFORM 1 FROM pg_proc WHERE proname = 'cleanup_expired_password_reset_tokens';
  IF FOUND THEN
    ALTER FUNCTION public.cleanup_expired_password_reset_tokens() SET search_path TO 'public';
  END IF;
END $$;

-- Summary:
-- ✅ Set explicit search_path on all existing SECURITY DEFINER functions
-- ✅ Functions now only use objects from 'public' schema
-- ✅ Protected against search_path injection attacks
