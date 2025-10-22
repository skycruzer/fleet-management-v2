/**
 * Migration: Enhance pilot_users and notifications for Missing Core Features
 *
 * This migration enhances existing tables:
 * - Adds missing columns to pilot_users (date_of_birth, phone_number, address, denial_reason)
 * - Adds RLS policies to pilot_users and notifications
 * - Adds audit logging triggers
 * - Adds performance indexes
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
-- ENHANCE PILOT_USERS TABLE
-- ============================================================================

-- Add missing columns to pilot_users
ALTER TABLE pilot_users
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS denial_reason TEXT;

-- Add index on registration_approved for filtering
CREATE INDEX IF NOT EXISTS idx_pilot_users_registration_approved
ON pilot_users(registration_approved)
WHERE registration_approved = false;

-- Add index on email for lookups
CREATE INDEX IF NOT EXISTS idx_pilot_users_email
ON pilot_users(email);

-- Add trigger for updated_at if not exists
DROP TRIGGER IF EXISTS update_pilot_users_updated_at ON pilot_users;
CREATE TRIGGER update_pilot_users_updated_at
  BEFORE UPDATE ON pilot_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY - PILOT_USERS
-- ============================================================================

-- Enable RLS
ALTER TABLE pilot_users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own registration
DROP POLICY IF EXISTS "Users can view own registration" ON pilot_users;
CREATE POLICY "Users can view own registration"
  ON pilot_users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Policy: Admins can view all pilot users
DROP POLICY IF EXISTS "Admins can view all pilot users" ON pilot_users;
CREATE POLICY "Admins can view all pilot users"
  ON pilot_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role = 'admin'
    )
  );

-- Policy: Anyone can insert (public registration)
DROP POLICY IF EXISTS "Anyone can submit pilot registration" ON pilot_users;
CREATE POLICY "Anyone can submit pilot registration"
  ON pilot_users
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Policy: Admins can update pilot users (approve/deny)
DROP POLICY IF EXISTS "Admins can update pilot users" ON pilot_users;
CREATE POLICY "Admins can update pilot users"
  ON pilot_users
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

-- Policy: Users can update their own profile (after approval)
DROP POLICY IF EXISTS "Users can update own profile" ON pilot_users;
CREATE POLICY "Users can update own profile"
  ON pilot_users
  FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid() AND registration_approved = true
  )
  WITH CHECK (
    id = auth.uid() AND registration_approved = true
  );

-- Policy: Admins can delete pilot users
DROP POLICY IF EXISTS "Admins can delete pilot users" ON pilot_users;
CREATE POLICY "Admins can delete pilot users"
  ON pilot_users
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

-- Add index for created_at (for chronological sorting)
CREATE INDEX IF NOT EXISTS idx_notifications_created_at
ON notifications(created_at DESC);

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

-- Policy: System can create notifications for any user
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

-- Trigger for pilot_users changes
CREATE OR REPLACE FUNCTION log_pilot_users_changes()
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
      'pilot_users',
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
      'pilot_users',
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
      'pilot_users',
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
DROP TRIGGER IF EXISTS audit_pilot_users ON pilot_users;
CREATE TRIGGER audit_pilot_users
  AFTER INSERT OR UPDATE OR DELETE ON pilot_users
  FOR EACH ROW
  EXECUTE FUNCTION log_pilot_users_changes();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON TABLE pilot_users IS 'Pilot user accounts with registration approval workflow (enhanced for 001-missing-core-features)';
COMMENT ON TABLE notifications IS 'System-wide notifications including pilot notifications (enhanced for 001-missing-core-features)';
COMMENT ON COLUMN pilot_users.date_of_birth IS 'Pilot date of birth for age verification';
COMMENT ON COLUMN pilot_users.phone_number IS 'Contact phone number';
COMMENT ON COLUMN pilot_users.address IS 'Residential address';
COMMENT ON COLUMN pilot_users.denial_reason IS 'Reason for registration denial (if applicable)';
