-- Fix Function Search Path Mutable warnings
-- Add search_path to 5 functions that are missing it
-- This prevents search_path injection attacks in SECURITY DEFINER functions

-- 1. get_pilot_feedback_posts
ALTER FUNCTION public.get_pilot_feedback_posts(
  p_pilot_user_id UUID,
  p_limit INTEGER,
  p_offset INTEGER
) SET search_path = public;

-- 2. submit_feedback_post_tx
ALTER FUNCTION public.submit_feedback_post_tx(
  p_pilot_user_id UUID,
  p_title TEXT,
  p_content TEXT,
  p_category_id UUID,
  p_is_anonymous BOOLEAN,
  p_author_display_name TEXT,
  p_author_rank TEXT
) SET search_path = public;

-- 3. upvote_feedback_post
ALTER FUNCTION public.upvote_feedback_post(
  p_post_id UUID,
  p_pilot_user_id UUID
) SET search_path = public;

-- 4. remove_upvote_feedback_post
ALTER FUNCTION public.remove_upvote_feedback_post(
  p_post_id UUID,
  p_pilot_user_id UUID
) SET search_path = public;

-- 5. get_expiring_certifications_with_email
ALTER FUNCTION public.get_expiring_certifications_with_email(
  days_threshold INTEGER
) SET search_path = public;

-- Verify success
SELECT 'search_path added to 5 functions' AS status, now() AS timestamp;
