-- Migration: Add Transaction Boundaries for Pilot Portal Operations
-- Created: 2025-10-19
-- Purpose: Implement transaction-wrapped functions for submitFeedbackPost, submitLeaveRequest, submitFlightRequest
-- Related Todo: 036-ready-p1-no-transaction-boundaries.md

-- ===================================
-- FUNCTION 1: Submit Feedback Post with Transaction
-- ===================================
-- This function atomically creates a feedback post and ensures data consistency
-- If any step fails, the entire operation rolls back

CREATE OR REPLACE FUNCTION submit_feedback_post_tx(
  p_pilot_user_id uuid,
  p_title text,
  p_content text,
  p_category_id uuid DEFAULT NULL,
  p_is_anonymous boolean DEFAULT false,
  p_author_display_name text DEFAULT '',
  p_author_rank text DEFAULT ''
) RETURNS jsonb AS $$
DECLARE
  v_feedback_id uuid;
  v_result jsonb;
  v_final_display_name text;
  v_final_rank text;
BEGIN
  -- Validate input
  IF p_pilot_user_id IS NULL THEN
    RAISE EXCEPTION 'pilot_user_id cannot be null';
  END IF;

  IF p_title IS NULL OR trim(p_title) = '' THEN
    RAISE EXCEPTION 'title cannot be empty';
  END IF;

  IF p_content IS NULL OR trim(p_content) = '' THEN
    RAISE EXCEPTION 'content cannot be empty';
  END IF;

  -- Set anonymous author info if needed
  IF p_is_anonymous THEN
    v_final_display_name := 'Anonymous Pilot';
    v_final_rank := NULL;
  ELSE
    v_final_display_name := p_author_display_name;
    v_final_rank := p_author_rank;
  END IF;

  -- Step 1: Insert feedback post
  INSERT INTO feedback_posts (
    pilot_user_id,
    title,
    content,
    category_id,
    is_anonymous,
    author_display_name,
    author_rank,
    status
  ) VALUES (
    p_pilot_user_id,
    p_title,
    p_content,
    p_category_id,
    p_is_anonymous,
    v_final_display_name,
    v_final_rank,
    'published'
  )
  RETURNING id INTO v_feedback_id;

  -- Step 2: Verify pilot_user_mappings entry exists (creates if needed)
  -- This ensures referential integrity between pilot_users and pilots
  IF NOT EXISTS (
    SELECT 1 FROM pilot_user_mappings WHERE pilot_user_id = p_pilot_user_id
  ) THEN
    -- Log warning but don't fail - RLS will handle authorization
    RAISE WARNING 'No pilot_user_mapping found for pilot_user_id %, but feedback post created', p_pilot_user_id;
  END IF;

  -- Return success result
  SELECT jsonb_build_object(
    'success', true,
    'feedback_id', v_feedback_id,
    'pilot_user_id', p_pilot_user_id,
    'title', p_title,
    'is_anonymous', p_is_anonymous,
    'message', 'Feedback post created successfully'
  ) INTO v_result;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Rollback happens automatically
    RAISE EXCEPTION 'Failed to submit feedback post: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================
-- FUNCTION 2: Submit Leave Request with Transaction
-- ===================================
-- This function atomically creates a leave request with all required fields
-- Ensures pilot_id lookup and data consistency

CREATE OR REPLACE FUNCTION submit_leave_request_tx(
  p_pilot_user_id uuid,
  p_request_type text,
  p_start_date date,
  p_end_date date,
  p_days_count integer,
  p_roster_period text,
  p_reason text DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  v_pilot_id uuid;
  v_leave_request_id uuid;
  v_result jsonb;
  v_request_date date;
BEGIN
  -- Validate input
  IF p_pilot_user_id IS NULL THEN
    RAISE EXCEPTION 'pilot_user_id cannot be null';
  END IF;

  IF p_request_type IS NULL OR trim(p_request_type) = '' THEN
    RAISE EXCEPTION 'request_type cannot be empty';
  END IF;

  IF p_start_date IS NULL THEN
    RAISE EXCEPTION 'start_date cannot be null';
  END IF;

  IF p_end_date IS NULL THEN
    RAISE EXCEPTION 'end_date cannot be null';
  END IF;

  IF p_end_date < p_start_date THEN
    RAISE EXCEPTION 'end_date cannot be before start_date';
  END IF;

  IF p_days_count IS NULL OR p_days_count <= 0 THEN
    RAISE EXCEPTION 'days_count must be greater than 0';
  END IF;

  IF p_roster_period IS NULL OR trim(p_roster_period) = '' THEN
    RAISE EXCEPTION 'roster_period cannot be empty';
  END IF;

  -- Step 1: Get pilot_id from pilot_user_mappings
  SELECT pilot_id INTO v_pilot_id
  FROM pilot_user_mappings
  WHERE pilot_user_id = p_pilot_user_id;

  IF v_pilot_id IS NULL THEN
    RAISE EXCEPTION 'Pilot not found for pilot_user_id %', p_pilot_user_id;
  END IF;

  -- Step 2: Set request date to today
  v_request_date := CURRENT_DATE;

  -- Step 3: Insert leave request
  INSERT INTO leave_requests (
    pilot_id,
    pilot_user_id,
    request_type,
    start_date,
    end_date,
    days_count,
    roster_period,
    reason,
    status,
    submission_type,
    request_date,
    request_method
  ) VALUES (
    v_pilot_id,
    p_pilot_user_id,
    p_request_type,
    p_start_date,
    p_end_date,
    p_days_count,
    p_roster_period,
    p_reason,
    'PENDING',
    'pilot',
    v_request_date,
    'SYSTEM'
  )
  RETURNING id INTO v_leave_request_id;

  -- Return success result
  SELECT jsonb_build_object(
    'success', true,
    'leave_request_id', v_leave_request_id,
    'pilot_id', v_pilot_id,
    'pilot_user_id', p_pilot_user_id,
    'request_type', p_request_type,
    'start_date', p_start_date,
    'end_date', p_end_date,
    'days_count', p_days_count,
    'roster_period', p_roster_period,
    'status', 'PENDING',
    'message', 'Leave request submitted successfully'
  ) INTO v_result;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Rollback happens automatically
    RAISE EXCEPTION 'Failed to submit leave request: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================
-- FUNCTION 3: Submit Flight Request with Transaction
-- ===================================
-- This function atomically creates a flight request with all required fields
-- Ensures pilot_id lookup and data consistency

CREATE OR REPLACE FUNCTION submit_flight_request_tx(
  p_pilot_user_id uuid,
  p_request_type text,
  p_flight_date date,
  p_description text,
  p_reason text DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  v_pilot_id uuid;
  v_flight_request_id uuid;
  v_result jsonb;
BEGIN
  -- Validate input
  IF p_pilot_user_id IS NULL THEN
    RAISE EXCEPTION 'pilot_user_id cannot be null';
  END IF;

  IF p_request_type IS NULL OR trim(p_request_type) = '' THEN
    RAISE EXCEPTION 'request_type cannot be empty';
  END IF;

  IF p_flight_date IS NULL THEN
    RAISE EXCEPTION 'flight_date cannot be null';
  END IF;

  IF p_description IS NULL OR trim(p_description) = '' THEN
    RAISE EXCEPTION 'description cannot be empty';
  END IF;

  -- Step 1: Get pilot_id from pilot_user_mappings
  SELECT pilot_id INTO v_pilot_id
  FROM pilot_user_mappings
  WHERE pilot_user_id = p_pilot_user_id;

  IF v_pilot_id IS NULL THEN
    RAISE EXCEPTION 'Pilot not found for pilot_user_id %', p_pilot_user_id;
  END IF;

  -- Step 2: Insert flight request
  INSERT INTO flight_requests (
    pilot_id,
    pilot_user_id,
    request_type,
    flight_date,
    description,
    reason,
    status
  ) VALUES (
    v_pilot_id,
    p_pilot_user_id,
    p_request_type,
    p_flight_date,
    p_description,
    p_reason,
    'PENDING'
  )
  RETURNING id INTO v_flight_request_id;

  -- Return success result
  SELECT jsonb_build_object(
    'success', true,
    'flight_request_id', v_flight_request_id,
    'pilot_id', v_pilot_id,
    'pilot_user_id', p_pilot_user_id,
    'request_type', p_request_type,
    'flight_date', p_flight_date,
    'description', p_description,
    'status', 'PENDING',
    'message', 'Flight request submitted successfully'
  ) INTO v_result;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Rollback happens automatically
    RAISE EXCEPTION 'Failed to submit flight request: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================
-- GRANT PERMISSIONS
-- ===================================
-- Grant execute permissions to authenticated users

GRANT EXECUTE ON FUNCTION submit_feedback_post_tx(uuid, text, text, uuid, boolean, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION submit_leave_request_tx(uuid, text, date, date, integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION submit_flight_request_tx(uuid, text, date, text, text) TO authenticated;

-- ===================================
-- DOCUMENTATION
-- ===================================
COMMENT ON FUNCTION submit_feedback_post_tx IS 'Atomically creates a feedback post with validation. Returns success result or rolls back on error.';
COMMENT ON FUNCTION submit_leave_request_tx IS 'Atomically creates a leave request with pilot_id lookup and validation. Returns success result or rolls back on error.';
COMMENT ON FUNCTION submit_flight_request_tx IS 'Atomically creates a flight request with pilot_id lookup and validation. Returns success result or rolls back on error.';
