# Supabase Database Review - October 27, 2025
**Project**: Fleet Management V2 (B767 Pilot Management System)
**Database**: `wgdmgvonqysflwdiiols.supabase.co`
**Review Tool**: Supabase CLI + Database Linter
**Reviewer**: Claude Code (AI Assistant)

---

## Executive Summary

### Overall Health: ⚠️ MODERATE - Requires Attention

The database is **functional** but has **multiple critical issues** that need addressing:

| Category | Status | Priority |
|----------|--------|----------|
| **Schema Integrity** | ⚠️ Moderate | High |
| **Security (RLS)** | ⚠️ Needs Attention | Critical |
| **Performance** | ✅ Good | Medium |
| **Function Errors** | ❌ Critical | Critical |
| **Data Integrity** | ✅ Good | Low |

### Key Findings
- ✅ **29 tables** with good index coverage
- ✅ **Excellent index strategy** - well-optimized queries
- ⚠️ **4 tables missing RLS** protection (security risk)
- ❌ **~30+ broken functions** with schema mismatches
- ⚠️ **Column naming inconsistencies** causing function errors
- ✅ **472 total functions** - comprehensive business logic layer

---

## 🔴 CRITICAL Issues (Fix Immediately)

### 1. Missing RLS on Critical Tables

**SECURITY RISK**: The following tables have NO Row Level Security enabled:

| Table | Risk Level | Contains | Impact |
|-------|-----------|----------|--------|
| `pilot_users` | 🔴 CRITICAL | Pilot portal authentication | **Anyone can read/modify all pilot accounts** |
| `certification_renewal_plans` | 🟡 HIGH | Certification planning | Unauthorized access to renewal schedules |
| `renewal_plan_history` | 🟡 MEDIUM | Audit trail | Unauthorized access to historical data |
| `roster_period_capacity` | 🟢 LOW | Roster capacity limits | Minor - read-only config data |

**Immediate Action Required**:
```sql
-- Enable RLS on pilot_users (CRITICAL)
ALTER TABLE pilot_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pilot_user profile"
  ON pilot_users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Admins can view all pilot_users"
  ON pilot_users FOR ALL
  USING (
    EXISTS (SELECT 1 FROM an_users WHERE id = auth.uid() AND role = 'admin')
  );

-- Enable RLS on certification_renewal_plans
ALTER TABLE certification_renewal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own renewal plans"
  ON certification_renewal_plans FOR SELECT
  USING (
    pilot_id IN (SELECT id FROM pilots WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all renewal plans"
  ON certification_renewal_plans FOR ALL
  USING (
    EXISTS (SELECT 1 FROM an_users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- Enable RLS on renewal_plan_history
ALTER TABLE renewal_plan_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view renewal history"
  ON renewal_plan_history FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM an_users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );
```

---

### 2. Broken Functions (30+ Functions with Errors)

**Database Linter** identified critical schema mismatches in functions:

#### A. Notification System - Column Name Conflicts

**Problem**: Two versions of `create_notification()` exist with conflicting column references:

```sql
-- ❌ BROKEN: References non-existent 'user_id' column
CREATE FUNCTION create_notification(p_user_id UUID, ...)
-- ❌ BROKEN: References non-existent 'pilot_user_id' column
CREATE FUNCTION create_notification(p_pilot_user_id UUID, ...)
```

**Actual notifications table has**: `recipient_id` (NOT user_id or pilot_user_id)

**Fix Required**:
```sql
-- Drop both broken versions
DROP FUNCTION IF EXISTS create_notification(uuid, text, text, text, text, jsonb);
DROP FUNCTION IF EXISTS create_notification(uuid, text, text, jsonb);

-- Create correct version
CREATE OR REPLACE FUNCTION create_notification(
  p_recipient_id UUID,
  p_type notification_type,
  p_title TEXT,
  p_message TEXT,
  p_link TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (recipient_id, type, title, message, link, metadata)
  VALUES (p_recipient_id, p_type, p_title, p_message, p_link, p_metadata)
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;
```

#### B. Flight Requests - Missing Columns

**Problem**: `submit_flight_request_tx()` references columns that don't exist:

- ❌ `preferred_date` - does not exist (use `flight_date`)
- ❌ `submission_type` - does not exist
- ❌ `submitted_at` - does not exist (use `created_at`)

**Fix**: Update function to use correct column names

#### C. Leave Requests - Missing Columns

**Problem**: Old `submit_leave_request_tx()` function references:

- ❌ `submitted_at` - does not exist (use `created_at`)

**Fix**: Already fixed in Phase 1 migration, but old version still exists

#### D. Pilot Checks - Missing completion_date Column

**Problem**: `batch_update_certifications()` tries to UPDATE non-existent column:

- ❌ `completion_date` - does not exist in pilot_checks table

**Actual pilot_checks columns**:
- id, pilot_id, check_type_id, expiry_date, created_at, updated_at

**Decision Needed**: Do you need `completion_date` in pilot_checks? If yes, add it:
```sql
ALTER TABLE pilot_checks ADD COLUMN completion_date DATE;
```

#### E. Functions Referencing Non-Existent Tables

Still referenced despite Phase 2 fixes:

| Function | References | Status |
|----------|-----------|--------|
| `get_pilot_check_types()` | `crew_checks` | ❌ Table doesn't exist |
| `mark_check_complete()` | `crew_checks` | ❌ Table doesn't exist |
| `calculate_pilot_to_hull_ratio()` | `fleet` | ❌ Table doesn't exist (not needed) |
| Multiple alert functions | `expiry_alerts` | ❌ Table doesn't exist |
| `create_audit_log()` | `audit_log` | ❌ Should use `audit_logs` (plural) |

---

### 3. Type Casting Issues

**Problem**: `create_pilot_with_certifications()` has type mismatch:

```sql
-- ❌ ERROR: role is of type pilot_role but expression is of type text
role = p_pilot_data->>'role'  -- Returns text, needs cast
```

**Fix**:
```sql
role = (p_pilot_data->>'role')::pilot_role
```

---

## 🟡 HIGH Priority Issues (Fix This Week)

### 1. Check Types Missing 'code' Column

**Problem**: Functions expect `check_types.code` but column doesn't exist

**Current check_types columns**:
- id, name, check_code, category, created_at, updated_at

**Note**: Column is actually named `check_code` (not `code`)

**Fix**: Update functions to use `check_code` instead of `code`

### 2. Duplicate/Conflicting Function Signatures

Multiple functions exist with same name but different parameter counts:

```sql
-- Example: submit_leave_request_tx has 2 versions
submit_leave_request_tx(p_pilot_id, p_start_date, p_end_date, p_roster_period, p_notes)
submit_leave_request_tx(p_pilot_user_id, p_request_type, p_start_date, p_end_date, p_days_count, p_roster_period, p_reason)
```

**Impact**: Function name ambiguity causes linter errors

**Fix**: Drop old versions and keep only the correct ones

### 3. Unused Function Parameters

**Code Quality Issue**: Multiple functions have unused parameters:

- `calculate_optimal_renewal_date()` - unused `validity_period_months`
- `complete_task()` - unused `p_completed_by`
- `calculate_check_status()` - unused `completion_date`, `validity_date`

**Fix**: Remove unused parameters or use them appropriately

---

## ✅ STRENGTHS (Keep Doing These)

### 1. Excellent Index Strategy

**Outstanding index coverage** across all tables:

- ✅ **Foreign keys indexed** - all FK columns have indexes
- ✅ **Query-specific indexes** - status + date range combinations
- ✅ **Partial indexes** - filtering inactive records
- ✅ **GIST indexes** - date range overlap queries on leave_requests
- ✅ **Unique constraints** - prevent duplicate data

**Example of good indexing pattern** (leave_requests):
```sql
-- Date range overlap detection (excellent for conflict checking)
idx_leave_requests_date_range_gist USING gist (pilot_id, daterange(start_date, end_date))

-- Status-based queries with filtering
idx_leave_requests_pending WHERE status = 'PENDING'

-- Composite indexes for common queries
idx_leave_requests_pilot_status (pilot_id, status)
idx_leave_requests_status_start_date (status, start_date)
```

### 2. Comprehensive RLS Policies (Where Enabled)

**Well-designed security** on 25/29 tables:

- ✅ Role-based access control (admin, manager, pilot)
- ✅ User-specific data isolation (users see only their own data)
- ✅ Audit log protection (insert-only, no delete/update)
- ✅ Granular permissions (separate policies for SELECT, INSERT, UPDATE, DELETE)

**Example of excellent RLS** (disciplinary_matters):
```sql
-- Admins only can delete
disciplinary_delete: role = 'admin'

-- Admins and managers can view
disciplinary_select: role IN ('admin', 'manager')

-- Admins and managers can update
disciplinary_update: role IN ('admin', 'manager')
```

### 3. Strong Data Integrity Constraints

**Good use of constraints**:

- ✅ Check constraints for business rules (dates valid, positive values)
- ✅ Foreign key constraints for referential integrity
- ✅ Unique constraints preventing duplicates
- ✅ NOT NULL constraints on required fields

**Examples**:
```sql
-- leave_requests constraints
CHECK (end_date >= start_date)
CHECK (days_count > 0)
CHECK (end_date <= start_date + INTERVAL '365 days')
```

### 4. Audit Trail Implementation

**Comprehensive auditing** across critical tables:

- ✅ `audit_logs` - system-wide CRUD operations
- ✅ `disciplinary_audit_log` - disciplinary action tracking
- ✅ `task_audit_log` - task management changes
- ✅ `renewal_plan_history` - certification planning changes

All with proper indexes on timestamp columns for efficient queries.

---

## 📊 Database Statistics

### Table Count and Distribution

| Category | Count | Size Range |
|----------|-------|-----------|
| **Total Tables** | 29 | 0 bytes - 456 KB |
| **With RLS Enabled** | 25 (86%) | - |
| **Without RLS** | 4 (14%) | ⚠️ Security risk |
| **With Indexes** | 29 (100%) | ✅ Excellent |

### Top 5 Largest Tables

| Table | Size | Row Estimate | Purpose |
|-------|------|--------------|---------|
| `audit_logs` | 456 KB | ~1000+ | System audit trail |
| `pilot_checks` | 104 KB | ~607 | Certifications |
| `certification_renewal_plans` | 64 KB | ~100+ | Renewal planning |
| `pilots` | 56 KB | 27 | Pilot profiles |
| `pilot_users` | 48 KB | ~30 | Pilot portal auth |
| `leave_requests` | 48 KB | ~100+ | Leave management |

### Function Count

| Type | Count |
|------|-------|
| **Total Functions** | 472 |
| **Broken Functions** | ~30 (6%) |
| **Working Functions** | ~442 (94%) |

---

## 🔍 Detailed Findings by Category

### A. Schema Integrity

**Status**: ⚠️ MODERATE

**Issues**:
1. Column name inconsistencies across functions and tables
2. Functions referencing non-existent columns (completion_date, submitted_at, etc.)
3. Functions referencing non-existent tables (crew_checks, expiry_alerts, audit_log)

**Recommendations**:
1. Run comprehensive schema sync audit
2. Update all functions to match actual table structures
3. Create missing tables if features are needed, otherwise drop functions

### B. Security (RLS & Policies)

**Status**: ⚠️ NEEDS ATTENTION

**Critical Gaps**:
- `pilot_users` has NO RLS (authentication table exposed!)
- `certification_renewal_plans` has NO RLS
- `renewal_plan_history` has NO RLS

**Strengths**:
- 25/29 tables properly protected
- Well-designed role-based policies
- Audit logs properly secured (insert-only)

**Recommendations**:
1. **IMMEDIATE**: Enable RLS on pilot_users
2. Enable RLS on certification_renewal_plans
3. Enable RLS on renewal_plan_history
4. Review roster_period_capacity (consider if RLS needed)

### C. Performance

**Status**: ✅ GOOD

**Strengths**:
- Excellent index coverage
- GIST indexes for range queries
- Partial indexes for filtered queries
- Composite indexes for common query patterns

**Potential Optimizations**:
1. Consider materialized views for complex analytics queries
2. Review function performance (472 functions - some may be slow)
3. Add query monitoring to identify slow queries

### D. Data Integrity

**Status**: ✅ GOOD

**Strengths**:
- Strong foreign key relationships
- Check constraints enforce business rules
- Unique constraints prevent duplicates
- Comprehensive audit logging

**Minor Issues**:
- Some functions have type casting issues (text -> enum)

---

## 📋 Recommended Action Plan

### Phase 1: Critical Security Fixes (Today)

**Priority**: 🔴 CRITICAL

```sql
-- 1. Enable RLS on pilot_users
ALTER TABLE pilot_users ENABLE ROW LEVEL SECURITY;

-- Add policies (see Critical Issues section)

-- 2. Enable RLS on certification_renewal_plans
ALTER TABLE certification_renewal_plans ENABLE ROW LEVEL SECURITY;

-- 3. Enable RLS on renewal_plan_history
ALTER TABLE renewal_plan_history ENABLE ROW LEVEL SECURITY;
```

**Time Estimate**: 30 minutes
**Risk**: Low (adding security)

### Phase 2: Fix Broken Functions (This Week)

**Priority**: 🔴 CRITICAL

Create migration to:

1. Fix `create_notification()` column references (use `recipient_id`)
2. Fix `submit_flight_request_tx()` column references
3. Fix `submit_leave_request_tx()` column references
4. Fix `batch_update_certifications()` (remove completion_date or add column)
5. Drop functions referencing non-existent tables (crew_checks, fleet, expiry_alerts)
6. Fix type casting issues in `create_pilot_with_certifications()`
7. Update functions to use `check_code` instead of `code`

**Time Estimate**: 2-3 hours
**Risk**: Medium (changing functions)

### Phase 3: Cleanup & Optimization (This Month)

**Priority**: 🟡 HIGH

1. Remove unused function parameters
2. Drop duplicate function versions
3. Add completion_date column if needed
4. Create expiry_alerts table if alerting system is used
5. Consider materialized views for performance
6. Add database monitoring

**Time Estimate**: 4-6 hours
**Risk**: Low (quality improvements)

### Phase 4: Documentation & Monitoring (Ongoing)

**Priority**: 🟢 MEDIUM

1. Document all RLS policies
2. Document function purposes
3. Set up query performance monitoring
4. Create database backup strategy
5. Set up alerting for slow queries

---

## 🎯 Quick Wins (Do These First)

### 1. Enable RLS on pilot_users (10 minutes)
```bash
# Create migration
supabase migration new enable_rls_pilot_users

# Add RLS policies (see Critical Issues section)

# Deploy
supabase db push
```

### 2. Fix create_notification() Function (15 minutes)
```bash
# Create migration
supabase migration new fix_create_notification

# Drop old versions and create correct one

# Deploy
supabase db push
```

### 3. Drop Non-Existent Table References (15 minutes)
```bash
# Create migration
supabase migration new drop_obsolete_functions

# Drop all functions referencing crew_checks, fleet, expiry_alerts

# Deploy
supabase db push
```

**Total Time**: ~40 minutes
**Impact**: Fixes most critical security and function errors

---

## 📈 Database Health Score

| Metric | Score | Grade |
|--------|-------|-------|
| **Schema Integrity** | 7/10 | C+ |
| **Security (RLS)** | 6/10 | D+ |
| **Performance** | 9/10 | A- |
| **Data Integrity** | 9/10 | A- |
| **Function Quality** | 6/10 | D+ |
| **Index Coverage** | 10/10 | A+ |
| **Audit Logging** | 9/10 | A- |
| **Overall** | 7.4/10 | C+ |

**Interpretation**:
- **C+ Overall**: Database is functional but needs attention
- **Strengths**: Performance, data integrity, indexing
- **Weaknesses**: Security gaps, broken functions

---

## 🚨 Risk Assessment

### High Risk

1. **Pilot Users Table Exposed** - No RLS protection on authentication table
   - **Impact**: Unauthorized access to pilot credentials
   - **Likelihood**: High
   - **Mitigation**: Enable RLS immediately

2. **Broken Functions in Production** - 30+ functions with errors
   - **Impact**: Application errors at runtime
   - **Likelihood**: Medium (may not be called)
   - **Mitigation**: Fix or drop broken functions

### Medium Risk

1. **Column Name Confusion** - Functions referencing wrong columns
   - **Impact**: Runtime errors when functions are called
   - **Likelihood**: Medium
   - **Mitigation**: Schema audit and function updates

2. **Renewal Plans Exposed** - No RLS on certification planning
   - **Impact**: Unauthorized access to sensitive scheduling data
   - **Likelihood**: Low
   - **Mitigation**: Enable RLS

### Low Risk

1. **Unused Function Parameters** - Code quality issue
   - **Impact**: Maintenance confusion
   - **Likelihood**: N/A
   - **Mitigation**: Cleanup in Phase 3

---

## 📝 Conclusion

The Supabase database is **well-architected** with excellent indexing and data integrity. However, **critical security gaps** (missing RLS on pilot_users) and **numerous broken functions** require immediate attention.

### Top 3 Priorities

1. 🔴 **Enable RLS on pilot_users** (CRITICAL - 10 min fix)
2. 🔴 **Fix notification function** (CRITICAL - 15 min fix)
3. 🔴 **Drop/fix broken functions** (HIGH - 2-3 hours)

### Overall Recommendation

**Fix the critical security issues TODAY**, then systematically address the broken functions this week. The database has a strong foundation - it just needs cleanup and security hardening.

---

**Review Completed**: October 27, 2025
**Next Review**: After Phase 1 & 2 fixes are deployed
**Status**: ⚠️ MODERATE - Action Required
