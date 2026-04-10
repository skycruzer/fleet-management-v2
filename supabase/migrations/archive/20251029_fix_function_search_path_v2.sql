-- Fix Function Search Path Mutable warnings
-- Handle multiple function overloads

-- 1. get_pilot_feedback_posts
DO $$
BEGIN
  EXECUTE 'ALTER FUNCTION public.get_pilot_feedback_posts(UUID, INTEGER, INTEGER) SET search_path = public';
EXCEPTION
  WHEN undefined_function THEN
    RAISE NOTICE 'Function get_pilot_feedback_posts not found with this signature';
END $$;

-- 2. submit_feedback_post_tx (5 parameter version)
DO $$
BEGIN
  EXECUTE 'ALTER FUNCTION public.submit_feedback_post_tx(UUID, TEXT, TEXT, UUID, BOOLEAN) SET search_path = public';
EXCEPTION
  WHEN undefined_function THEN
    RAISE NOTICE 'Function submit_feedback_post_tx (5 params) not found';
END $$;

-- 2b. submit_feedback_post_tx (7 parameter version)
DO $$
BEGIN
  EXECUTE 'ALTER FUNCTION public.submit_feedback_post_tx(UUID, TEXT, TEXT, UUID, BOOLEAN, TEXT, TEXT) SET search_path = public';
EXCEPTION
  WHEN undefined_function THEN
    RAISE NOTICE 'Function submit_feedback_post_tx (7 params) not found';
END $$;

-- 3. upvote_feedback_post
DO $$
BEGIN
  EXECUTE 'ALTER FUNCTION public.upvote_feedback_post(UUID, UUID) SET search_path = public';
EXCEPTION
  WHEN undefined_function THEN
    RAISE NOTICE 'Function upvote_feedback_post not found';
END $$;

-- 4. remove_upvote_feedback_post
DO $$
BEGIN
  EXECUTE 'ALTER FUNCTION public.remove_upvote_feedback_post(UUID, UUID) SET search_path = public';
EXCEPTION
  WHEN undefined_function THEN
    RAISE NOTICE 'Function remove_upvote_feedback_post not found';
END $$;

-- 5. get_expiring_certifications_with_email
DO $$
BEGIN
  EXECUTE 'ALTER FUNCTION public.get_expiring_certifications_with_email(INTEGER) SET search_path = public';
EXCEPTION
  WHEN undefined_function THEN
    RAISE NOTICE 'Function get_expiring_certifications_with_email not found';
END $$;

-- Verify success
SELECT 'search_path migration completed' AS status, now() AS timestamp;
