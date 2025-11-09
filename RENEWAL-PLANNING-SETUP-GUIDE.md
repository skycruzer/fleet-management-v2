# Renewal Planning & Reports - Setup and Troubleshooting Guide

**Author**: Maurice Rondeau
**Date**: November 9, 2025
**Purpose**: Complete guide to set up and troubleshoot renewal planning and reports features

---

## Quick Diagnostic Checklist

If renewal planning or reports "don't work," check these in order:

### 1. Database Tables Exist? ✓

Required tables for **Renewal Planning**:

- `roster_period_capacity` - Stores capacity limits for each roster period
- `certification_renewal_plans` - Stores renewal planning assignments
- `renewal_plan_history` - Tracks changes to renewal plans

Required tables for **Reports**:

- `leave_requests` - Leave request data
- `flight_requests` - Flight request data
- `pilot_checks` - Certification records
- `pilots` - Pilot information

**How to check**:

```sql
-- Run in Supabase SQL Editor
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'roster_period_capacity',
  'certification_renewal_plans',
  'renewal_plan_history',
  'leave_requests',
  'flight_requests',
  'pilot_checks'
)
ORDER BY table_name;
```

**Expected**: Should return 6 rows. If not, see "Create Missing Tables" section below.

---

### 2. Roster Period Capacity Data Exists? ✓

The renewal planning feature REQUIRES roster period capacity data. Without it, the system will show "No roster periods found."

**How to check**:

```sql
-- Run in Supabase SQL Editor
SELECT roster_period, period_start_date, period_end_date, max_pilots_per_category
FROM roster_period_capacity
ORDER BY period_start_date
LIMIT 10;
```

**Expected**: Should return roster periods like RP01/2025, RP02/2025, etc.

**If empty**: See "Seed Roster Period Capacity" section below.

---

### 3. User Has Admin/Manager Role? ✓

Many features require admin or manager role permissions.

**How to check**:

```sql
-- Run in Supabase SQL Editor
-- Replace 'your-email@example.com' with your actual email
SELECT id, email, role
FROM an_users
WHERE email = 'your-email@example.com';
```

**Expected**: Role should be `admin` or `manager` (lowercase).

**If wrong**: See "Fix User Role" section below.

---

### 4. Browser Console Errors? ✓

Check browser developer console (F12) for JavaScript errors.

**Common errors and fixes**:

- `401 Unauthorized` → You're not logged in or session expired
- `403 Forbidden` → Your user doesn't have required role (admin/manager)
- `404 Not Found` → API route issue (check Vercel deployment logs)
- `500 Server Error` → Backend issue (check Supabase logs)

---

## Complete Setup Instructions

### Step 1: Create Missing Database Tables

If any required tables are missing, run these SQL scripts in Supabase SQL Editor:

#### A. Create `roster_period_capacity` Table

```sql
CREATE TABLE IF NOT EXISTS roster_period_capacity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roster_period TEXT NOT NULL UNIQUE,
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  max_pilots_per_category JSONB NOT NULL DEFAULT '{"Medical": 4, "Flight": 4, "Simulator": 6, "Ground": 8}'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_roster_period_capacity_period
ON roster_period_capacity(roster_period);

CREATE INDEX IF NOT EXISTS idx_roster_period_capacity_dates
ON roster_period_capacity(period_start_date, period_end_date);
```

#### B. Create `certification_renewal_plans` Table

```sql
CREATE TABLE IF NOT EXISTS certification_renewal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pilot_id UUID NOT NULL REFERENCES pilots(id) ON DELETE CASCADE,
  check_type_id UUID NOT NULL REFERENCES check_types(id) ON DELETE RESTRICT,
  original_expiry_date DATE NOT NULL,
  planned_renewal_date DATE NOT NULL,
  planned_roster_period TEXT NOT NULL,
  renewal_window_start DATE NOT NULL,
  renewal_window_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'confirmed', 'completed', 'cancelled')),
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  paired_pilot_id UUID REFERENCES pilots(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_renewal_plans_pilot
ON certification_renewal_plans(pilot_id);

CREATE INDEX IF NOT EXISTS idx_renewal_plans_check_type
ON certification_renewal_plans(check_type_id);

CREATE INDEX IF NOT EXISTS idx_renewal_plans_roster_period
ON certification_renewal_plans(planned_roster_period);

CREATE INDEX IF NOT EXISTS idx_renewal_plans_status
ON certification_renewal_plans(status);
```

#### C. Create `renewal_plan_history` Table

```sql
CREATE TABLE IF NOT EXISTS renewal_plan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  renewal_plan_id UUID NOT NULL REFERENCES certification_renewal_plans(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL CHECK (change_type IN ('created', 'rescheduled', 'confirmed', 'completed', 'cancelled')),
  previous_date DATE,
  new_date DATE,
  previous_roster_period TEXT,
  new_roster_period TEXT,
  reason TEXT,
  changed_by UUID REFERENCES an_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_renewal_history_plan
ON renewal_plan_history(renewal_plan_id);
```

---

### Step 2: Seed Roster Period Capacity Data

**Why**: The renewal planning system CANNOT work without roster period capacity data. It needs to know:

- What roster periods exist (RP01/2025, RP02/2025, etc.)
- What dates each roster period covers (28-day cycles)
- How many renewals can be scheduled per category (Medical, Flight, Simulator, Ground)

**Run this SQL to seed 2025-2026 roster periods**:

```sql
-- Seed roster period capacity for 2025-2026
-- Based on known anchor: RP12/2025 starts 2025-10-11
-- Each roster period is 28 days
-- Capacity: Medical (4), Flight (4), Simulator (6), Ground (8)

INSERT INTO roster_period_capacity (roster_period, period_start_date, period_end_date, max_pilots_per_category, notes)
VALUES
  -- 2025 Roster Periods (RP01-RP13)
  ('RP01/2025', '2024-12-21', '2025-01-17', '{"Medical": 4, "Flight": 4, "Simulator": 6, "Ground": 8}'::jsonb, 'Holiday period - exclude from renewal planning'),
  ('RP02/2025', '2025-01-18', '2025-02-14', '{"Medical": 4, "Flight": 4, "Simulator": 6, "Ground": 8}'::jsonb, 'Holiday period - exclude from renewal planning'),
  ('RP03/2025', '2025-02-15', '2025-03-14', '{"Medical": 4, "Flight": 4, "Simulator": 6, "Ground": 8}'::jsonb, 'Available for renewal planning'),
  ('RP04/2025', '2025-03-15', '2025-04-11', '{"Medical": 4, "Flight": 4, "Simulator": 6, "Ground": 8}'::jsonb, 'Available for renewal planning'),
  ('RP05/2025', '2025-04-12', '2025-05-09', '{"Medical": 4, "Flight": 4, "Simulator": 6, "Ground": 8}'::jsonb, 'Available for renewal planning'),
  ('RP06/2025', '2025-05-10', '2025-06-06', '{"Medical": 4, "Flight": 4, "Simulator": 6, "Ground": 8}'::jsonb, 'Available for renewal planning'),
  ('RP07/2025', '2025-06-07', '2025-07-04', '{"Medical": 4, "Flight": 4, "Simulator": 6, "Ground": 8}'::jsonb, 'Available for renewal planning'),
  ('RP08/2025', '2025-07-05', '2025-08-01', '{"Medical": 4, "Flight": 4, "Simulator": 6, "Ground": 8}'::jsonb, 'Available for renewal planning'),
  ('RP09/2025', '2025-08-02', '2025-08-29', '{"Medical": 4, "Flight": 4, "Simulator": 6, "Ground": 8}'::jsonb, 'Available for renewal planning'),
  ('RP10/2025', '2025-08-30', '2025-09-26', '{"Medical": 4, "Flight": 4, "Simulator": 6, "Ground": 8}'::jsonb, 'Available for renewal planning'),
  ('RP11/2025', '2025-09-27', '2025-10-24', '{"Medical": 4, "Flight": 4, "Simulator": 6, "Ground": 8}'::jsonb, 'Available for renewal planning'),
  ('RP12/2025', '2025-10-25', '2025-11-21', '{"Medical": 4, "Flight": 4, "Simulator": 6, "Ground": 8}'::jsonb, 'Available for renewal planning'),
  ('RP13/2025', '2025-11-22', '2025-12-19', '{"Medical": 4, "Flight": 4, "Simulator": 6, "Ground": 8}'::jsonb, 'Holiday period - exclude from renewal planning'),

  -- 2026 Roster Periods (RP01-RP13)
  ('RP01/2026', '2025-12-20', '2026-01-16', '{"Medical": 4, "Flight": 4, "Simulator": 6, "Ground": 8}'::jsonb, 'Holiday period - exclude from renewal planning'),
  ('RP02/2026', '2026-01-17', '2026-02-13', '{"Medical": 4, "Flight": 4, "Simulator": 6, "Ground": 8}'::jsonb, 'Holiday period - exclude from renewal planning'),
  ('RP03/2026', '2026-02-14', '2026-03-13', '{"Medical": 4, "Flight": 4, "Simulator": 6, "Ground": 8}'::jsonb, 'Available for renewal planning'),
  ('RP04/2026', '2026-03-14', '2026-04-10', '{"Medical": 4, "Flight": 4, "Simulator": 6, "Ground": 8}'::jsonb, 'Available for renewal planning'),
  ('RP05/2026', '2026-04-11', '2026-05-08', '{"Medical": 4, "Flight": 4, "Simulator": 6, "Ground": 8}'::jsonb, 'Available for renewal planning'),
  ('RP06/2026', '2026-05-09', '2026-06-05', '{"Medical": 4, "Flight": 4, "Simulator": 6, "Ground": 8}'::jsonb, 'Available for renewal planning'),
  ('RP07/2026', '2026-06-06', '2026-07-03', '{"Medical": 4, "Flight": 4, "Simulator": 6, "Ground": 8}'::jsonb, 'Available for renewal planning'),
  ('RP08/2026', '2026-07-04', '2026-07-31', '{"Medical": 4, "Flight": 4, "Simulator": 6, "Ground": 8}'::jsonb, 'Available for renewal planning'),
  ('RP09/2026', '2026-08-01', '2026-08-28', '{"Medical": 4, "Flight": 4, "Simulator": 6, "Ground": 8}'::jsonb, 'Available for renewal planning'),
  ('RP10/2026', '2026-08-29', '2026-09-25', '{"Medical": 4, "Flight": 4, "Simulator": 6, "Ground": 8}'::jsonb, 'Available for renewal planning'),
  ('RP11/2026', '2026-09-26', '2026-10-23', '{"Medical": 4, "Flight": 4, "Simulator": 6, "Ground": 8}'::jsonb, 'Available for renewal planning'),
  ('RP12/2026', '2026-10-24', '2026-11-20', '{"Medical": 4, "Flight": 4, "Simulator": 6, "Ground": 8}'::jsonb, 'Available for renewal planning'),
  ('RP13/2026', '2026-11-21', '2026-12-18', '{"Medical": 4, "Flight": 4, "Simulator": 6, "Ground": 8}'::jsonb, 'Holiday period - exclude from renewal planning')
ON CONFLICT (roster_period) DO NOTHING;
```

**Verify seeding worked**:

```sql
SELECT COUNT(*) FROM roster_period_capacity;
-- Expected: 26 rows (13 periods for 2025 + 13 for 2026)
```

---

### Step 3: Fix User Role (If Needed)

If your user role is incorrect:

```sql
-- Replace 'your-email@example.com' with your actual email
UPDATE an_users
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

---

### Step 4: Generate Initial Renewal Plan

Once roster period capacity is seeded:

1. Log into the application
2. Navigate to **Dashboard** → **Renewal Planning**
3. Click **"Generate Plan"** button
4. Wait for generation to complete
5. You should now see roster periods populated with renewal data

---

## Feature-Specific Troubleshooting

### Renewal Planning Feature

**Symptom**: "No roster periods found" message

**Causes**:

1. `roster_period_capacity` table is empty → Run Step 2 above
2. Selected year has no data → Try selecting 2025 or 2026
3. Database connection issue → Check Supabase project status

**Symptom**: Generate Plan button doesn't work

**Causes**:

1. User lacks admin/manager role → Run Step 3 above
2. No certifications with future expiry dates → Check `pilot_checks` table has data
3. All eligible periods are December/January (excluded by design)

**How to debug**:

1. Open browser console (F12)
2. Click Generate Plan
3. Look for red error messages
4. Check Network tab for failed API calls
5. If you see 403 Forbidden → Role issue
6. If you see 500 Server Error → Check Supabase logs

---

### Reports Feature

**Symptom**: Preview shows "No data"

**Causes**:

1. No data in source tables (leave_requests, flight_requests, pilot_checks)
2. Filters are too restrictive (no records match)
3. Date range is outside available data

**How to fix**:

1. Check data exists:

```sql
SELECT COUNT(*) FROM leave_requests;
SELECT COUNT(*) FROM flight_requests;
SELECT COUNT(*) FROM pilot_checks;
```

2. Try with no filters first (click Preview without selecting any filters)
3. Gradually add filters to narrow down the issue

**Symptom**: PDF export fails or downloads empty file

**Causes**:

1. No data matching filters
2. Browser blocking download
3. Server timeout for large datasets

**How to fix**:

1. Try with smaller date range
2. Check browser's download settings
3. Check browser console for errors

---

## Common Questions

### Q: Why are December and January excluded from renewal planning?

**A**: Business rule - holiday months have reduced operational capacity and higher pilot absence rates. Critical certification renewals should not be scheduled during these periods.

### Q: What does "capacity" mean in renewal planning?

**A**: Maximum number of pilots that can renew certifications of each category (Medical, Flight, Simulator, Ground) within a single roster period. This prevents operational bottlenecks.

**Default capacities**:

- Medical: 4 pilots
- Flight: 4 pilots
- Simulator: 6 pilots
- Ground: 8 pilots

### Q: Can I change roster period capacities?

**A**: Yes, update the `roster_period_capacity` table:

```sql
UPDATE roster_period_capacity
SET max_pilots_per_category = '{"Medical": 6, "Flight": 6, "Simulator": 8, "Ground": 10}'::jsonb
WHERE roster_period = 'RP06/2025';
```

### Q: Reports show old data even after adding new records

**A**: Reports are cached for 5 minutes. Either:

1. Wait 5 minutes for cache to expire
2. Or invalidate cache by restarting the application

---

## Vercel Deployment Checklist

Before deploying to Vercel, ensure:

- [ ] All environment variables set in Vercel dashboard:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server-only)
  - `LOGTAIL_SOURCE_TOKEN` (optional)
  - `NEXT_PUBLIC_LOGTAIL_SOURCE_TOKEN` (optional)

- [ ] Database tables created (see Step 1)
- [ ] Roster period capacity seeded (see Step 2)
- [ ] At least one admin user exists with correct role

- [ ] Run build locally to test:

  ```bash
  npm run build
  ```

- [ ] TypeScript validation passes:
  ```bash
  npm run type-check
  ```

---

## Still Not Working?

### Collect Diagnostic Information

Run these queries and save results:

```sql
-- 1. Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%renewal%' OR table_name LIKE '%roster%'
ORDER BY table_name;

-- 2. Check roster period data
SELECT COUNT(*) as total_periods,
       MIN(period_start_date) as earliest_date,
       MAX(period_end_date) as latest_date
FROM roster_period_capacity;

-- 3. Check your user role
SELECT id, email, role, created_at
FROM an_users
WHERE email = 'your-email@example.com';

-- 4. Check certifications exist
SELECT COUNT(*) as total_certs,
       COUNT(*) FILTER (WHERE expiry_date > CURRENT_DATE) as future_expiry
FROM pilot_checks;

-- 5. Check reports data
SELECT
  (SELECT COUNT(*) FROM leave_requests) as leave_requests,
  (SELECT COUNT(*) FROM flight_requests) as flight_requests,
  (SELECT COUNT(*) FROM pilot_checks) as certifications;
```

### Contact Support

Provide:

1. Screenshots of errors (browser console + UI)
2. Results from diagnostic queries above
3. Steps to reproduce the issue
4. Vercel deployment URL
5. What you expected vs. what you got

---

**Version**: 1.0.0
**Last Updated**: November 9, 2025
**Maintainer**: Maurice Rondeau
