# Sprint 1.4: TypeScript Interfaces & Type Safety - Implementation Plan

**Author**: Claude (Autonomous Execution)
**Date**: November 20, 2025
**Status**: 🚧 **IN PROGRESS** (Analysis Complete, Fixes Planned)

---

## 🎯 Objective

Fix TypeScript type safety issues across the codebase by:
1. Defining proper interfaces for database query results
2. Removing `as any` type bypasses (20 files identified)
3. Migrating RDO/SDO services to unified `pilot_requests` table
4. Fixing enum type mismatches
5. Resolving status comparison errors

---

## 📊 Current State Analysis

### Type Errors Found: **43 errors** across 10 files

**Category Breakdown**:
1. **RDO/SDO Table Missing** (26 errors) - Services trying to use non-existent `rdo_sdo_requests` table
2. **Status Enum Mismatches** (11 errors) - Comparing PENDING vs SUBMITTED (wrong status values)
3. **Zod Schema Configuration** (4 errors) - Using `required_error` instead of `message` parameter
4. **Minor Import/Export Issues** (2 errors) - Typo and missing export

**Files with `as any` Bypasses**: 20 files
- Most critical: Services with database queries
- Moderate: API routes and components
- Low priority: Utility services

---

## 🏗️ Architecture Decision: Unified Table for ALL Requests

### The Problem

**Current Architecture Confusion**:
- `pilot_requests` table exists with categories: LEAVE, FLIGHT, LEAVE_BID
- `rdo_sdo_requests` migration file exists (dated 2025-01-19) but was **NEVER DEPLOYED**
- Services written to use `rdo_sdo_requests` table fail because table doesn't exist in database
- TypeScript types don't include `rdo_sdo_requests` table

### The Solution

**✅ UNIFIED TABLE ARCHITECTURE** (consistent with Sprint 1.1):

All request types use `pilot_requests` table with `request_category` discriminator:

| Request Category | Purpose | Table Used |
|------------------|---------|------------|
| **LEAVE** | Annual leave, sick leave, LSL, LWOP, etc. | `pilot_requests` |
| **FLIGHT** | Flight requests | `pilot_requests` |
| **RDO** | Rostered Day Off requests | `pilot_requests` ✅ **EXTEND** |
| **SDO** | Scheduled Day Off requests | `pilot_requests` ✅ **EXTEND** |
| **LEAVE_BID** | Annual leave bidding (separate purpose) | `pilot_requests` |

**Migration Created**: `20251120010000_extend_pilot_requests_for_rdo_sdo.sql`
**Status**: Ready to deploy (requires resolving migration history first)

---

## 🔧 Fixes Required

### Priority 1: RDO/SDO Service Migration (26 errors)

**Files to Migrate**:
1. `lib/services/rdo-sdo-service.ts` - Admin RDO/SDO management
2. `lib/services/pilot-rdo-sdo-service.ts` - Pilot portal RDO/SDO
3. `app/api/admin/rdo-sdo-requests/route.ts` - Admin API endpoint
4. `app/api/portal/rdo-sdo-requests/route.ts` - Pilot API endpoint

**Migration Pattern**:
```typescript
// ❌ BEFORE: Using non-existent table
const { data, error } = await supabase
  .from('rdo_sdo_requests')
  .select('*')
  .eq('pilot_id', pilotId)

// ✅ AFTER: Using unified table
const { data, error } = await supabase
  .from('pilot_requests')
  .select('*')
  .in('request_category', ['RDO', 'SDO'])  // Filter by category
  .eq('pilot_id', pilotId)
```

**Required Changes**:
- All `.from('rdo_sdo_requests')` → `.from('pilot_requests').in('request_category', ['RDO', 'SDO'])`
- INSERT operations must include `request_category: 'RDO'` or `request_category: 'SDO'`
- UPDATE/DELETE operations must include `request_category` filter for safety

---

### Priority 2: Status Enum Mismatches (11 errors)

**Problem**: Code comparing `workflow_status` to 'PENDING' but valid status is 'SUBMITTED'

**Files Affected**:
1. `app/dashboard/leave/page.tsx` (3 errors)
2. `components/leave/leave-request-group.tsx` (4 errors)
3. `components/leave/leave-requests-client.tsx` (1 error)
4. `components/pilot/LeaveRequestsList.tsx` (3 errors)

**Fix Pattern**:
```typescript
// ❌ WRONG: PENDING doesn't exist
if (request.workflow_status === 'PENDING') { ... }

// ✅ CORRECT: Use SUBMITTED
if (request.workflow_status === 'SUBMITTED') { ... }
```

**Valid Workflow Status Values**:
- `DRAFT` - Initial state (rarely used)
- `SUBMITTED` - Awaiting review ⭐ (replaces PENDING)
- `IN_REVIEW` - Under manager review
- `APPROVED` - Approved by manager
- `DENIED` - Rejected
- `WITHDRAWN` - Cancelled by pilot

---

### Priority 3: Zod Schema Configuration (4 errors)

**Problem**: Using `required_error` parameter which doesn't exist in Zod enum schema

**Files Affected**:
1. `app/api/admin/rdo-sdo-requests/route.ts` (2 errors)
2. `app/api/portal/rdo-sdo-requests/route.ts` (2 errors)

**Fix Pattern**:
```typescript
// ❌ WRONG: required_error doesn't exist
request_type: z.enum(['RDO', 'SDO'], { required_error: 'Request type is required' })

// ✅ CORRECT: Use message or remove parameter
request_type: z.enum(['RDO', 'SDO'], { message: 'Request type is required' })
// OR
request_type: z.enum(['RDO', 'SDO'])
```

---

### Priority 4: Minor Import/Export Fixes (2 errors)

**File**: `components/portal/rdo-sdo-request-form.tsx`
- **Error**: `Cannot find module 'z od'` (typo)
- **Fix**: Change `import { z } from 'z od'` to `import { z } from 'zod'`

**File**: `lib/utils/roster-utils.ts`
- **Error**: Missing export `parseRosterPeriodCode`
- **Fix**: Verify function exists and add to exports

---

### Priority 5: Remove `as any` Type Bypasses (20 files)

**Strategy**: Address in order of criticality

**High Priority** (Services with database operations):
1. `lib/services/pilot-portal-service.ts`
2. `lib/services/leave-eligibility-service.ts`
3. `lib/services/dashboard-service-v4.ts`
4. `lib/services/audit-service.ts`
5. `lib/services/analytics-service.ts`

**Medium Priority** (API routes and complex components):
6. `app/api/requests/route.ts`
7. `app/api/dashboard/refresh/route.ts`
8. `components/requests/requests-table.tsx`
9. `components/requests/quick-entry-button.tsx`
10. `components/tasks/TaskForm.tsx`

**Low Priority** (Utility services and simple components):
11-20. Remaining utility services and components

**Fix Approach**:
1. Create proper TypeScript interfaces in `types/` directory
2. Replace `as any` with specific type assertions
3. Add type guards where needed
4. Use `unknown` type with narrowing for truly dynamic data

---

## 📝 Implementation Steps

### Step 1: Deploy RDO/SDO Migration ✅ **CREATED**
- [x] Migration file created: `20251120010000_extend_pilot_requests_for_rdo_sdo.sql`
- [ ] Resolve migration history mismatch (`supabase db pull` + `supabase migration repair`)
- [ ] Deploy migration: `supabase db push`
- [ ] Regenerate types: `npm run db:types`

### Step 2: Migrate RDO/SDO Services
- [ ] Fix `lib/services/rdo-sdo-service.ts` (5 database calls)
- [ ] Fix `lib/services/pilot-rdo-sdo-service.ts` (3 database calls)
- [ ] Fix `app/api/admin/rdo-sdo-requests/route.ts` (Zod + table)
- [ ] Fix `app/api/portal/rdo-sdo-requests/route.ts` (Zod + table)

### Step 3: Fix Status Enum Mismatches
- [ ] Fix `app/dashboard/leave/page.tsx` (PENDING → SUBMITTED)
- [ ] Fix `components/leave/leave-request-group.tsx`
- [ ] Fix `components/leave/leave-requests-client.tsx`
- [ ] Fix `components/pilot/LeaveRequestsList.tsx`

### Step 4: Fix Zod Schemas
- [ ] Update all RDO/SDO Zod schemas (remove `required_error`)

### Step 5: Fix Minor Issues
- [ ] Fix import typo in `rdo-sdo-request-form.tsx`
- [ ] Add missing export in `roster-utils.ts`

### Step 6: Remove `as any` Systematically
- [ ] Create TypeScript interfaces for common query patterns
- [ ] Fix high priority services (5 files)
- [ ] Fix medium priority routes/components (5 files)
- [ ] Fix low priority utilities (10 files)

### Step 7: Validation
- [ ] Run type-check: `npm run type-check`
- [ ] Verify zero type errors
- [ ] Run tests: `npm test`
- [ ] Manual testing of RDO/SDO flows

---

## 🧪 Testing Strategy

### Unit Tests Needed
1. **RDO/SDO Service Tests** - Verify unified table queries work correctly
2. **Status Transition Tests** - Validate workflow_status changes
3. **Type Guard Tests** - Ensure type narrowing works correctly

### E2E Tests Needed
1. **RDO Request Flow** - Submit → Review → Approve/Deny
2. **SDO Request Flow** - Same as RDO
3. **Status Display** - Verify UI shows correct status text

### Manual Testing Checklist
- [ ] Submit RDO request via pilot portal
- [ ] Submit SDO request via pilot portal
- [ ] Review RDO/SDO requests in admin dashboard
- [ ] Approve/Deny RDO/SDO requests
- [ ] Verify database stores requests in `pilot_requests` table
- [ ] Check `request_category` field is correctly set

---

## ⚠️ Important Notes

### Architectural Consistency

**DO NOT** create separate tables for request types. Per Sprint 1.1 unified architecture:
- ✅ Use `pilot_requests` table for ALL request types
- ✅ Use `request_category` discriminator field
- ❌ Avoid creating `rdo_sdo_requests`, `flight_requests`, etc. as separate tables

### Migration Safety

The RDO/SDO migration is **NON-DESTRUCTIVE**:
- Only adds to existing `request_category` enum
- No data migration needed (no existing RDO/SDO data)
- Backward compatible with existing LEAVE/FLIGHT/LEAVE_BID requests
- Creates convenience view `active_rdo_sdo_requests` for easy querying

### Type Safety Philosophy

From this sprint forward:
- **NO MORE `as any`** - Use proper types or `unknown` with narrowing
- **Explicit interfaces** - Define types for all database query results
- **Type guards** - Create guards for runtime type checking
- **Strict TypeScript** - Enable stricter compiler options over time

---

## 📊 Success Criteria

Sprint 1.4 is complete when:

1. ✅ Zero TypeScript errors in `npm run type-check`
2. ✅ RDO/SDO services use `pilot_requests` table successfully
3. ✅ All status comparisons use valid workflow_status values
4. ✅ All Zod schemas are correctly configured
5. ✅ All `as any` bypasses removed from priority files
6. ✅ Proper TypeScript interfaces defined for common patterns
7. ✅ E2E tests pass for RDO/SDO flows
8. ✅ Manual testing confirms functionality works

---

## 📚 Related Documents

- **Sprint 1.1 Summary**: `SPRINT-1.1-SUMMARY.md` - Unified table migration (LEAVE/FLIGHT)
- **Sprint 1.2 Summary**: `SPRINT-1.2-SUMMARY.md` - Middleware & route protection
- **Sprint 1.3 Summary**: `SPRINT-1.3-SUMMARY.md` - ServiceResponse pattern
- **Architecture Decision**: `FINAL-ARCHITECTURE.md` - Complete table structure
- **Migration File**: `supabase/migrations/20251120010000_extend_pilot_requests_for_rdo_sdo.sql`

---

## 🚀 Next Steps

**Immediate Actions**:
1. Fix migration history issue with `supabase db pull` and `supabase migration repair`
2. Deploy RDO/SDO migration to extend `pilot_requests` table
3. Regenerate TypeScript types from updated schema
4. Begin systematic fixes starting with Priority 1 (RDO/SDO services)

**Post-Sprint 1.4**:
- Sprint 2: Performance Optimization (query optimization, caching, indexes)
- Sprint 3: Code Quality (extract duplicates, structured logging, strict mode)
- Sprint 4: Security & Testing (CSRF protection, rate limiting, comprehensive tests)

---

**Version**: 1.0.0
**Last Updated**: November 20, 2025
