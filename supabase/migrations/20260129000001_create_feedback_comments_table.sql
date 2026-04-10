-- Migration: Create feedback_comments table for threaded conversations
-- Developer: Maurice Rondeau
-- Date: January 2026
--
-- Purpose: Enable Facebook-style threaded comments on pilot feedback
-- Both pilots and admins can comment, creating a conversation thread

-- Create the feedback_comments table
CREATE TABLE IF NOT EXISTS public.feedback_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES public.pilot_feedback(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_type VARCHAR(10) NOT NULL CHECK (user_type IN ('pilot', 'admin')),
  content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 2000),
  parent_comment_id UUID REFERENCES public.feedback_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comments describing the table
COMMENT ON TABLE public.feedback_comments IS 'Threaded comments on pilot feedback submissions';
COMMENT ON COLUMN public.feedback_comments.user_type IS 'Whether the comment author is a pilot or admin';
COMMENT ON COLUMN public.feedback_comments.parent_comment_id IS 'Reference to parent comment for threaded replies (null for top-level comments)';

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_feedback_comments_feedback_id
  ON public.feedback_comments(feedback_id);

CREATE INDEX IF NOT EXISTS idx_feedback_comments_parent_id
  ON public.feedback_comments(parent_comment_id)
  WHERE parent_comment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_feedback_comments_user_id
  ON public.feedback_comments(user_id);

CREATE INDEX IF NOT EXISTS idx_feedback_comments_created_at
  ON public.feedback_comments(created_at DESC);

-- Enable RLS
ALTER TABLE public.feedback_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Admins can read all comments
CREATE POLICY "admin_read_feedback_comments"
  ON public.feedback_comments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role = 'admin'
    )
  );

-- Pilots can read comments on their own feedback
CREATE POLICY "pilot_read_own_feedback_comments"
  ON public.feedback_comments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pilot_feedback pf
      JOIN public.an_users au ON au.pilot_id = pf.pilot_id
      WHERE pf.id = feedback_comments.feedback_id
      AND au.id = auth.uid()
    )
  );

-- Admins can insert comments
CREATE POLICY "admin_insert_feedback_comments"
  ON public.feedback_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_type = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role = 'admin'
    )
  );

-- Pilots can insert comments on their own feedback
CREATE POLICY "pilot_insert_own_feedback_comments"
  ON public.feedback_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_type = 'pilot'
    AND EXISTS (
      SELECT 1 FROM public.pilot_feedback pf
      JOIN public.an_users au ON au.pilot_id = pf.pilot_id
      WHERE pf.id = feedback_comments.feedback_id
      AND au.id = auth.uid()
    )
  );

-- Users can update their own comments (within 15 minutes)
CREATE POLICY "user_update_own_comments"
  ON public.feedback_comments
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND created_at > NOW() - INTERVAL '15 minutes'
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- Users can delete their own comments (within 15 minutes)
CREATE POLICY "user_delete_own_comments"
  ON public.feedback_comments
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND created_at > NOW() - INTERVAL '15 minutes'
  );

-- Admins can delete any comment
CREATE POLICY "admin_delete_any_comment"
  ON public.feedback_comments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role = 'admin'
    )
  );

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedback_comments TO authenticated;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_feedback_comments_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_feedback_comments_updated_at
  BEFORE UPDATE ON public.feedback_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_feedback_comments_updated_at();
