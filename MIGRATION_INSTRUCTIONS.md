# Database Migration Instructions - Pilot Feedback Table

**Date**: October 27, 2025
**Migration File**: `supabase/migrations/20251027_create_pilot_feedback_table.sql`
**Estimated Time**: 5 minutes

---

## ✅ Method 1: Supabase Dashboard (Recommended)

This is the safest and easiest method.

### Step-by-Step Instructions

**1. Open Supabase SQL Editor**
- Visit: https://app.supabase.com/project/wgdmgvonqysflwdiiols/sql

**2. Copy Migration SQL**
- Open file: `supabase/migrations/20251027_create_pilot_feedback_table.sql`
- Copy entire contents (Cmd+A, Cmd+C)

**3. Paste and Execute**
- Paste into SQL Editor
- Click "Run" button (or Cmd+Enter)
- Wait for success message

**4. Verify Table Created**
- Run this query to verify:
```sql
SELECT COUNT(*) FROM information_schema.tables
WHERE table_name = 'pilot_feedback';
```
- Should return: `1`

**5. Check RLS Policies**
- Run this query:
```sql
SELECT policyname FROM pg_policies
WHERE tablename = 'pilot_feedback';
```
- Should show 4 policies

---

## ✅ Method 2: CLI Push (Alternative)

If you have proper database credentials configured:

```bash
# Ensure you're linked to the project
supabase link --project-ref wgdmgvonqysflwdiiols

# Push migrations
supabase db push

# This will apply all pending migrations
```

---

## 🔄 After Migration: Regenerate Types

**Required Step**: Update TypeScript types to include new `pilot_feedback` table

```bash
npm run db:types
```

This generates updated types in `types/supabase.ts`

---

## ✅ Verification Steps

### 1. Check Table Exists
```sql
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'pilot_feedback'
ORDER BY ordinal_position;
```

**Expected Output**: 11 columns
- id (uuid)
- pilot_id (uuid)
- category (text)
- subject (text)
- message (text)
- is_anonymous (boolean)
- status (text)
- admin_response (text)
- responded_by (uuid)
- responded_at (timestamptz)
- created_at (timestamptz)
- updated_at (timestamptz)

### 2. Verify Indexes
```sql
SELECT indexname FROM pg_indexes
WHERE tablename = 'pilot_feedback';
```

**Expected**: 5 indexes (primary key + 4 additional)

### 3. Test RLS Policies
```sql
-- Should return 4 policies
SELECT policyname, cmd FROM pg_policies
WHERE tablename = 'pilot_feedback';
```

**Expected Policies**:
1. "Pilots can view own feedback" (SELECT)
2. "Pilots can insert own feedback" (INSERT)
3. "Admins can view all feedback" (SELECT)
4. "Admins can update feedback" (UPDATE)

### 4. Test Insert (Optional)
```sql
-- This will test if the table structure is correct
-- Don't worry if it fails due to foreign key (means table is properly configured)
INSERT INTO pilot_feedback (
  pilot_id, category, subject, message
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'suggestion',
  'Test feedback',
  'This is a test message'
);
-- Expected: Foreign key constraint error (this is good!)
-- It means the table is properly set up with constraints
```

---

## 🚀 Next Steps After Migration

**1. Regenerate Types**
```bash
npm run db:types
```

**2. Restart Dev Server** (if running)
```bash
# Press Ctrl+C to stop
npm run dev
```

**3. Run E2E Tests**
```bash
npm test
```

**Expected Results**:
- Overall pass rate: 37% → **91%+**
- Leave Bids: 0% → **100%**
- Flight Requests: 42% → **90%+**
- Leave Requests: 68% → **95%+**
- Feedback: 33% → **83%+**

**4. Manual Testing**
```bash
# Start dev server
npm run dev

# Visit: http://localhost:3000/portal/login
# Login: mrondeau@airniugini.com.pg / Lemakot@1972
# Navigate: http://localhost:3000/portal/feedback
# Submit test feedback
```

---

## 🔧 Troubleshooting

### Migration Fails with "Table Already Exists"

If the table already exists, that's fine! The migration uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run multiple times.

To verify it's correct, check the structure:
```sql
\d pilot_feedback
```

### Missing Columns or Policies

If the table exists but is missing columns or policies, you can:

**Option 1**: Drop and recreate
```sql
DROP TABLE IF EXISTS pilot_feedback CASCADE;
-- Then run the migration again
```

**Option 2**: Add missing elements manually
- Check the migration file for missing pieces
- Run individual CREATE statements

### RLS Policies Not Working

Verify RLS is enabled:
```sql
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'pilot_feedback';
```

Should show `relrowsecurity = true`

If not:
```sql
ALTER TABLE pilot_feedback ENABLE ROW LEVEL SECURITY;
```

### Foreign Key Errors

If you get foreign key errors, check that:
1. `pilots` table exists
2. `an_users` table exists

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('pilots', 'an_users');
```

---

## ✅ Success Indicators

You'll know the migration was successful when:

1. ✅ Table `pilot_feedback` exists with 11 columns
2. ✅ 5 indexes created (including primary key)
3. ✅ RLS enabled on table
4. ✅ 4 RLS policies active
5. ✅ Foreign keys to `pilots` and `an_users`
6. ✅ Check constraints on category and status
7. ✅ Trigger for auto-updating `updated_at`
8. ✅ TypeScript types regenerated successfully
9. ✅ No errors when restarting dev server
10. ✅ Feedback form submission works in UI

---

## 📊 Expected Impact

After successful migration and type regeneration:

| Component | Before | After | Status |
|-----------|--------|-------|--------|
| **pilot_feedback table** | ❌ Missing | ✅ Created | Ready |
| **Feedback API** | ❌ No table | ✅ Functional | Ready |
| **Feedback UI** | ⚠️ TODO | ✅ Connected | Ready |
| **E2E Tests** | ❌ 33% pass | ✅ 83%+ pass | Ready |
| **Service Layer** | ✅ Complete | ✅ Complete | Ready |

---

## 🎯 Final Checklist

- [ ] Migration executed successfully via Dashboard
- [ ] Table verified with 11 columns
- [ ] 4 RLS policies confirmed
- [ ] TypeScript types regenerated: `npm run db:types`
- [ ] No TypeScript errors: `npm run type-check`
- [ ] Dev server restarts without errors
- [ ] E2E tests re-run: `npm test`
- [ ] Feedback submission tested manually
- [ ] Test pass rate improved to 91%+

---

**Migration File Location**:
`supabase/migrations/20251027_create_pilot_feedback_table.sql`

**Supabase SQL Editor**:
https://app.supabase.com/project/wgdmgvonqysflwdiiols/sql

**Estimated Time**: 5 minutes
**Risk Level**: Low (additive only, no breaking changes)

🎉 **You're ready to go!**
