-- ============================================================================
-- Migration: Fix Critical Schema Issues
-- Created: 2025-10-27
-- Purpose: Fix broken functions by adding missing columns and tables
-- Reference: DATABASE_CLEANUP_REPORT.md
-- ============================================================================

-- This migration addresses CRITICAL (P0) issues found by database linting:
-- 1. Missing columns in existing tables
-- 2. Missing feedback_posts table (pilot portal feedback system)
-- 3. Function signature updates for column name consistency

-- ============================================================================
-- PHASE 1: Add Missing Columns to Existing Tables
-- ============================================================================

-- Add approved_by to leave_requests
-- Purpose: Track who approved leave requests
-- Impact: Fixes approve_leave_request() function
ALTER TABLE leave_requests
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES pilots(id);

COMMENT ON COLUMN leave_requests.approved_by IS 'Pilot who approved this leave request (references pilots table)';

-- Add notes to leave_requests
-- Purpose: Store internal notes on leave requests
-- Impact: Fixes submit_leave_request_tx() function
ALTER TABLE leave_requests
ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN leave_requests.notes IS 'Internal notes about the leave request';

-- Add route_details to flight_requests
-- Purpose: Store flight route information as JSONB
-- Impact: Fixes submit_flight_request_tx() function
ALTER TABLE flight_requests
ADD COLUMN IF NOT EXISTS route_details JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN flight_requests.route_details IS 'Flight route details stored as JSON (departure, arrival, waypoints, etc.)';

-- Add completion_date to tasks
-- Purpose: Track when tasks were completed
-- Impact: Fixes complete_task() function and task completion statistics
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS completion_date TIMESTAMPTZ;

COMMENT ON COLUMN tasks.completion_date IS 'Timestamp when task was marked as completed';

-- Add display_order to feedback_categories
-- Purpose: Control category display order in UI
-- Impact: Enables proper category sorting in pilot portal
ALTER TABLE feedback_categories
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

COMMENT ON COLUMN feedback_categories.display_order IS 'Display order for feedback categories (lower numbers appear first)';

-- Create index on display_order for efficient sorting
CREATE INDEX IF NOT EXISTS idx_feedback_categories_display_order
ON feedback_categories(display_order ASC);

-- ============================================================================
-- PHASE 2: Create Missing Tables
-- ============================================================================

-- Create feedback_posts table
-- Purpose: Pilot portal feedback submission system
-- Impact: Fixes submit_feedback_post_tx(), get_pilot_dashboard_metrics(), etc.
CREATE TABLE IF NOT EXISTS feedback_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pilot_user_id UUID NOT NULL REFERENCES pilot_users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES feedback_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL CHECK (length(title) >= 3 AND length(title) <= 200),
  content TEXT NOT NULL CHECK (length(content) >= 10),
  is_anonymous BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'archived')),
  admin_response TEXT,
  upvotes INTEGER DEFAULT 0 CHECK (upvotes >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES pilot_users(id)
);

-- Create indexes for feedback_posts
CREATE INDEX IF NOT EXISTS idx_feedback_posts_pilot_user ON feedback_posts(pilot_user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_posts_category ON feedback_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_feedback_posts_status ON feedback_posts(status);
CREATE INDEX IF NOT EXISTS idx_feedback_posts_created ON feedback_posts(created_at DESC);

-- Enable RLS on feedback_posts
ALTER TABLE feedback_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feedback_posts
-- Users can view their own posts
CREATE POLICY "Users can view own feedback posts"
  ON feedback_posts FOR SELECT
  USING (
    (SELECT pilot_user_id FROM pilot_users WHERE id = auth.uid() LIMIT 1) = pilot_user_id
  );

-- Users can insert their own posts
CREATE POLICY "Users can create feedback posts"
  ON feedback_posts FOR INSERT
  WITH CHECK (
    (SELECT pilot_user_id FROM pilot_users WHERE id = auth.uid() LIMIT 1) = pilot_user_id
  );

-- Users can update their own posts (only if status is pending)
CREATE POLICY "Users can update own pending feedback posts"
  ON feedback_posts FOR UPDATE
  USING (
    (SELECT pilot_user_id FROM pilot_users WHERE id = auth.uid() LIMIT 1) = pilot_user_id
    AND status = 'pending'
  );

-- Users can view approved posts (public feed)
CREATE POLICY "Users can view approved feedback posts"
  ON feedback_posts FOR SELECT
  USING (status = 'approved');

-- Admins can view all posts (using service role or admin role)
-- This would be handled via service role key, not RLS

COMMENT ON TABLE feedback_posts IS 'Pilot portal feedback submissions with admin review workflow';

-- Create feedback_likes table (for upvoting posts)
CREATE TABLE IF NOT EXISTS feedback_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES feedback_posts(id) ON DELETE CASCADE,
  pilot_user_id UUID NOT NULL REFERENCES pilot_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Prevent duplicate votes
  CONSTRAINT feedback_likes_post_user_unique UNIQUE (post_id, pilot_user_id)
);

-- Create index for efficient vote counting
CREATE INDEX IF NOT EXISTS idx_feedback_likes_post ON feedback_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_feedback_likes_user ON feedback_likes(pilot_user_id);

-- Enable RLS on feedback_likes
ALTER TABLE feedback_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feedback_likes
CREATE POLICY "Users can view all likes"
  ON feedback_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can create likes"
  ON feedback_likes FOR INSERT
  WITH CHECK (
    (SELECT pilot_user_id FROM pilot_users WHERE id = auth.uid() LIMIT 1) = pilot_user_id
  );

CREATE POLICY "Users can delete own likes"
  ON feedback_likes FOR DELETE
  USING (
    (SELECT pilot_user_id FROM pilot_users WHERE id = auth.uid() LIMIT 1) = pilot_user_id
  );

COMMENT ON TABLE feedback_likes IS 'Tracks upvotes on feedback posts (prevents duplicate votes)';

-- Create feedback_comments table (for post discussions)
CREATE TABLE IF NOT EXISTS feedback_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES feedback_posts(id) ON DELETE CASCADE,
  pilot_user_id UUID NOT NULL REFERENCES pilot_users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES feedback_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 1000),
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for feedback_comments
CREATE INDEX IF NOT EXISTS idx_feedback_comments_post ON feedback_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_feedback_comments_user ON feedback_comments(pilot_user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_comments_parent ON feedback_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_feedback_comments_created ON feedback_comments(created_at ASC);

-- Enable RLS on feedback_comments
ALTER TABLE feedback_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feedback_comments
CREATE POLICY "Users can view comments on approved posts"
  ON feedback_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM feedback_posts
      WHERE feedback_posts.id = feedback_comments.post_id
      AND feedback_posts.status = 'approved'
    )
  );

CREATE POLICY "Users can view own comments"
  ON feedback_comments FOR SELECT
  USING (
    (SELECT pilot_user_id FROM pilot_users WHERE id = auth.uid() LIMIT 1) = pilot_user_id
  );

CREATE POLICY "Users can create comments"
  ON feedback_comments FOR INSERT
  WITH CHECK (
    (SELECT pilot_user_id FROM pilot_users WHERE id = auth.uid() LIMIT 1) = pilot_user_id
  );

CREATE POLICY "Users can update own comments"
  ON feedback_comments FOR UPDATE
  USING (
    (SELECT pilot_user_id FROM pilot_users WHERE id = auth.uid() LIMIT 1) = pilot_user_id
  );

CREATE POLICY "Users can delete own comments"
  ON feedback_comments FOR DELETE
  USING (
    (SELECT pilot_user_id FROM pilot_users WHERE id = auth.uid() LIMIT 1) = pilot_user_id
  );

COMMENT ON TABLE feedback_comments IS 'Comments and discussions on feedback posts with nested threading support';

-- ============================================================================
-- PHASE 3: Update Functions to Match Schema
-- ============================================================================

-- Drop and recreate functions with correct column references
-- This ensures functions use the new columns we just added

-- Update submit_feedback_post_tx to use new feedback_posts table
DROP FUNCTION IF EXISTS submit_feedback_post_tx(uuid, text, text, uuid, boolean, text, text);

CREATE OR REPLACE FUNCTION submit_feedback_post_tx(
  p_pilot_user_id UUID,
  p_title TEXT,
  p_content TEXT,
  p_category_id UUID DEFAULT NULL,
  p_is_anonymous BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_post_id UUID;
BEGIN
  -- Insert feedback post
  INSERT INTO feedback_posts (
    pilot_user_id,
    title,
    content,
    category_id,
    is_anonymous,
    status
  ) VALUES (
    p_pilot_user_id,
    p_title,
    p_content,
    p_category_id,
    p_is_anonymous,
    'pending'
  )
  RETURNING id INTO v_post_id;

  -- Create notification for admins (optional)
  -- This would notify admins of new feedback submission

  RETURN v_post_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to submit feedback post: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION submit_feedback_post_tx(uuid, text, text, uuid, boolean) IS
'Transaction function for submitting pilot portal feedback posts with validation';

-- Update approve_leave_request to use new approved_by column
-- Drop both overloaded versions
DROP FUNCTION IF EXISTS approve_leave_request(uuid, uuid, text);
DROP FUNCTION IF EXISTS approve_leave_request(uuid, uuid, text, text);

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
BEGIN
  -- Update leave request with approval
  UPDATE leave_requests
  SET
    status = 'APPROVED',
    reviewed_by = p_approved_by,
    approved_by = p_approved_by,  -- NEW: Use approved_by column
    reviewed_at = NOW(),
    review_notes = p_approval_notes,
    updated_at = NOW()
  WHERE id = p_request_id
  RETURNING true INTO v_updated;

  -- Create notification for pilot
  IF v_updated THEN
    PERFORM create_notification(
      (SELECT pilot_user_id FROM leave_requests WHERE id = p_request_id),
      'Leave Request Approved',
      'Your leave request has been approved.',
      jsonb_build_object('request_id', p_request_id)
    );
  END IF;

  RETURN COALESCE(v_updated, false);
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to approve leave request: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION approve_leave_request(uuid, uuid, text) IS
'Approves a leave request and records who approved it';

-- Update submit_leave_request_tx to use new notes column
DROP FUNCTION IF EXISTS submit_leave_request_tx(uuid, text, date, date, integer, text, text);

CREATE OR REPLACE FUNCTION submit_leave_request_tx(
  p_pilot_user_id UUID,
  p_request_type TEXT,
  p_start_date DATE,
  p_end_date DATE,
  p_days_count INTEGER,
  p_reason TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL  -- NEW: Added notes parameter
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request_id UUID;
  v_pilot_id UUID;
BEGIN
  -- Get pilot_id from pilot_user_id
  SELECT id INTO v_pilot_id
  FROM pilots
  WHERE user_id = p_pilot_user_id;

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
    notes,  -- NEW: Use notes column
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
    p_notes,  -- NEW: Use notes parameter
    'PENDING',
    'pilot',
    NOW()
  )
  RETURNING id INTO v_request_id;

  -- Create notification
  PERFORM create_notification(
    p_pilot_user_id,
    'Leave Request Submitted',
    'Your leave request has been submitted for review.',
    jsonb_build_object('request_id', v_request_id)
  );

  RETURN v_request_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to submit leave request: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION submit_leave_request_tx(uuid, text, date, date, integer, text, text) IS
'Transaction function for pilot portal leave request submissions with notes support';

-- Update submit_flight_request_tx to use new route_details column
DROP FUNCTION IF EXISTS submit_flight_request_tx(uuid, text, date, text, text);

CREATE OR REPLACE FUNCTION submit_flight_request_tx(
  p_pilot_user_id UUID,
  p_request_type TEXT,
  p_flight_date DATE,
  p_reason TEXT DEFAULT NULL,
  p_route_details JSONB DEFAULT '{}'::jsonb  -- NEW: Added route_details
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request_id UUID;
  v_pilot_id UUID;
BEGIN
  -- Get pilot_id from pilot_user_id
  SELECT id INTO v_pilot_id
  FROM pilots
  WHERE user_id = p_pilot_user_id;

  IF v_pilot_id IS NULL THEN
    RAISE EXCEPTION 'Pilot not found for user %', p_pilot_user_id;
  END IF;

  -- Insert flight request
  INSERT INTO flight_requests (
    pilot_id,
    pilot_user_id,
    request_type,
    flight_date,
    reason,
    route_details,  -- NEW: Use route_details column
    status,
    submission_type,
    created_at
  ) VALUES (
    v_pilot_id,
    p_pilot_user_id,
    p_request_type,
    p_flight_date,
    p_reason,
    p_route_details,  -- NEW: Use route_details parameter
    'PENDING',
    'pilot',
    NOW()
  )
  RETURNING id INTO v_request_id;

  RETURN v_request_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to submit flight request: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION submit_flight_request_tx(uuid, text, date, text, jsonb) IS
'Transaction function for pilot flight request submissions with route details support';

-- Update complete_task to use new completion_date column
DROP FUNCTION IF EXISTS complete_task(uuid, uuid);

CREATE OR REPLACE FUNCTION complete_task(
  p_task_id UUID,
  p_completed_by UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated BOOLEAN;
BEGIN
  -- Update task with completion
  UPDATE tasks
  SET
    status = 'COMPLETED',
    completion_date = NOW(),  -- NEW: Set completion_date
    updated_at = NOW()
  WHERE id = p_task_id
  RETURNING true INTO v_updated;

  RETURN COALESCE(v_updated, false);
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to complete task: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION complete_task(uuid, uuid) IS
'Marks a task as completed and records completion timestamp';

-- Fix create_notification to use pilot_user_id instead of user_id
DROP FUNCTION IF EXISTS create_notification(uuid, text, text, jsonb);

CREATE OR REPLACE FUNCTION create_notification(
  p_pilot_user_id UUID,  -- Changed from p_user_id
  p_title TEXT,
  p_message TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  -- Insert notification
  INSERT INTO notifications (
    pilot_user_id,  -- Use pilot_user_id column (not user_id)
    title,
    message,
    metadata,
    is_read,
    created_at
  ) VALUES (
    p_pilot_user_id,
    p_title,
    p_message,
    p_metadata,
    false,
    NOW()
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create notification: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION create_notification(uuid, text, text, jsonb) IS
'Creates a notification for a pilot user (uses pilot_user_id column)';

-- ============================================================================
-- PHASE 4: Add Triggers for Updated_At Timestamps
-- ============================================================================

-- Trigger for feedback_posts.updated_at
CREATE OR REPLACE FUNCTION update_feedback_posts_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_feedback_posts_updated_at ON feedback_posts;

CREATE TRIGGER trigger_update_feedback_posts_updated_at
  BEFORE UPDATE ON feedback_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_posts_updated_at();

-- Trigger for feedback_comments.updated_at
CREATE OR REPLACE FUNCTION update_feedback_comments_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_feedback_comments_updated_at ON feedback_comments;

CREATE TRIGGER trigger_update_feedback_comments_updated_at
  BEFORE UPDATE ON feedback_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_comments_updated_at();

-- ============================================================================
-- PHASE 5: Create Helper Functions for Feedback System
-- ============================================================================

-- Function to get pilot's feedback posts
CREATE OR REPLACE FUNCTION get_pilot_feedback_posts(
  p_pilot_user_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  category_name TEXT,
  status TEXT,
  upvotes INTEGER,
  comment_count BIGINT,
  is_anonymous BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    fp.id,
    fp.title,
    fp.content,
    fc.name AS category_name,
    fp.status,
    fp.upvotes,
    (SELECT COUNT(*) FROM feedback_comments WHERE post_id = fp.id) AS comment_count,
    fp.is_anonymous,
    fp.created_at,
    fp.updated_at
  FROM feedback_posts fp
  LEFT JOIN feedback_categories fc ON fp.category_id = fc.id
  WHERE fp.pilot_user_id = p_pilot_user_id
  ORDER BY fp.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

COMMENT ON FUNCTION get_pilot_feedback_posts(uuid, integer, integer) IS
'Retrieves feedback posts for a specific pilot with pagination';

-- Function to upvote a post
CREATE OR REPLACE FUNCTION upvote_feedback_post(
  p_post_id UUID,
  p_pilot_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_success BOOLEAN := false;
BEGIN
  -- Insert like (will fail if duplicate due to unique constraint)
  BEGIN
    INSERT INTO feedback_likes (post_id, pilot_user_id)
    VALUES (p_post_id, p_pilot_user_id);

    -- Increment upvote count
    UPDATE feedback_posts
    SET upvotes = upvotes + 1
    WHERE id = p_post_id;

    v_success := true;
  EXCEPTION
    WHEN unique_violation THEN
      -- User already liked this post
      v_success := false;
  END;

  RETURN v_success;
END;
$$;

COMMENT ON FUNCTION upvote_feedback_post(uuid, uuid) IS
'Upvotes a feedback post (prevents duplicate votes)';

-- Function to remove upvote
CREATE OR REPLACE FUNCTION remove_upvote_feedback_post(
  p_post_id UUID,
  p_pilot_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted BOOLEAN;
BEGIN
  -- Delete like
  DELETE FROM feedback_likes
  WHERE post_id = p_post_id AND pilot_user_id = p_pilot_user_id
  RETURNING true INTO v_deleted;

  -- Decrement upvote count if like was deleted
  IF v_deleted THEN
    UPDATE feedback_posts
    SET upvotes = GREATEST(upvotes - 1, 0)
    WHERE id = p_post_id;
  END IF;

  RETURN COALESCE(v_deleted, false);
END;
$$;

COMMENT ON FUNCTION remove_upvote_feedback_post(uuid, uuid) IS
'Removes upvote from a feedback post';

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Summary of changes:
--  Added 5 missing columns to existing tables
--  Created feedback_posts table with full workflow support
--  Created feedback_likes table for upvoting
--  Created feedback_comments table for discussions
--  Updated 5 critical functions to use new columns
--  Fixed create_notification to use pilot_user_id
--  Added RLS policies for security
--  Added triggers for updated_at columns
--  Added helper functions for feedback system

-- Run this after migration:
-- npm run db:types  -- Regenerate TypeScript types
