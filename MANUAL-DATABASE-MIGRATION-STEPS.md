# Manual Database Migration Steps

**IMPORTANT**: The Supabase CLI migration history is out of sync with the remote database. You need to manually run the migration SQL in the Supabase dashboard.

---

## Step 1: Open Supabase SQL Editor

Go to: https://supabase.com/dashboard/project/wgdmgvonqysflwdiiols/sql/new

---

## Step 2: Run This SQL (Copy and Paste)

```sql
-- ============================================
-- MIGRATION 1: Add user_id to pilots table
-- ============================================

-- Add user_id column
ALTER TABLE pilots
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_pilots_user_id ON pilots(user_id);

-- Add comment
COMMENT ON COLUMN pilots.user_id IS 'Links pilot record to Supabase Auth user for portal access';

-- ============================================
-- MIGRATION 2: Create notifications system
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
  END IF;
END$$;

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
-- VERIFICATION QUERIES
-- ============================================

-- Check user_id column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'pilots' AND column_name = 'user_id';

-- Check notifications table exists
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'notifications';
```

---

## Step 3: Verify Migration Success

After running the SQL, you should see:

✅ `user_id | uuid` in the pilots table
✅ `notifications` table created
✅ Indexes created
✅ RLS policies enabled

---

## Step 4: Link Test Pilot to User Account

Now you need to link the pilot `mrondeau@airniugini.com.pg` to their Supabase Auth account.

### 4.1 Get the User ID

1. Go to: https://supabase.com/dashboard/project/wgdmgvonqysflwdiiols/auth/users
2. Find the user with email `mrondeau@airniugini.com.pg`
3. Copy their User ID (it's a UUID like `123e4567-e89b-12d3-a456-426614174000`)

### 4.2 Link Pilot Record

Go back to SQL Editor and run:

```sql
-- Replace 'USER_ID_HERE' with the actual User ID from step 4.1
UPDATE pilots
SET user_id = 'USER_ID_HERE'
WHERE email = 'mrondeau@airniugini.com.pg'
   OR last_name ILIKE '%rondeau%';

-- Verify the update
SELECT id, first_name, last_name, user_id
FROM pilots
WHERE user_id = 'USER_ID_HERE';
```

---

## Step 5: Test the Workflow

Once the migration is complete and the pilot is linked:

1. Pilot logs in at http://localhost:3000/portal/login
   - Email: `mrondeau@airniugini.com.pg`
   - Password: `Lemakot@1972`

2. Pilot should now be able to:
   - View their dashboard
   - Submit leave requests
   - Submit flight requests
   - View their profile

3. Admin should be able to:
   - See pilot submissions in admin portal
   - Approve/reject requests
   - See notifications of new submissions

---

## Troubleshooting

### If pilot still can't log in:

Run this query to check auth user exists:

```sql
SELECT id, email, created_at
FROM auth.users
WHERE email = 'mrondeau@airniugini.com.pg';
```

### If pilot logs in but gets "Pilot account not found":

Run this query to check the link:

```sql
SELECT p.id, p.first_name, p.last_name, p.user_id, u.email
FROM pilots p
LEFT JOIN auth.users u ON p.user_id = u.id
WHERE u.email = 'mrondeau@airniugini.com.pg' OR p.email = 'mrondeau@airniugini.com.pg';
```

### If notifications don't appear:

Check RLS policies are enabled:

```sql
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'notifications';
```

---

## Next Steps After Migration

Once the database migration is complete and working:

1. I'll update the pilot portal API endpoints to use `user_id` lookups
2. I'll implement the notification service
3. I'll add notification bells to both portals
4. We'll test the complete workflow end-to-end

---

**Status**: ⚠️ Waiting for you to run the manual SQL migration in Supabase dashboard
