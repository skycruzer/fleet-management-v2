# Fix Leave Bids Error - Simple Solution

**Error**: `relation "leave_bid_options" does not exist`

**Root Cause**: The `leave_bid_options` table was never created in the database.

**Solution**: Run the existing SQL script to create the table.

---

## ✅ Steps to Fix

### 1. Open Supabase SQL Editor
Go to: https://app.supabase.com/project/wgdmgvonqysflwdiiols/sql

### 2. Copy the SQL Script
Open the file: `CREATE-LEAVE-BID-OPTIONS-TABLE.sql` in your project

Or copy this:

```sql
-- Create leave_bid_options table
CREATE TABLE IF NOT EXISTS leave_bid_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id UUID NOT NULL REFERENCES leave_bids(id) ON DELETE CASCADE,
  priority INTEGER NOT NULL CHECK (priority BETWEEN 1 AND 5),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_leave_bid_options_bid_id
  ON leave_bid_options(bid_id);

CREATE INDEX IF NOT EXISTS idx_leave_bid_options_dates
  ON leave_bid_options(start_date, end_date);

-- Enable Row Level Security
ALTER TABLE leave_bid_options ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Pilots can view their own bid options
CREATE POLICY "Pilots can view their own bid options"
  ON leave_bid_options
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM leave_bids lb
      INNER JOIN pilots p ON lb.pilot_id = p.id
      WHERE lb.id = leave_bid_options.bid_id
      AND p.user_id = auth.uid()
    )
  );

-- RLS Policy: Pilots can insert options for their own bids
CREATE POLICY "Pilots can insert options for their own bids"
  ON leave_bid_options
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM leave_bids lb
      INNER JOIN pilots p ON lb.pilot_id = p.id
      WHERE lb.id = leave_bid_options.bid_id
      AND p.user_id = auth.uid()
    )
  );

-- RLS Policy: Pilots can update options for pending bids only
CREATE POLICY "Pilots can update options for pending bids"
  ON leave_bid_options
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM leave_bids lb
      INNER JOIN pilots p ON lb.pilot_id = p.id
      WHERE lb.id = leave_bid_options.bid_id
      AND p.user_id = auth.uid()
      AND lb.status = 'PENDING'
    )
  );

-- RLS Policy: Pilots can delete options for pending bids only
CREATE POLICY "Pilots can delete options for pending bids"
  ON leave_bid_options
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM leave_bids lb
      INNER JOIN pilots p ON lb.pilot_id = p.id
      WHERE lb.id = leave_bid_options.bid_id
      AND p.user_id = auth.uid()
      AND lb.status = 'PENDING'
    )
  );

-- RLS Policy: Admins can do everything
CREATE POLICY "Admins can manage all bid options"
  ON leave_bid_options
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role = 'admin'
    )
  );
```

### 3. Run the Script
Click "Run" in the Supabase SQL Editor

### 4. Verify Success
Run this verification query:

```sql
-- Check the table exists
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'leave_bid_options';

-- Should return 1 row showing the table exists
```

### 5. Update TypeScript Types
After the table is created, run:

```bash
npm run db:types
```

This will regenerate the TypeScript types to include the new table.

---

## 🧪 Test the Fix

After running the SQL:

1. Navigate to: `http://localhost:3000/dashboard/admin/leave-bids`
2. The page should load without errors
3. You should see leave bids with their options

---

## 📝 What This Creates

**Table**: `leave_bid_options`

**Schema**:
- `id` - UUID primary key
- `bid_id` - Foreign key to `leave_bids.id`
- `priority` - Integer (1-5, where 1 is highest priority)
- `start_date` - Date
- `end_date` - Date
- `created_at` - Timestamp
- `updated_at` - Timestamp

**Relationships**:
- Each leave bid can have 1-5 options (preferences)
- Options are ordered by priority
- Options are deleted when parent bid is deleted (CASCADE)

**Security**:
- RLS enabled
- Pilots can only see/edit their own bid options
- Pilots can only edit pending bids
- Admins can manage all bid options

---

## ✅ Expected Result

After running this SQL, the leave bids feature will work correctly:

- Pilots can submit leave bids with multiple date preferences
- Admins can view all bids with their options
- The foreign key relationship will exist
- No more PGRST200 errors

---

**Status**: Ready to run
**Last Updated**: October 28, 2025
