# Database Migrations Application Guide

**Date**: November 4, 2025
**Purpose**: Apply Phase 2C security database migrations
**Status**: Ready to Apply

---

## Overview

This guide walks through applying two critical database migrations for Phase 2C security features:

1. **Account Lockout Tables** - Brute force protection
2. **Password History Table** - Password reuse prevention

---

## Prerequisites

Before applying migrations:

- ✅ Supabase project access: `wgdmgvonqysflwdiiols`
- ✅ Database credentials configured
- ✅ SQL Editor access in Supabase Dashboard
- ✅ Backup of current database (recommended)

---

## Migration 1: Account Lockout Tables

**File**: `supabase/migrations/20251104_account_lockout_tables.sql`

### What This Migration Creates

**Tables**:
1. `failed_login_attempts` - Tracks every failed login attempt
2. `account_lockouts` - Records account lockouts and unlocks

**Indexes**:
- `idx_failed_attempts_email` - Fast email lookups
- `idx_failed_attempts_timestamp` - Time-based queries
- `idx_lockouts_email` - Lockout status checks
- `idx_lockouts_locked_until` - Active lockout queries

**Functions**:
- `is_account_locked(email)` - Check if account is locked
- `get_lockout_expiry(email)` - Get lockout expiry time
- `cleanup_old_failed_attempts()` - Remove attempts >24h old
- `cleanup_expired_lockouts()` - Remove lockouts >7d old

**RLS Policies**:
- Admin-only access to both tables
- Service role can insert/delete for automation

### How to Apply

**Option 1: Supabase Dashboard (Recommended)**

1. Open Supabase Dashboard:
   ```
   https://app.supabase.com/project/wgdmgvonqysflwdiiols/sql
   ```

2. Click "New Query"

3. Copy the entire contents of:
   ```
   supabase/migrations/20251104_account_lockout_tables.sql
   ```

4. Paste into SQL Editor

5. Click "Run" or press Cmd/Ctrl + Enter

6. Verify success messages:
   ```
   ✅ Table "failed_login_attempts" created successfully
   ✅ Table "account_lockouts" created successfully
   ✅ Account lockout protection migration completed successfully
   ```

**Option 2: Supabase CLI**

```bash
# Navigate to project root
cd /Users/skycruzer/Desktop/fleet-management-v2

# Apply migration
supabase db push
```

### Verification

Run this query in SQL Editor to verify tables exist:

```sql
-- Check tables exist
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_name IN ('failed_login_attempts', 'account_lockouts');

-- Expected: 2 rows returned
```

**Check RLS is enabled**:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('failed_login_attempts', 'account_lockouts');

-- Expected: Both should have rowsecurity = true
```

**Check functions exist**:

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_name IN (
  'is_account_locked',
  'get_lockout_expiry',
  'cleanup_old_failed_attempts',
  'cleanup_expired_lockouts'
);

-- Expected: 4 rows returned
```

---

## Migration 2: Password History Table

**File**: `supabase/migrations/20251104_password_history_table.sql`

### What This Migration Creates

**Tables**:
1. `password_history` - Stores last 5 password hashes per user
2. `password_policies` - Global password policy configuration

**Indexes**:
- `idx_password_history_user_id` - User lookup
- `idx_password_history_created_at` - Time-based queries
- `idx_password_history_user_created` - Combined user+time

**Functions**:
- `get_password_history_count(user_id)` - Get history count
- `cleanup_password_history(user_id)` - Keep only last 5
- `get_password_age_days(user_id)` - Get password age

**Triggers**:
- `auto_cleanup_password_history` - Auto-cleanup on insert

**RLS Policies**:
- Users can view their own history
- Admins can view all history
- System can insert/delete for automation

### How to Apply

**Option 1: Supabase Dashboard (Recommended)**

1. Open Supabase Dashboard:
   ```
   https://app.supabase.com/project/wgdmgvonqysflwdiiols/sql
   ```

2. Click "New Query"

3. Copy the entire contents of:
   ```
   supabase/migrations/20251104_password_history_table.sql
   ```

4. Paste into SQL Editor

5. Click "Run" or press Cmd/Ctrl + Enter

6. Verify success messages:
   ```
   ✅ Table "password_history" created successfully
   ✅ Table "password_policies" created successfully
   ✅ Password history migration completed successfully
   ```

**Option 2: Supabase CLI**

```bash
# Apply migration
supabase db push
```

### Verification

Run this query to verify tables exist:

```sql
-- Check tables exist
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_name IN ('password_history', 'password_policies');

-- Expected: 2 rows returned
```

**Check default policy exists**:

```sql
SELECT * FROM password_policies;

-- Expected: 1 row with default settings
```

**Check trigger exists**:

```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'auto_cleanup_password_history';

-- Expected: 1 row returned
```

---

## Post-Migration Testing

### Test Account Lockout

1. **Verify table access**:
```sql
SELECT COUNT(*) FROM failed_login_attempts;
SELECT COUNT(*) FROM account_lockouts;
-- Should return 0 for both (empty tables)
```

2. **Test helper function**:
```sql
SELECT is_account_locked('test@example.com');
-- Should return false
```

### Test Password History

1. **Verify table access**:
```sql
SELECT COUNT(*) FROM password_history;
-- Should return 0 (empty table)
```

2. **Check default policy**:
```sql
SELECT min_length, require_uppercase, require_lowercase
FROM password_policies
LIMIT 1;
-- Should return: 12, true, true
```

---

## Rollback (If Needed)

If you need to rollback the migrations:

### Rollback Account Lockout Migration

```sql
-- Drop tables (cascade removes dependencies)
DROP TABLE IF EXISTS account_lockouts CASCADE;
DROP TABLE IF EXISTS failed_login_attempts CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS is_account_locked(VARCHAR);
DROP FUNCTION IF EXISTS get_lockout_expiry(VARCHAR);
DROP FUNCTION IF EXISTS cleanup_old_failed_attempts();
DROP FUNCTION IF EXISTS cleanup_expired_lockouts();
```

### Rollback Password History Migration

```sql
-- Drop trigger first
DROP TRIGGER IF EXISTS auto_cleanup_password_history ON password_history;

-- Drop trigger function
DROP FUNCTION IF EXISTS trigger_cleanup_password_history();

-- Drop tables
DROP TABLE IF EXISTS password_history CASCADE;
DROP TABLE IF EXISTS password_policies CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS get_password_history_count(UUID);
DROP FUNCTION IF EXISTS cleanup_password_history(UUID);
DROP FUNCTION IF EXISTS get_password_age_days(UUID);
```

---

## Troubleshooting

### Issue: "Permission denied for table"

**Cause**: RLS is blocking access
**Solution**: Check that you're using admin account or service role

### Issue: "Relation already exists"

**Cause**: Migration was partially applied before
**Solution**: Either:
1. Drop existing tables and re-run, OR
2. Skip the CREATE TABLE commands (already exist)

### Issue: "Function does not exist"

**Cause**: Function creation failed
**Solution**: Re-run just the function creation sections

### Issue: "Trigger does not exist"

**Cause**: Trigger creation failed
**Solution**: Ensure trigger function exists first, then create trigger

---

## Maintenance

### Cleanup Old Data

**Run weekly** (automatic via cron job recommended):

```sql
-- Cleanup old failed attempts (>24 hours)
SELECT cleanup_old_failed_attempts();

-- Cleanup expired lockouts (>7 days)
SELECT cleanup_expired_lockouts();
```

### Monitor Lockout Activity

```sql
-- View recent failed attempts
SELECT email, attempted_at, ip_address
FROM failed_login_attempts
ORDER BY attempted_at DESC
LIMIT 20;

-- View active lockouts
SELECT email, locked_at, locked_until, failed_attempts
FROM account_lockouts
WHERE locked_until > NOW()
ORDER BY locked_at DESC;

-- View lockout statistics
SELECT
  COUNT(*) as total_lockouts,
  COUNT(*) FILTER (WHERE locked_until > NOW()) as active_lockouts,
  AVG(failed_attempts) as avg_attempts
FROM account_lockouts;
```

---

## Next Steps After Migration

1. ✅ Verify migrations applied successfully
2. ⏳ Integrate account lockout into login endpoints
3. ⏳ Integrate password validation into auth flows
4. ⏳ Test end-to-end lockout flow
5. ⏳ Test password validation with history

---

**Guide Version**: 1.0.0
**Last Updated**: November 4, 2025
**Author**: Maurice Rondeau

**Status**: Ready to apply migrations
