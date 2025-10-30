# Local Migration Testing - Step-by-Step Guide

**Date**: October 28, 2025
**Sprint**: Sprint 1, Days 1-2 (Database Integrity)
**Migrations**: 4 files (NOT NULL, UNIQUE, CHECK, INDEXES)

---

## 🎯 Overview

This guide walks you through safely testing the database migrations on your local development environment before deploying to staging or production.

**Estimated Time**: 30-45 minutes
**Risk Level**: Low (local testing only)

---

## ✅ Prerequisites

Before starting, ensure you have:

- [ ] **Supabase CLI installed**
  ```bash
  npm install -g supabase
  # or
  brew install supabase/tap/supabase
  ```

- [ ] **Local Supabase running** (or ability to start it)
  ```bash
  supabase start
  ```

- [ ] **Project connected to Supabase**
  ```bash
  supabase link --project-ref wgdmgvonqysflwdiiols
  ```

- [ ] **Environment variables configured** (.env.local)

---

## 📋 Step 1: Pre-Migration Validation (5-10 minutes)

### Why This Matters
Before applying constraints, we need to ensure your existing data won't violate the new rules.

### Run Validation Queries

**Option A: Automated Script**
```bash
./run-local-migration-test.sh
```

**Option B: Manual Validation**

1. **Connect to your Supabase database**:
   ```bash
   supabase db remote commit
   # Or use Supabase Studio SQL Editor
   ```

2. **Run the validation script**:
   ```bash
   psql "your-database-url" -f test-migration-validation.sql
   ```

3. **Review the results**:

   Look for these issues:
   - NULL values in critical columns
   - Duplicate employee numbers
   - Duplicate emails
   - Invalid date ranges (end_date < start_date)
   - Invalid ages (< 18 or > 100)
   - Invalid seniority numbers

### Expected Results

**✅ Clean Database** (No issues):
```
issue                              | count
-----------------------------------|-------
pilots with NULL employee_number   |     0
pilots with NULL first_name        |     0
pilots with NULL last_name         |     0
pilots with NULL rank              |     0
```

**⚠️ Issues Found**:
If you see counts > 0, you'll need to fix the data before migration.

---

## 🛠️ Step 2: Fix Data Issues (If Any)

### If NULL Values Found

```sql
-- Fix NULL employee_numbers (assign temporary values)
UPDATE pilots
SET employee_number = 'TEMP-' || id::text
WHERE employee_number IS NULL;

-- Fix NULL names
UPDATE pilots
SET first_name = 'Unknown'
WHERE first_name IS NULL;

UPDATE pilots
SET last_name = 'Unknown'
WHERE last_name IS NULL;
```

### If Duplicate Employee Numbers Found

```sql
-- Find duplicates
SELECT employee_number, array_agg(id) as pilot_ids
FROM pilots
GROUP BY employee_number
HAVING COUNT(*) > 1;

-- Fix duplicates (add suffix)
UPDATE pilots
SET employee_number = employee_number || '-' || id::text
WHERE id IN (
  SELECT id FROM pilots p1
  WHERE EXISTS (
    SELECT 1 FROM pilots p2
    WHERE p2.employee_number = p1.employee_number
    AND p2.id < p1.id
  )
);
```

### If Invalid Date Ranges Found

```sql
-- Fix leave requests with invalid dates
UPDATE leave_requests
SET end_date = start_date
WHERE end_date < start_date;
```

---

## 🚀 Step 3: Apply Migrations (10-15 minutes)

### Check Migration Files

First, verify all 4 migration files exist:

```bash
ls -l supabase/migrations/20251028_*.sql
```

You should see:
```
20251028_add_not_null_constraints.sql
20251028_add_unique_constraints.sql
20251028_add_check_constraints.sql
20251028_add_performance_indexes.sql
```

### Apply Migrations

**Method 1: Supabase CLI (Recommended)**

```bash
# Apply all pending migrations
supabase db push

# This will:
# 1. Detect the 4 new migration files
# 2. Show you a preview of what will be applied
# 3. Ask for confirmation
# 4. Apply migrations in order
```

**Expected Output**:
```
Applying migration 20251028_add_not_null_constraints.sql...
✔ Applied 20251028_add_not_null_constraints.sql

Applying migration 20251028_add_unique_constraints.sql...
✔ Applied 20251028_add_unique_constraints.sql

Applying migration 20251028_add_check_constraints.sql...
✔ Applied 20251028_add_check_constraints.sql

Applying migration 20251028_add_performance_indexes.sql...
✔ Applied 20251028_add_performance_indexes.sql

✔ All migrations applied successfully
```

**Method 2: Manual SQL Execution**

If Supabase CLI doesn't work, you can apply manually:

```bash
psql "your-database-url" -f supabase/migrations/20251028_add_not_null_constraints.sql
psql "your-database-url" -f supabase/migrations/20251028_add_unique_constraints.sql
psql "your-database-url" -f supabase/migrations/20251028_add_check_constraints.sql
psql "your-database-url" -f supabase/migrations/20251028_add_performance_indexes.sql
```

### Monitor for Errors

**✅ Success Indicators**:
- All `ALTER TABLE` statements complete
- No ERROR messages
- You see "✔ Applied" for each migration

**❌ Failure Indicators**:
- ERROR messages about violating constraints
- Migration stops partway through
- Timeout errors

If migration fails, see [Rollback Procedure](#rollback-procedure) below.

---

## 🔄 Step 4: Regenerate TypeScript Types (5 minutes)

After migrations, your database schema has changed. Update your TypeScript types:

```bash
npm run db:types
```

**Expected Output**:
```
Generating types...
✔ Generated types from PostgreSQL database
✔ types/supabase.ts updated
```

### Verify Type Changes

Check `types/supabase.ts`:

```bash
# Should show recent modification
ls -lh types/supabase.ts
```

Open the file and verify new constraints are reflected in the types.

---

## 🧪 Step 5: Run Validation Tests (10-15 minutes)

### Type Check

Ensure no TypeScript errors:

```bash
npm run type-check
```

**Expected**: `✔ No errors found`

### Linting

Check for code quality issues:

```bash
npm run lint
```

**Expected**: `✔ No linting errors`

### E2E Tests

Run the full test suite:

```bash
npm test
```

**Expected**:
```
✔ 24 tests passed
  - auth.spec.ts (4 tests)
  - pilots.spec.ts (6 tests)
  - leave-requests.spec.ts (5 tests)
  - certifications.spec.ts (4 tests)
  ... and more
```

**Note**: Some tests may need updating if they were inserting invalid data that now violates constraints.

---

## ✅ Step 6: Post-Migration Verification (5 minutes)

### Verify Constraints Were Added

Run these queries to confirm migrations worked:

```sql
-- 1. Check NOT NULL constraints
SELECT
  table_name,
  column_name,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'pilots'
  AND column_name IN ('employee_number', 'first_name', 'last_name', 'rank')
ORDER BY column_name;

-- Expected: is_nullable = 'NO' for all

-- 2. Check UNIQUE constraints
SELECT
  conname as constraint_name,
  conrelid::regclass as table_name
FROM pg_constraint
WHERE contype = 'u'
  AND connamespace = 'public'::regnamespace
ORDER BY table_name, constraint_name;

-- Expected: See uk_pilots_employee_number, uk_pilot_users_email, etc.

-- 3. Check CHECK constraints
SELECT
  conname as constraint_name,
  conrelid::regclass as table_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE contype = 'c'
  AND connamespace = 'public'::regnamespace
ORDER BY table_name, constraint_name;

-- Expected: See chk_pilots_age, chk_leave_dates, etc.

-- 4. Check indexes
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Expected: See 50+ new indexes

-- 5. Summary count
SELECT
  'NOT NULL constraints' as type,
  COUNT(*) as count
FROM information_schema.columns
WHERE table_schema = 'public'
  AND is_nullable = 'NO'
  AND column_name NOT IN ('id', 'created_at', 'updated_at')
UNION ALL
SELECT 'UNIQUE constraints', COUNT(*)
FROM pg_constraint
WHERE contype = 'u' AND connamespace = 'public'::regnamespace
UNION ALL
SELECT 'CHECK constraints', COUNT(*)
FROM pg_constraint
WHERE contype = 'c' AND connamespace = 'public'::regnamespace
UNION ALL
SELECT 'Custom indexes', COUNT(*)
FROM pg_indexes
WHERE schemaname = 'public' AND indexname LIKE 'idx_%';
```

### Expected Summary

| Type | Count |
|------|-------|
| NOT NULL constraints | 80+ |
| UNIQUE constraints | 13+ |
| CHECK constraints | 45+ |
| Custom indexes | 50+ |

---

## 🎮 Step 7: Manual Application Testing (10 minutes)

Start your development server and test critical flows:

```bash
npm run dev
```

Visit http://localhost:3000 and test:

### Admin Dashboard
- [ ] Login works
- [ ] Dashboard loads (check performance!)
- [ ] Pilot list displays
- [ ] Create new pilot (should validate employee_number is unique)
- [ ] Edit pilot (test constraints)
- [ ] Leave requests page loads
- [ ] Certification management works

### Pilot Portal
- [ ] Pilot login works
- [ ] Dashboard loads
- [ ] Profile displays correctly
- [ ] Leave request form validates dates (end >= start)
- [ ] Flight request submission works

### Performance Check

Open browser DevTools → Network tab:

**Before Migrations**:
- Dashboard: ~800ms
- Pilots list: ~300ms
- Leave requests: ~400ms

**After Migrations (Expected)**:
- Dashboard: ~400-500ms (40-50% faster)
- Pilots list: ~150-200ms (50% faster)
- Leave requests: ~200-250ms (40% faster)

---

## 🚨 Rollback Procedure

If something goes wrong, you can rollback:

### Using Supabase CLI

```bash
# Show migration history
supabase migration list

# Rollback last migration
supabase db reset

# This will:
# 1. Drop all tables
# 2. Re-run migrations excluding the failed ones
```

### Manual Rollback

Run these SQL commands:

```sql
-- 1. Drop indexes (fastest to rollback)
DROP INDEX CONCURRENTLY IF EXISTS idx_pilots_employee_number;
DROP INDEX CONCURRENTLY IF EXISTS idx_pilots_rank_status;
-- ... (repeat for all 50+ indexes)

-- 2. Drop CHECK constraints
ALTER TABLE pilots DROP CONSTRAINT IF EXISTS chk_pilots_age;
ALTER TABLE leave_requests DROP CONSTRAINT IF EXISTS chk_leave_dates;
-- ... (repeat for all 45+ constraints)

-- 3. Drop UNIQUE constraints
ALTER TABLE pilots DROP CONSTRAINT IF EXISTS uk_pilots_employee_number;
ALTER TABLE pilot_users DROP CONSTRAINT IF EXISTS uk_pilot_users_email;
-- ... (repeat for all 13 constraints)

-- 4. Drop NOT NULL constraints (most risky, do last)
ALTER TABLE pilots ALTER COLUMN employee_number DROP NOT NULL;
ALTER TABLE pilots ALTER COLUMN first_name DROP NOT NULL;
-- ... (repeat for all 80+ columns)
```

**Recovery Time**: 5-10 minutes

---

## 📊 Success Criteria

Before moving to Days 3-4 (Security Hardening), confirm:

- [x] All 4 migrations applied successfully
- [x] TypeScript types regenerated (types/supabase.ts)
- [x] `npm run type-check` passes
- [x] `npm run lint` passes
- [x] `npm test` passes (24 E2E tests)
- [x] Post-migration verification queries show correct counts
- [x] Manual testing confirms application works
- [x] Performance improvements visible (30-50% faster)

---

## 🎯 Next Steps

Once local testing is complete and successful:

### Option 1: Deploy to Staging (Recommended)
1. Apply migrations to staging Supabase instance
2. Monitor for 24 hours
3. Run full E2E test suite against staging
4. Get stakeholder approval
5. Deploy to production

### Option 2: Proceed to Days 3-4 (Security Hardening)
Continue with Sprint 1:
- CSRF Protection (6 hours)
- Rate Limiting (2 hours)
- Remove Sensitive Logging (1 hour)
- RLS Policy Audit (3 hours)

---

## 📞 Support

If you encounter issues:

1. **Check migration logs**: Look for specific ERROR messages
2. **Review validation queries**: Did we miss data issues?
3. **Check Supabase logs**: Dashboard → Logs → Database
4. **Rollback if needed**: Follow rollback procedure above
5. **Contact BMad Master**: Report issues for assistance

---

## 📝 Notes

- **Backup**: Supabase automatically backs up your database daily
- **Safety**: All indexes use CONCURRENTLY (no table locks)
- **Reversibility**: All changes can be rolled back
- **Performance**: Indexes may take 5-10 minutes to build on large tables
- **Testing**: Always test locally before staging/production

---

**Document Version**: 1.0
**Created**: October 28, 2025
**Last Updated**: October 28, 2025
**Status**: Ready for Use
