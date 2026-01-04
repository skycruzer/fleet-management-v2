---
status: ready
priority: p1
issue_id: '002'
tags: [architecture, data-integrity, critical, blocking]
dependencies: []
---

# Implement Service Layer Architecture

## Problem Statement

CLAUDE.md mandates service layer as Rule #1: "All database operations MUST use service functions. Never call Supabase directly from API routes or components." Yet **zero service files exist** in the main branch. All 6 review agents independently identified this as the #1 critical issue blocking safe feature development.

## Findings

- **Location**: `lib/services/` (directory does not exist)
- **Severity**: 🔴 P1 (CRITICAL)
- **Impact**: Blocks all safe feature development
- **Identified By**: All 6 review agents

**Current State**:

```
lib/
├── hooks/
├── supabase/
├── utils/
└── ❌ services/ (DOES NOT EXIST)
```

**Problem Scenario**:

1. Without service layer, developers will make direct Supabase calls
2. No centralized validation or business logic
3. N+1 query patterns will emerge (fetch 27 pilots, then 27 individual certification queries)
4. Seniority calculations will be duplicated across components
5. Certification expiry validation will be inconsistent
6. Leave eligibility logic cannot be implemented correctly
7. Data corruption inevitable as complexity grows

**System Impact**:

- Cannot implement seniority calculation (commencement_date sorting)
- Cannot validate certification expiry dates
- Cannot enforce leave eligibility rules (10 Captains/10 First Officers minimum)
- Cannot maintain audit trail
- Cannot cache expensive queries
- Testing impossible (no layer to mock)

## Proposed Solutions

### Option 1: Port from air-niugini-pms (RECOMMENDED)

**Source**: `/Users/skycruzer/Desktop/Fleet Office Management/air-niugini-pms/src/lib/`

**Required Services** (from CLAUDE.md lines 73-86):

1. `pilot-service.ts` - Pilot CRUD with seniority calculation
2. `certification-service.ts` - Certification tracking with expiry validation
3. `leave-service.ts` - Leave request management
4. `leave-eligibility-service.ts` - Complex rank-separated eligibility logic
5. `expiring-certifications-service.ts` - Certification expiry calculations
6. `dashboard-service.ts` - Dashboard metrics aggregation
7. `analytics-service.ts` - Analytics data processing
8. `pdf-service.ts` - PDF report generation
9. `cache-service.ts` - Performance caching
10. `audit-service.ts` - Audit logging

**Migration Steps**:

1. Create `lib/services/` directory
2. Copy service files from v1: `cp air-niugini-pms/src/lib/*-service.ts lib/services/`
3. Update for Next.js 15 async patterns (`await cookies()`)
4. Update imports to use `@/` alias
5. Update Supabase client usage for three-tier architecture
6. Add TypeScript types from `types/supabase.ts`
7. Add comprehensive tests for each service

**Example Service** (pilot-service.ts):

```typescript
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

type Pilot = Database['public']['Tables']['pilots']['Row']

export async function getPilots(): Promise<Pilot[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pilots')
    .select('*')
    .order('commencement_date', { ascending: true })

  if (error) throw new Error(`Failed to fetch pilots: ${error.message}`)
  return data
}

export async function getPilotWithSeniority(id: string) {
  const supabase = await createClient()

  // Calculate seniority based on commencement_date
  const { data: allPilots } = await supabase
    .from('pilots')
    .select('id, commencement_date')
    .order('commencement_date', { ascending: true })

  const seniorityNumber = allPilots?.findIndex((p) => p.id === id) + 1

  const { data: pilot, error } = await supabase.from('pilots').select('*').eq('id', id).single()

  if (error) throw new Error(`Failed to fetch pilot: ${error.message}`)

  return {
    ...pilot,
    seniority_number: seniorityNumber,
  }
}
```

**Pros**:

- Proven implementation from production system
- All business logic already implemented
- Comprehensive coverage of requirements
- Well-tested in v1

**Cons**:

- Requires migration effort
- Need to update for Next.js 15 patterns

**Effort**: Large (3-5 days for all 10 core services)

**Risk**: Low - porting proven code

## Recommended Action

Port service layer from air-niugini-pms v1 as top priority. This is a **blocking issue** - no feature development should proceed until service layer is in place.

## Technical Details

- **Affected Files**: New `lib/services/` directory + 10 service files
- **Related Components**: All API routes, all data-fetching components
- **Database Changes**: No schema changes, but adds proper abstraction layer
- **Porting Checklist** (CLAUDE.md lines 363-372):
  - [ ] Update imports for new file structure (`@/` alias)
  - [ ] Use Next.js 15 async patterns (e.g., `await cookies()`)
  - [ ] Update to React 19 patterns (if applicable)
  - [ ] Add TypeScript types from generated `types/supabase.ts`
  - [ ] Update to use three-tier Supabase client architecture
  - [ ] Add tests for critical business logic

## Resources

- CLAUDE.md lines 55-87 (Service Layer Pattern - CRITICAL)
- CLAUDE.md lines 343-350 (Service files to port)
- Architecture Review Report (all agents identified this)
- Data Integrity Report, Critical Risk #1
- air-niugini-pms reference: `/Users/skycruzer/Desktop/Fleet Office Management/air-niugini-pms/src/lib/`

## Acceptance Criteria

- [ ] `lib/services/` directory created
- [ ] All 10 core services implemented
- [ ] Services use server Supabase client (`@/lib/supabase/server`)
- [ ] Seniority calculation working correctly
- [ ] Certification expiry validation implemented
- [ ] Leave eligibility logic functional
- [ ] All services have proper error handling
- [ ] TypeScript types properly applied
- [ ] Tests added for business logic
- [ ] No direct Supabase calls in API routes/components

## Work Log

### 2025-10-17 - Initial Discovery

**By:** Claude Triage System (all 6 agents)

**Actions:**

- Issue discovered during comprehensive code review
- All 6 agents independently identified this as #1 critical issue
- Categorized as P1 (CRITICAL) - blocks feature development
- Estimated effort: 3-5 days
- Marked as READY FOR IMPLEMENTATION

**Learnings:**

- Service layer is non-negotiable for data integrity
- Direct database calls lead to N+1 queries and data corruption
- Porting from v1 is faster than building from scratch
- This must be completed before any feature work

## Notes

- **Source**: Triage session on 2025-10-17
- **Blocking Issue**: All feature development blocked until complete
- **Reference Implementation**: air-niugini-pms v1 (production-proven)
- **Priority**: Complete this before P1-2 (validation) and P1-3 (transactions)
