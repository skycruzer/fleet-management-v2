-- ============================================================================
-- COPY EVERYTHING BELOW THIS LINE AND PASTE INTO SUPABASE SQL EDITOR
-- URL: https://app.supabase.com/project/wgdmgvonqysflwdiiols/sql
-- ============================================================================

-- Create pilot_feedback table
-- Migration: 20251027_create_pilot_feedback_table
-- Description: Creates table for pilot feedback submissions

CREATE TABLE IF NOT EXISTS pilot_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pilot_id UUID NOT NULL REFERENCES pilots(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('operations', 'training', 'scheduling', 'safety', 'equipment', 'system', 'suggestion', 'other')),
  subject TEXT NOT NULL CHECK (char_length(subject) >= 5 AND char_length(subject) <= 200),
  message TEXT NOT NULL CHECK (char_length(message) >= 10 AND char_length(message) <= 5000),
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED')),
  admin_response TEXT CHECK (char_length(admin_response) <= 2000),
  responded_by UUID REFERENCES an_users(id),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pilot_feedback_pilot_id ON pilot_feedback(pilot_id);
CREATE INDEX IF NOT EXISTS idx_pilot_feedback_status ON pilot_feedback(status);
CREATE INDEX IF NOT EXISTS idx_pilot_feedback_category ON pilot_feedback(category);
CREATE INDEX IF NOT EXISTS idx_pilot_feedback_created_at ON pilot_feedback(created_at DESC);

-- Enable Row Level Security
ALTER TABLE pilot_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Pilots can view their own feedback
CREATE POLICY "Pilots can view own feedback"
  ON pilot_feedback
  FOR SELECT
  TO authenticated
  USING (
    pilot_id IN (
      SELECT id FROM pilots
      WHERE pilots.id = pilot_id
    )
  );

-- RLS Policy: Pilots can insert their own feedback
CREATE POLICY "Pilots can insert own feedback"
  ON pilot_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (
    pilot_id IN (
      SELECT id FROM pilots
      WHERE pilots.id = pilot_id
    )
  );

-- RLS Policy: Admins can view all feedback
CREATE POLICY "Admins can view all feedback"
  ON pilot_feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role = 'admin'
    )
  );

-- RLS Policy: Admins can update feedback (add responses, change status)
CREATE POLICY "Admins can update feedback"
  ON pilot_feedback
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role = 'admin'
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pilot_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pilot_feedback_updated_at
  BEFORE UPDATE ON pilot_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_pilot_feedback_updated_at();

-- Add comment to table
COMMENT ON TABLE pilot_feedback IS 'Stores pilot feedback submissions, suggestions, and issue reports';

-- Add comments to columns
COMMENT ON COLUMN pilot_feedback.category IS 'Feedback category: operations, training, scheduling, safety, equipment, system, suggestion, other';
COMMENT ON COLUMN pilot_feedback.is_anonymous IS 'Whether the feedback is submitted anonymously';
COMMENT ON COLUMN pilot_feedback.status IS 'Feedback status: PENDING, REVIEWED, RESOLVED, DISMISSED';
COMMENT ON COLUMN pilot_feedback.admin_response IS 'Admin response to the feedback';

-- ============================================================================
-- AFTER RUNNING THIS SQL, GO BACK TO YOUR TERMINAL AND RUN:
-- npm run db:types
-- npm test
-- ============================================================================
