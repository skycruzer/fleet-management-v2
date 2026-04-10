-- ============================================
-- FLEET MANAGEMENT V2 - PILOT PORTAL SETUP
-- ============================================
-- Run this entire script in the Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/wgdmgvonqysflwdiiols/sql/new
--
-- This script:
-- 1. Adds user_id column to pilots table
-- 2. Creates notifications system
-- 3. Links the test pilot account
-- ============================================

-- ============================================
-- STEP 1: Add user_id to pilots table
-- ============================================
DO $$
BEGIN
  -- Add user_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pilots' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE pilots ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    RAISE NOTICE '✅ Added user_id column to pilots table';
  ELSE
    RAISE NOTICE '⚠️  user_id column already exists in pilots table';
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pilots_user_id ON pilots(user_id);

-- Add comment to explain the column
COMMENT ON COLUMN pilots.user_id IS 'Links pilot record to Supabase Auth user for portal access';

-- ============================================
-- STEP 2: Create notifications system
-- ============================================

-- Create notification type enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    CREATE TYPE notification_type AS ENUM (
      'leave_request_submitted',
      'leave_request_approved',
      'leave_request_rejected',
      'leave_request_pending_review',
      'leave_bid_submitted',
      'leave_bid_approved',
      'leave_bid_rejected',
      'flight_request_submitted',
      'flight_request_approved',
      'flight_request_rejected'
    );
    RAISE NOTICE '✅ Created notification_type enum';
  ELSE
    RAISE NOTICE '⚠️  notification_type enum already exists';
  END IF;
END $$;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(recipient_id, read) WHERE read = FALSE;

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

-- Create RLS policies
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid() = recipient_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  USING (auth.uid() = recipient_id);

-- ============================================
-- STEP 3: Link test pilot to user account
-- ============================================

-- Find and link Maurice Rondeau's pilot record to his auth user
-- This query will find the auth.users record with email mrondeau@airniugini.com.pg
-- and link it to the pilot record

DO $$
DECLARE
  v_user_id UUID;
  v_pilot_id UUID;
BEGIN
  -- Find the auth user by email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'mrondeau@airniugini.com.pg'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE '❌ Could not find auth user with email mrondeau@airniugini.com.pg';
    RAISE NOTICE 'Please verify the user exists in the Supabase Auth dashboard';
  ELSE
    RAISE NOTICE '✅ Found auth user: % (ID: %)', 'mrondeau@airniugini.com.pg', v_user_id;

    -- Find the pilot record by last name (pilots table doesn't have email column)
    SELECT id INTO v_pilot_id
    FROM pilots
    WHERE last_name ILIKE '%rondeau%'
    LIMIT 1;

    IF v_pilot_id IS NULL THEN
      RAISE NOTICE '❌ Could not find pilot record with last name matching "rondeau"';
      RAISE NOTICE 'Please manually update the pilot record with user_id';
      RAISE NOTICE 'Run: UPDATE pilots SET user_id = ''%'' WHERE <your_condition>;', v_user_id;
    ELSE
      -- Link the pilot to the user
      UPDATE pilots
      SET user_id = v_user_id
      WHERE id = v_pilot_id;

      RAISE NOTICE '✅ Linked pilot record (ID: %) to user (ID: %)', v_pilot_id, v_user_id;

      -- Show the linked pilot info
      RAISE NOTICE 'Pilot: % %',
        (SELECT first_name FROM pilots WHERE id = v_pilot_id),
        (SELECT last_name FROM pilots WHERE id = v_pilot_id);
    END IF;
  END IF;
END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify user_id column exists
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'pilots' AND column_name = 'user_id';

-- Verify notifications table exists
SELECT
  table_name,
  (SELECT COUNT(*) FROM notifications) AS notification_count
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'notifications';

-- Verify pilot-user link
SELECT
  p.id AS pilot_id,
  p.first_name,
  p.last_name,
  p.role,  -- Pilot role (Captain/First Officer)
  p.user_id,
  u.email
FROM pilots p
LEFT JOIN auth.users u ON p.user_id = u.id
WHERE p.user_id IS NOT NULL OR u.email = 'mrondeau@airniugini.com.pg'
LIMIT 10;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ MIGRATION COMPLETE!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Test pilot login at http://localhost:3000/portal/login';
  RAISE NOTICE '   Email: mrondeau@airniugini.com.pg';
  RAISE NOTICE '   Password: Lemakot@1972';
  RAISE NOTICE '';
  RAISE NOTICE '2. Pilot should now be able to:';
  RAISE NOTICE '   - View their dashboard';
  RAISE NOTICE '   - Submit leave requests';
  RAISE NOTICE '   - Submit flight requests';
  RAISE NOTICE '   - View their profile';
  RAISE NOTICE '';
  RAISE NOTICE '3. Admin can review submissions at:';
  RAISE NOTICE '   http://localhost:3000/dashboard/admin/leave-bids';
  RAISE NOTICE '';
END $$;
