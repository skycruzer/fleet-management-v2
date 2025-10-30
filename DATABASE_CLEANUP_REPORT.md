# Database Cleanup Report
**Generated**: October 27, 2025
**Database**: Supabase Project `wgdmgvonqysflwdiiols`
**Analysis Tool**: `supabase db lint`

---

## Executive Summary

Database linting revealed **40+ broken functions** with critical schema misalignment issues. Functions reference tables and columns that don't exist in the current database schema, causing runtime errors.

### Critical Statistics
- **Broken Functions**: 40+
- **Missing Tables**: 9 (feedback_posts, crew_members, crew_checks, alerts, fleet, system_requirements, expiry_alerts, audit_log, check_alerts)
- **Missing Columns**: 14+ (approved_by, notes, route_details, user_id, completion_date, display_order, code, hire_date, status, timestamp, operation_type, regulatory_impact, recipient_type, full_name)
- **Type Mismatches**: 3
- **Unused Parameters**: 5+

---

## Critical Issues (P0 - Fix Immediately)

### 1. Missing Core Tables

The following tables are referenced in functions but **DO NOT EXIST**:

#### `feedback_posts` (Referenced by 3 functions)
**Impact**: Pilot portal feedback submission system completely broken
**Functions Affected**:
- `submit_feedback_post_tx()`
- `get_pilot_dashboard_metrics()`
- `handle_feedback_notification()`

**Required Schema**:
```sql
CREATE TABLE feedback_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pilot_user_id UUID NOT NULL REFERENCES pilot_users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES feedback_categories(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `crew_members` (Referenced by 2 functions)
**Impact**: Fleet performance metrics broken
**Functions Affected**:
- `get_database_performance_metrics()`
- `calculate_fleet_statistics()`

#### `crew_checks` (Referenced by 1 function)
**Impact**: Crew certification tracking non-functional
**Functions Affected**:
- `get_crew_compliance_summary()`

#### `alerts` (Referenced by 2 functions)
**Impact**: Alert notification system broken
**Functions Affected**:
- `create_alert()`
- `process_pending_alerts()`

#### `fleet` (Referenced by 1 function)
**Impact**: Fleet management analytics broken
**Functions Affected**:
- `get_fleet_statistics()`

---

### 2. Missing Critical Columns

#### `leave_requests.approved_by` (UUID)
**Impact**: Cannot track who approved leave requests
**Functions Affected**:
- `approve_leave_request(uuid, uuid, text, text)`
- `get_leave_approval_history()`

**Fix**:
```sql
ALTER TABLE leave_requests ADD COLUMN approved_by UUID REFERENCES pilots(id);
```

#### `leave_requests.notes` (TEXT)
**Impact**: Cannot store internal notes on leave requests
**Functions Affected**:
- `submit_leave_request_tx(uuid, text, date, date, integer, text, text)`

**Fix**:
```sql
ALTER TABLE leave_requests ADD COLUMN notes TEXT;
```

#### `flight_requests.route_details` (JSONB)
**Impact**: Cannot store flight route information
**Functions Affected**:
- `submit_flight_request_tx(uuid, text, date, text, text)`
- `get_flight_request_details(uuid)`

**Fix**:
```sql
ALTER TABLE flight_requests ADD COLUMN route_details JSONB DEFAULT '{}'::jsonb;
```

#### `notifications.user_id` (UUID)
**Impact**: Cannot properly link notifications to users
**Functions Affected**:
- `create_notification(uuid, text, text, jsonb)`
- `get_user_notifications(uuid)`

**Current Schema**: `notifications` has `pilot_user_id` but functions expect `user_id`

**Fix Options**:
1. **Option A**: Rename column to `user_id` (breaking change)
2. **Option B**: Update all functions to use `pilot_user_id` (recommended)

#### `tasks.completion_date` (TIMESTAMPTZ)
**Impact**: Cannot track when tasks were completed
**Functions Affected**:
- `complete_task(uuid, uuid)`
- `get_task_completion_statistics()`

**Fix**:
```sql
ALTER TABLE tasks ADD COLUMN completion_date TIMESTAMPTZ;
```

#### `feedback_categories.display_order` (INTEGER)
**Impact**: Cannot control category display order
**Functions Affected**:
- Index creation logic in migrations

**Fix**:
```sql
ALTER TABLE feedback_categories ADD COLUMN display_order INTEGER DEFAULT 0;
```

---

## High Priority Issues (P1 - Fix This Week)

### 3. Type Mismatches

#### `batch_update_certifications()` Parameter Type Mismatch
**Current**: Expects `jsonb[]` (array of JSONB objects)
**Actual Calls**: Sometimes called with `json` type

**Fix**: Ensure all callers convert to `jsonb[]` or add type casting in function

#### `calculate_years_to_retirement()` Return Type Issue
**Current**: Returns `numeric`
**Expected by Callers**: Returns `integer`

**Fix**:
```sql
CREATE OR REPLACE FUNCTION calculate_years_to_retirement(p_pilot_id uuid)
RETURNS integer  -- Changed from numeric
AS $$
  -- Implementation
$$ LANGUAGE plpgsql;
```

---

### 4. Unused Parameters (Code Smell - Consider Removing)

The following functions have parameters that are never used:

1. **`delete_pilot_with_cascade(p_pilot_id uuid)`**
   - Unused parameter: None (false positive)

2. **`approve_leave_request(request_id uuid, approver_id uuid, notes text, approved_by_name text)`**
   - Unused parameter: `approved_by_name` (never referenced in function body)

3. **`submit_feedback_post_tx(...)`**
   - Multiple unused parameters (function doesn't exist - table missing)

**Recommendation**: Review function signatures and remove unused parameters to improve clarity.

---

## Medium Priority Issues (P2 - Fix This Month)

### 5. Missing Optional Columns (Enhanced Functionality)

These columns would improve functionality but aren't critical:

#### `check_types.code` (VARCHAR)
**Purpose**: Short code for check types (e.g., "OPC", "LC")
**Benefit**: Easier integration with external systems

#### `pilots.hire_date` (DATE)
**Purpose**: Track when pilot was hired
**Benefit**: Better historical analytics

#### `disciplinary_matters.regulatory_impact` (BOOLEAN)
**Purpose**: Flag if matter has regulatory implications
**Benefit**: Better compliance tracking

#### `notifications.recipient_type` (TEXT)
**Purpose**: Distinguish between pilot/admin notifications
**Benefit**: Better notification routing

---

## Database Function Inventory

### Functions Requiring Immediate Fixes (P0)

1. **`submit_feedback_post_tx()`** - Missing `feedback_posts` table
2. **`approve_leave_request()`** - Missing `approved_by` column
3. **`submit_leave_request_tx()`** - Missing `notes` column
4. **`submit_flight_request_tx()`** - Missing `route_details` column
5. **`create_notification()`** - Column name mismatch (`user_id` vs `pilot_user_id`)
6. **`complete_task()`** - Missing `completion_date` column
7. **`get_database_performance_metrics()`** - Missing `crew_members` table
8. **`create_alert()`** - Missing `alerts` table
9. **`get_crew_compliance_summary()`** - Missing `crew_checks` table
10. **`get_fleet_statistics()`** - Missing `fleet` table

### Functions with Type Mismatches (P1)

1. **`batch_update_certifications(jsonb[])`** - Parameter type inconsistency
2. **`calculate_years_to_retirement(uuid)`** - Return type mismatch

### Functions with Unused Parameters (P2)

1. **`approve_leave_request()`** - `approved_by_name` parameter unused
2. **`submit_feedback_post_tx()`** - Multiple parameters (pending table creation)

---

## Recommended Migration Plan

### Phase 1: Critical Fixes (Week 1)

**Goal**: Restore core functionality by creating missing tables and columns

```bash
# Create migration
supabase migration new fix_critical_schema_issues

# Migration contents:
# 1. Create feedback_posts table
# 2. Add leave_requests.approved_by column
# 3. Add leave_requests.notes column
# 4. Add flight_requests.route_details column
# 5. Add tasks.completion_date column
# 6. Add feedback_categories.display_order column
# 7. Update notification functions to use pilot_user_id

# Deploy to production
supabase db push
```

### Phase 2: Extended Tables (Week 2)

**Goal**: Add missing tables for advanced features

```bash
# Create migration
supabase migration new add_missing_tables

# Migration contents:
# 1. Create crew_members table (if crew tracking is needed)
# 2. Create crew_checks table (if crew certifications needed)
# 3. Create alerts table (if alert system is required)
# 4. Create fleet table (if fleet management needed)

# Deploy to production
supabase db push
```

### Phase 3: Function Cleanup (Week 3)

**Goal**: Fix type mismatches and remove unused parameters

```bash
# Create migration
supabase migration new cleanup_function_signatures

# Migration contents:
# 1. Update batch_update_certifications type handling
# 2. Fix calculate_years_to_retirement return type
# 3. Remove unused parameters from functions

# Deploy to production
supabase db push
```

### Phase 4: Optional Enhancements (Week 4)

**Goal**: Add nice-to-have columns and features

```bash
# Create migration
supabase migration new add_optional_columns

# Migration contents:
# 1. Add check_types.code column
# 2. Add pilots.hire_date column
# 3. Add disciplinary_matters.regulatory_impact column
# 4. Add notifications.recipient_type column

# Deploy to production
supabase db push
```

---

## Testing Strategy

### Pre-Migration Testing
1. **Backup Database**: Create manual backup before any migrations
2. **Test in Branch**: Use Supabase branching to test migrations first
3. **Document Current State**: Run `supabase db lint` and save output

### Post-Migration Validation
1. **Re-run Linter**: `supabase db lint` should show reduced errors
2. **Test Functions**: Call each repaired function manually
3. **Check Application**: Verify pilot portal and admin dashboard work
4. **Monitor Logs**: Watch Supabase logs for errors

### Rollback Plan
```bash
# If migration fails, rollback using:
supabase migration list
supabase db reset --db-url "..."
# Then restore from backup
```

---

## Current Database State

### Existing Tables (26 total)
✅ **audit_logs** (520 KB, 15 columns)
✅ **pilot_checks** (416 KB, 6 columns)
✅ **certification_renewal_plans** (320 KB, 16 columns)
✅ **leave_requests** (288 KB, 20 columns)
✅ **pilots** (280 KB, 21 columns)
✅ **flight_requests** (192 KB, 13 columns)
✅ **pilot_users** (184 KB, 22 columns) - Pilot portal authentication
✅ **tasks** (160 KB, 23 columns)
✅ **disciplinary_audit_log** (128 KB, 8 columns)
✅ **task_audit_log** (128 KB, 8 columns)
✅ **disciplinary_matters** (112 KB, 27 columns)
✅ **leave_bids** (96 KB, 15 columns)
✅ **password_reset_tokens** (96 KB, 6 columns)
✅ **feedback_categories** (96 KB, 12 columns)
✅ **check_types** (80 KB, 6 columns)
✅ **digital_forms** (80 KB, 11 columns)
✅ **an_users** (80 KB, 7 columns) - Pilot portal authentication
✅ **roster_period_capacity** (80 KB, 8 columns)
✅ **document_categories** (64 KB, 9 columns)
✅ **contract_types** (48 KB, 6 columns)
✅ **settings** (48 KB, 6 columns)
✅ **incident_types** (48 KB, 8 columns)
✅ **pilot_feedback** (48 KB, 12 columns)
✅ **task_categories** (48 KB, 8 columns)
✅ **renewal_plan_history** (40 KB, 12 columns)
✅ **notifications** (32 KB, 9 columns)

### Missing Tables (9 total)
❌ **feedback_posts** - Required for pilot portal feedback
❌ **crew_members** - Required for crew tracking
❌ **crew_checks** - Required for crew certifications
❌ **alerts** - Required for alert system
❌ **fleet** - Required for fleet management
❌ **system_requirements** - Referenced in functions
❌ **expiry_alerts** - Referenced in certification alerts
❌ **audit_log** - May be duplicate of audit_logs
❌ **check_alerts** - Referenced in notification system

---

## Business Impact Assessment

### High Impact (Immediate Action Required)
- **Pilot Portal Feedback**: Completely broken (missing `feedback_posts` table)
- **Leave Request Approvals**: Cannot track approver (missing `approved_by` column)
- **Flight Request Tracking**: Missing route details storage

### Medium Impact (Degrades Functionality)
- **Task Management**: Cannot track completion dates
- **Notification System**: Column name inconsistency causes errors
- **Fleet Analytics**: Performance metrics unavailable

### Low Impact (Nice to Have)
- **Category Ordering**: Cannot control display order
- **Enhanced Analytics**: Missing optional fields for reporting

---

## Security Considerations

### Row Level Security (RLS)
All new tables MUST have RLS enabled with appropriate policies:

```sql
-- Enable RLS on new tables
ALTER TABLE feedback_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own feedback posts"
  ON feedback_posts FOR SELECT
  USING (auth.uid() = pilot_user_id);

CREATE POLICY "Admins can view all feedback posts"
  ON feedback_posts FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');
```

### Data Migration
When adding missing columns:
- Set appropriate DEFAULT values
- Consider backfilling existing records
- Maintain data integrity during migration

---

## Next Steps

### Immediate Actions (Today)
1. ✅ Review this report
2. ⏳ Create Phase 1 migration (critical fixes)
3. ⏳ Test migration in Supabase branch
4. ⏳ Deploy to production after testing

### This Week
1. ⏳ Create Phase 2 migration (missing tables)
2. ⏳ Update TypeScript types (`npm run db:types`)
3. ⏳ Test all affected application features
4. ⏳ Update service layer functions if needed

### This Month
1. ⏳ Complete Phase 3 (function cleanup)
2. ⏳ Complete Phase 4 (optional enhancements)
3. ⏳ Full regression testing
4. ⏳ Update documentation

---

## ✅ User Feedback Received (October 27, 2025)

**User clarifications:**
1. ✅ **Crew Members = Pilots** - "Crew members are the pilots" - NO separate crew_members table needed
2. ✅ **No Fleet Management** - "Don't need fleet management" - Fleet tracking not required
3. ⏳ **Feedback Posts Table** - Pending clarification (Phase 1 migration already created)
4. ⏳ **Alerts System** - Pending clarification

**Actions Taken:**
- ✅ Created Phase 1 migration (`20251027004731_fix_critical_schema_issues.sql`)
  - Adds 5 missing columns to existing tables
  - Creates feedback_posts, feedback_likes, feedback_comments tables
  - Updates 6 critical functions

- ✅ Created Phase 2 migration (`20251027010936_fix_crew_and_fleet_function_references.sql`)
  - Drops 15 broken functions referencing crew_members/fleet tables
  - Recreates 6 essential functions using pilots table
  - Creates 3 backward compatibility aliases

## Remaining Questions

1. **Feedback Posts Table**: Is the pilot portal feedback feature actively used?
2. **Alerts System**: Is there a separate alerts feature beyond notifications?

---

**Report Generated By**: Supabase CLI Database Linter
**Contact**: Maurice (Skycruzer)
**Last Updated**: October 27, 2025 (Updated with user feedback)
