-- ============================================================================
-- Migration: Fix Notification System
-- Created: 2025-10-27
-- Purpose: Fix broken create_notification() functions with wrong column references
-- Reference: SUPABASE_DATABASE_REVIEW.md - Critical Issue #2
-- ============================================================================

-- PROBLEM: Two versions of create_notification() exist with wrong column names
-- - One expects 'user_id' (doesn't exist)
-- - One expects 'pilot_user_id' (doesn't exist)
-- ACTUAL: notifications table uses 'recipient_id' column

-- ============================================================================
-- PHASE 1: Drop All Broken Versions of create_notification
-- ============================================================================

-- Drop all overloaded versions with wrong signatures
DROP FUNCTION IF EXISTS create_notification(uuid, text, text, text, text, jsonb);
DROP FUNCTION IF EXISTS create_notification(uuid, text, text, jsonb);
DROP FUNCTION IF EXISTS create_notification(uuid, text, text, text, jsonb);

-- ============================================================================
-- PHASE 2: Create Correct create_notification Function
-- ============================================================================

CREATE OR REPLACE FUNCTION create_notification(
  p_recipient_id UUID,
  p_type notification_type,
  p_title TEXT,
  p_message TEXT,
  p_link TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  -- Validate recipient exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_recipient_id) THEN
    RAISE EXCEPTION 'Recipient user % does not exist', p_recipient_id;
  END IF;

  -- Insert notification
  INSERT INTO notifications (
    recipient_id,
    type,
    title,
    message,
    link,
    read,
    created_at,
    updated_at
  ) VALUES (
    p_recipient_id,
    p_type,
    p_title,
    p_message,
    p_link,
    false,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create notification: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION create_notification(uuid, notification_type, text, text, text) IS
'Creates a notification for a user using correct recipient_id column';

-- ============================================================================
-- PHASE 3: Update Functions That Call create_notification
-- ============================================================================

-- Update approve_leave_request to use new create_notification signature
DROP FUNCTION IF EXISTS approve_leave_request(uuid, uuid, text);

CREATE OR REPLACE FUNCTION approve_leave_request(
  p_request_id UUID,
  p_approved_by UUID,
  p_approval_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated BOOLEAN;
  v_pilot_user_id UUID;
  v_recipient_auth_id UUID;
BEGIN
  -- Get pilot_user_id from the request
  SELECT pilot_user_id INTO v_pilot_user_id
  FROM leave_requests
  WHERE id = p_request_id;

  IF v_pilot_user_id IS NULL THEN
    RAISE EXCEPTION 'Leave request % not found or has no associated pilot user', p_request_id;
  END IF;

  -- Get the auth.users id for the pilot
  SELECT id INTO v_recipient_auth_id
  FROM pilot_users
  WHERE id = v_pilot_user_id;

  -- Update leave request with approval
  UPDATE leave_requests
  SET
    status = 'APPROVED',
    reviewed_by = p_approved_by,
    approved_by = p_approved_by,
    reviewed_at = NOW(),
    review_notes = p_approval_notes,
    updated_at = NOW()
  WHERE id = p_request_id
  RETURNING true INTO v_updated;

  -- Create notification using correct function signature
  IF v_updated AND v_recipient_auth_id IS NOT NULL THEN
    PERFORM create_notification(
      v_recipient_auth_id,
      'system'::notification_type,
      'Leave Request Approved',
      'Your leave request has been approved.',
      '/portal/leave-requests'
    );
  END IF;

  RETURN COALESCE(v_updated, false);
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to approve leave request: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION approve_leave_request(uuid, uuid, text) IS
'Approves a leave request and creates notification with correct recipient_id';

-- Update submit_leave_request_tx to use new create_notification signature
DROP FUNCTION IF EXISTS submit_leave_request_tx(uuid, text, date, date, integer, text, text);

CREATE OR REPLACE FUNCTION submit_leave_request_tx(
  p_pilot_user_id UUID,
  p_request_type TEXT,
  p_start_date DATE,
  p_end_date DATE,
  p_days_count INTEGER,
  p_reason TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request_id UUID;
  v_pilot_id UUID;
  v_recipient_auth_id UUID;
BEGIN
  -- Get pilot_id from pilot_user_id
  SELECT p.id, pu.id
  INTO v_pilot_id, v_recipient_auth_id
  FROM pilots p
  JOIN pilot_users pu ON p.user_id = pu.id
  WHERE pu.id = p_pilot_user_id;

  IF v_pilot_id IS NULL THEN
    RAISE EXCEPTION 'Pilot not found for user %', p_pilot_user_id;
  END IF;

  -- Insert leave request
  INSERT INTO leave_requests (
    pilot_id,
    pilot_user_id,
    request_type,
    start_date,
    end_date,
    days_count,
    reason,
    notes,
    status,
    submission_type,
    created_at
  ) VALUES (
    v_pilot_id,
    p_pilot_user_id,
    p_request_type,
    p_start_date,
    p_end_date,
    p_days_count,
    p_reason,
    p_notes,
    'PENDING',
    'pilot',
    NOW()
  )
  RETURNING id INTO v_request_id;

  -- Create notification using correct function signature
  IF v_recipient_auth_id IS NOT NULL THEN
    PERFORM create_notification(
      v_recipient_auth_id,
      'system'::notification_type,
      'Leave Request Submitted',
      'Your leave request has been submitted for review.',
      '/portal/leave-requests'
    );
  END IF;

  RETURN v_request_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to submit leave request: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION submit_leave_request_tx(uuid, text, date, date, integer, text, text) IS
'Transaction function for pilot leave request submissions with correct notification';

-- ============================================================================
-- PHASE 4: Create Helper Function for Pilot User to Auth User Mapping
-- ============================================================================

-- Helper function to get auth.users id from pilot_user_id
CREATE OR REPLACE FUNCTION get_auth_user_from_pilot_user(p_pilot_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_auth_user_id UUID;
BEGIN
  SELECT id INTO v_auth_user_id
  FROM pilot_users
  WHERE id = p_pilot_user_id;

  RETURN v_auth_user_id;
END;
$$;

COMMENT ON FUNCTION get_auth_user_from_pilot_user IS
'Helper function to map pilot_user_id to auth.users id for notifications';

-- ============================================================================
-- Migration Complete - Notification System Fixed
-- ============================================================================

-- Summary of changes:
--  Dropped 3 broken versions of create_notification()
--  Created correct create_notification(recipient_id, type, title, message, link)
--  Updated approve_leave_request() to use correct notification function
--  Updated submit_leave_request_tx() to use correct notification function
--  Created helper function for pilot_user to auth_user mapping

-- Notification system now uses correct 'recipient_id' column!
