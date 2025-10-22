/**
 * Migration: Enhance Existing Tables for Missing Core Features
 *
 * This migration enhances existing tables instead of creating new ones:
 * - Adds missing columns to pending_pilot_registrations
 * - Uses existing notifications table for pilot notifications
 * - Adds missing RLS policies and triggers
 *
 * @spec 001-missing-core-features
 * @date 2025-10-22
 */

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ENHANCE PENDING_PILOT_REGISTRATIONS TABLE
-- ============================================================================

-- Add missing columns to pending_pilot_registrations
ALTER TABLE pending_pilot_registrations
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'DENIED')),
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES an_users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS denial_reason TEXT;

-- Update existing rows to have status if NULL
UPDATE pending_pilot_registrations
SET status = 'PENDING'
WHERE status IS NULL;

-- Add NOT NULL constraint to status after setting default
ALTER TABLE pending_pilot_registrations
ALTER COLUMN status SET NOT NULL;

-- Make email unique if not already
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'pending_pilot_registrations_email_unique'
  ) THEN
    ALTER TABLE pending_pilot_registrations
    ADD CONSTRAINT pending_pilot_registrations_email_unique UNIQUE (email);
  END IF;
END $$;

-- Add index on status for filtering
CREATE INDEX IF NOT EXISTS idx_pilot_registrations_status
ON pending_pilot_registrations(status);

-- Add index on email for lookups
CREATE INDEX IF NOT EXISTS idx_pilot_registrations_email
ON pending_pilot_registrations(email);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_pilot_registrations_updated_at ON pending_pilot_registrations;
CREATE TRIGGER update_pilot_registrations_updated_at
  BEFORE UPDATE ON pending_pilot_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY - PILOT REGISTRATIONS
-- ============================================================================

-- Enable RLS
ALTER TABLE pending_pilot_registrations ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (public registration)
DROP POLICY IF EXISTS "Anyone can submit pilot registration" ON pending_pilot_registrations;
CREATE POLICY "Anyone can submit pilot registration"
  ON pending_pilot_registrations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Users can view their own registrations
DROP POLICY IF EXISTS "Users can view own registration" ON pending_pilot_registrations;
CREATE POLICY "Users can view own registration"
  ON pending_pilot_registrations
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Admins can view all registrations
DROP POLICY IF EXISTS "Admins can view all registrations" ON pending_pilot_registrations;
CREATE POLICY "Admins can view all registrations"
  ON pending_pilot_registrations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role = 'admin'
    )
  );

-- Policy: Admins can update registrations (approve/deny)
DROP POLICY IF EXISTS "Admins can update registrations" ON pending_pilot_registrations;
CREATE POLICY "Admins can update registrations"
  ON pending_pilot_registrations
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

-- Policy: Admins can delete registrations
DROP POLICY IF EXISTS "Admins can delete registrations" ON pending_pilot_registrations;
CREATE POLICY "Admins can delete registrations"
  ON pending_pilot_registrations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role = 'admin'
    )
  );

-- ============================================================================
-- ENHANCE NOTIFICATIONS TABLE
-- ============================================================================

-- Add index for pilot notifications (using recipient_id + recipient_type)
CREATE INDEX IF NOT EXISTS idx_notifications_recipient
ON notifications(recipient_id, recipient_type);

-- Add index for unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_unread
ON notifications(recipient_id, is_read)
WHERE is_read = false;

-- ============================================================================
-- ROW LEVEL SECURITY - NOTIFICATIONS
-- ============================================================================

-- Enable RLS if not already enabled
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());

-- Policy: System can create notifications
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System can create notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Users can update their own notifications (mark as read)
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- Policy: Users can delete their own notifications
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications"
  ON notifications
  FOR DELETE
  TO authenticated
  USING (recipient_id = auth.uid());

-- ============================================================================
-- AUDIT LOGGING TRIGGER
-- ============================================================================

-- Trigger for pilot registration changes
CREATE OR REPLACE FUNCTION log_pilot_registration_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    INSERT INTO audit_logs (
      table_name,
      record_id,
      action,
      old_data,
      new_data,
      user_id
    ) VALUES (
      'pending_pilot_registrations',
      NEW.id::text,
      'UPDATE',
      row_to_json(OLD),
      row_to_json(NEW),
      auth.uid()
    );
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_logs (
      table_name,
      record_id,
      action,
      new_data,
      user_id
    ) VALUES (
      'pending_pilot_registrations',
      NEW.id::text,
      'INSERT',
      row_to_json(NEW),
      auth.uid()
    );
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_logs (
      table_name,
      record_id,
      action,
      old_data,
      user_id
    ) VALUES (
      'pending_pilot_registrations',
      OLD.id::text,
      'DELETE',
      row_to_json(OLD),
      auth.uid()
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit trigger
DROP TRIGGER IF EXISTS audit_pilot_registrations ON pending_pilot_registrations;
CREATE TRIGGER audit_pilot_registrations
  AFTER INSERT OR UPDATE OR DELETE ON pending_pilot_registrations
  FOR EACH ROW
  EXECUTE FUNCTION log_pilot_registration_changes();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON TABLE pending_pilot_registrations IS 'Pilot registration requests requiring admin approval (enhanced for 001-missing-core-features)';
COMMENT ON TABLE notifications IS 'System-wide notifications including pilot notifications (enhanced for 001-missing-core-features)';
