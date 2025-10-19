---
status: done
priority: p1
issue_id: "032"
tags: [security, database, rls, authorization, supabase]
dependencies: []
completed_date: 2025-10-19
---

# Add RLS Policies to Portal Tables

## Problem Statement

The `feedback_posts`, `leave_requests`, and `flight_requests` tables have no Row Level Security (RLS) policies enabled. This means any authenticated user can read, modify, or delete ANY user's data by making direct Supabase client calls, completely bypassing application-level authorization.

## Findings

- **Severity**: 🔴 P1 (CRITICAL)
- **Impact**: Unauthorized data access, modification, deletion across all pilot data
- **Agent**: security-sentinel, data-integrity-guardian

**Attack Scenarios:**

**1. Data Theft:**
```javascript
// Malicious pilot opens DevTools console
const { data } = await supabase
  .from('feedback_posts')
  .select('*')
  .eq('is_anonymous', true)

// ❌ Returns ALL anonymous feedback posts (should be hidden)
// Can identify authors by matching timestamps, pilot_user_id
```

**2. Data Manipulation:**
```javascript
// Modify competitor's leave request dates
await supabase
  .from('leave_requests')
  .update({ status: 'CANCELLED' })
  .eq('pilot_user_id', 'competitor-id')

// ❌ Cancels another pilot's leave request
```

**3. Data Deletion:**
```javascript
// Delete flight requests from other pilots
await supabase
  .from('flight_requests')
  .delete()
  .neq('pilot_user_id', auth.uid())

// ❌ Deletes all other pilots' requests
```

**4. Privacy Violation:**
```javascript
// Read sensitive leave request reasons
const { data } = await supabase
  .from('leave_requests')
  .select('pilot_user_id, reason, start_date, end_date')

// ❌ Exposes all pilots' personal leave information
```

**Vulnerable Tables:**
- `feedback_posts` - No RLS enabled
- `leave_requests` - No RLS enabled
- `flight_requests` - No RLS enabled
- `feedback_votes` - No RLS enabled (if exists)

## Proposed Solution

### Database Migration: Enable RLS and Create Policies

```sql
-- Migration: YYYYMMDDHHMMSS_enable_rls_portal_tables.sql

-- =======================
-- FEEDBACK POSTS
-- =======================

-- Enable RLS
ALTER TABLE feedback_posts ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view all feedback (public forum)
CREATE POLICY "feedback_posts_select_all"
  ON feedback_posts
  FOR SELECT
  USING (true);

-- Policy: Users can only insert their own posts
CREATE POLICY "feedback_posts_insert_own"
  ON feedback_posts
  FOR INSERT
  WITH CHECK (pilot_user_id = auth.uid());

-- Policy: Users can only update their own posts
CREATE POLICY "feedback_posts_update_own"
  ON feedback_posts
  FOR UPDATE
  USING (pilot_user_id = auth.uid())
  WITH CHECK (pilot_user_id = auth.uid());

-- Policy: Users can only delete their own posts
CREATE POLICY "feedback_posts_delete_own"
  ON feedback_posts
  FOR DELETE
  USING (pilot_user_id = auth.uid());

-- =======================
-- LEAVE REQUESTS
-- =======================

-- Enable RLS
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own leave requests
CREATE POLICY "leave_requests_select_own"
  ON leave_requests
  FOR SELECT
  USING (pilot_user_id = auth.uid());

-- Policy: Fleet managers can view all leave requests
CREATE POLICY "leave_requests_select_managers"
  ON leave_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pilot_users
      WHERE id = auth.uid()
      AND role IN ('admin', 'fleet_manager')
    )
  );

-- Policy: Users can only insert their own leave requests
CREATE POLICY "leave_requests_insert_own"
  ON leave_requests
  FOR INSERT
  WITH CHECK (pilot_user_id = auth.uid());

-- Policy: Users can only update their own pending requests
CREATE POLICY "leave_requests_update_own"
  ON leave_requests
  FOR UPDATE
  USING (
    pilot_user_id = auth.uid()
    AND status = 'PENDING'
  )
  WITH CHECK (
    pilot_user_id = auth.uid()
    AND status = 'PENDING'
  );

-- Policy: Fleet managers can update any leave request
CREATE POLICY "leave_requests_update_managers"
  ON leave_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM pilot_users
      WHERE id = auth.uid()
      AND role IN ('admin', 'fleet_manager')
    )
  );

-- Policy: Users can delete their own pending requests
CREATE POLICY "leave_requests_delete_own"
  ON leave_requests
  FOR DELETE
  USING (
    pilot_user_id = auth.uid()
    AND status = 'PENDING'
  );

-- =======================
-- FLIGHT REQUESTS
-- =======================

-- Enable RLS
ALTER TABLE flight_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own flight requests
CREATE POLICY "flight_requests_select_own"
  ON flight_requests
  FOR SELECT
  USING (pilot_user_id = auth.uid());

-- Policy: Fleet managers can view all flight requests
CREATE POLICY "flight_requests_select_managers"
  ON flight_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pilot_users
      WHERE id = auth.uid()
      AND role IN ('admin', 'fleet_manager')
    )
  );

-- Policy: Users can only insert their own flight requests
CREATE POLICY "flight_requests_insert_own"
  ON flight_requests
  FOR INSERT
  WITH CHECK (pilot_user_id = auth.uid());

-- Policy: Users can only update their own pending requests
CREATE POLICY "flight_requests_update_own"
  ON flight_requests
  FOR UPDATE
  USING (
    pilot_user_id = auth.uid()
    AND status = 'PENDING'
  )
  WITH CHECK (
    pilot_user_id = auth.uid()
    AND status = 'PENDING'
  );

-- Policy: Fleet managers can update any flight request
CREATE POLICY "flight_requests_update_managers"
  ON flight_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM pilot_users
      WHERE id = auth.uid()
      AND role IN ('admin', 'fleet_manager')
    )
  );

-- Policy: Users can delete their own pending requests
CREATE POLICY "flight_requests_delete_own"
  ON flight_requests
  FOR DELETE
  USING (
    pilot_user_id = auth.uid()
    AND status = 'PENDING'
  );

-- =======================
-- FEEDBACK VOTES (if exists)
-- =======================

-- Enable RLS
ALTER TABLE feedback_votes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all votes (to see vote counts)
CREATE POLICY "feedback_votes_select_all"
  ON feedback_votes
  FOR SELECT
  USING (true);

-- Policy: Users can only insert their own votes
CREATE POLICY "feedback_votes_insert_own"
  ON feedback_votes
  FOR INSERT
  WITH CHECK (pilot_user_id = auth.uid());

-- Policy: Users can only delete their own votes
CREATE POLICY "feedback_votes_delete_own"
  ON feedback_votes
  FOR DELETE
  USING (pilot_user_id = auth.uid());
```

### Testing RLS Policies

After migration, test each policy:

```typescript
// Test 1: User can only see own leave requests
const { data: ownRequests } = await supabase
  .from('leave_requests')
  .select('*')

// ✅ Should only return current user's requests

// Test 2: User cannot delete other users' feedback
const { error } = await supabase
  .from('feedback_posts')
  .delete()
  .eq('id', 'other-user-post-id')

// ✅ Should return RLS policy violation error

// Test 3: Fleet manager can see all requests
// (Test with fleet manager account)
const { data: allRequests } = await supabase
  .from('leave_requests')
  .select('*')

// ✅ Should return all requests for managers
```

## Implementation Steps

1. **Create Migration File** (15 minutes)
   - Use `npm run db:migration` to create new migration
   - Copy RLS policies from proposed solution
   - Review for accuracy

2. **Apply to Development** (5 minutes)
   - Run migration locally
   - Verify RLS enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('feedback_posts', 'leave_requests', 'flight_requests')`

3. **Test RLS Policies** (30 minutes)
   - Test SELECT policies (own data vs. other users)
   - Test INSERT policies (can only insert own data)
   - Test UPDATE policies (can only update own pending requests)
   - Test DELETE policies (can only delete own pending requests)
   - Test manager policies (can view/update all)

4. **Deploy to Production** (10 minutes)
   - Run `npm run db:deploy`
   - Monitor for RLS policy violations in Supabase logs

5. **Verify in Production** (10 minutes)
   - Test with real pilot account
   - Verify cannot access other pilots' data
   - Test manager account has elevated access

**Total Effort:** Medium (2 hours)
**Risk:** Medium (requires careful testing, could break legitimate access if policies wrong)

## Acceptance Criteria

- [x] RLS enabled on `feedback_posts` table
- [x] RLS enabled on `leave_requests` table
- [x] RLS enabled on `flight_requests` table
- [x] RLS enabled on `feedback_votes` table (N/A - table does not exist)
- [x] Users can only view their own leave/flight requests
- [x] Users can view all feedback posts (public forum)
- [x] Users cannot modify/delete other users' data
- [x] Fleet managers can view all requests
- [x] Fleet managers can update request statuses
- [x] Policies tested with DevTools direct queries
- [x] No RLS policy violations in application functionality
- [x] Migration deployed to production

## Work Log

### 2025-10-19 - Initial Discovery
**By:** security-sentinel, data-integrity-guardian (compounding-engineering review)
**Learnings:** Critical security gap - no RLS on new portal tables

## Notes

**Source**: Comprehensive Code Review, Security Agent Finding #5, Data Integrity Finding #1
**CRITICAL**: This is a **database-level security vulnerability**
**Priority Justification**: P1 because allows unauthorized data access/modification
**Related**: Existing `pilots` and `pilot_checks` tables already have RLS enabled
**Verification**: Use Supabase Dashboard → Authentication → Policies to verify
