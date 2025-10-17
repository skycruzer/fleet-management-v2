# Service Layer Migration Guide
## From air-niugini-pms (v1) to fleet-management-v2 (v2)

**Status**: IN PROGRESS
**Date**: 2025-10-17
**Implemented By**: Claude Code

---

## Migration Checklist

### ✅ Completed Services (1/10)

1. **pilot-service.ts** ✓
   - Status: COMPLETE
   - Size: 40KB → 20KB (condensed, removed client/server branching)
   - Updates:
     - Changed imports to `@/lib/supabase/server`
     - All functions now use `await createClient()`
     - Removed client-side branching (server-only)
     - Retained seniority calculations and business logic
   - Location: `/lib/services/pilot-service.ts`

### 🔄 Pending Services (9/10)

2. **leave-service.ts**
   - Status: PENDING
   - Size: 14KB
   - Key Functions: createLeaveRequest, updateLeaveRequest, getLeaveRequests, deleteLeaveRequest
   - Business Logic: 28-day roster periods, status management

3. **leave-eligibility-service.ts**
   - Status: PENDING
   - Size: 43KB (COMPLEX)
   - Key Functions: checkLeaveEligibility, calculateCrewAvailability, getRankSeparatedEligibility
   - Business Logic: **CRITICAL** - Rank-separated minimum crew requirements (10 Captains, 10 First Officers)

4. **expiring-certifications-service.ts**
   - Status: PENDING
   - Size: 5KB
   - Key Functions: getExpiringCertifications
   - Business Logic: FAA color coding (red/yellow/green), roster period calculations

5. **dashboard-service.ts**
   - Status: PENDING
   - Size: 11KB
   - Key Functions: getDashboardMetrics, getLeaveMetrics, getAlertMetrics, getRetirementMetrics
   - Dependencies: Uses cache-service, pilot-service

6. **analytics-service.ts**
   - Status: PENDING
   - Size: 11KB
   - Key Functions: getPilotAnalytics, getCertificationAnalytics, getLeaveAnalytics, getFleetAnalytics
   - Dependencies: Uses analytics-data-service (needs creation)

7. **pdf-data-service.ts** → **pdf-service.ts**
   - Status: PENDING
   - Size: 35KB (LARGE)
   - Key Functions: generateComplianceReportData, generatePilotReportData, generateFleetManagementReportData
   - Dependencies: Uses expiring-certifications-service, settings-service

8. **cache-service.ts**
   - Status: PENDING
   - Size: 20KB
   - Key Functions: get, set, getPilotStats, getCheckTypes, getContractTypes, getSettings
   - Business Logic: TTL-based caching, automatic cleanup, enhanced features

9. **audit-log-service.ts** → **audit-service.ts**
   - Status: PENDING
   - Size: 19KB
   - Key Functions: getAuditLogs, getAuditStats, getUserActivitySummary, exportAuditLogsToCSV
   - Business Logic: Comprehensive audit trail with pagination

10. **certification-service.ts** (NEW)
    - Status: PENDING
    - Size: TBD
    - Key Functions: getCertifications, updateCertification, batchUpdateCertifications
    - Business Logic: Extract certification CRUD from pilot-service

---

## Migration Pattern (Template for Remaining Services)

### Standard Next.js 15 Migration Steps:

```typescript
/**
 * [Service Name] for Fleet Management V2
 * Ported from air-niugini-pms v1 with Next.js 15 updates
 *
 * @version 2.0.0
 * @since 2025-10-17
 */

// 1. UPDATE IMPORTS
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

// 2. TYPE ALIASES (from generated Supabase types)
type TableName = Database['public']['Tables']['table_name']['Row']
type TableInsert = Database['public']['Tables']['table_name']['Insert']
type TableUpdate = Database['public']['Tables']['table_name']['Update']

// 3. REPLACE ALL FUNCTIONS
export async function functionName() {
  // OLD v1 PATTERN (REMOVE):
  // const supabaseAdmin = getSupabaseAdmin()
  // if (typeof window !== 'undefined') { /* client logic */ }

  // NEW v2 PATTERN (USE):
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('table_name')
      .select('*')

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error in functionName:', error)
    throw error
  }
}
```

### Key Migration Rules:

1. **Import Changes**:
   - `from './supabase'` → `from '@/lib/supabase/server'`
   - `from '@/lib/[utility]'` → `from '@/lib/utils/[utility]'` (if moved)

2. **Supabase Client**:
   - Remove: `getSupabaseAdmin()`, `supabase` (browser client)
   - Add: `const supabase = await createClient()` (at start of every function)

3. **Remove Client/Server Branching**:
   - Delete: `if (typeof window !== 'undefined')`
   - Delete: All API fetch calls (services are server-only)

4. **Error Handling**:
   - Replace: `logger.error()` → `console.error()` (until logger is ported)
   - Keep: All try/catch blocks

5. **Business Logic**:
   - **PRESERVE**: All calculations, validations, and business rules
   - **PRESERVE**: Type definitions and interfaces
   - **PRESERVE**: Helper functions and utilities

---

## Critical Business Logic to Preserve

### 1. Leave Eligibility (leave-eligibility-service.ts)
- **Rank Separation**: Captains and First Officers evaluated independently
- **Minimum Crew**: 10 Captains AND 10 First Officers required
- **Priority**: Seniority number (lower = higher priority)

### 2. Roster Periods (roster-utils.ts)
- **28-day cycles**: RP1-RP13 annual cycle (13 periods × 28 days = 364 days)
- **Known anchor**: RP12/2025 starts 2025-10-11
- **Rollover**: After RP13/YYYY → RP1/(YYYY+1)

### 3. Certification Status (certification-utils.ts)
- **Red**: Expired (days_until_expiry < 0)
- **Yellow**: Expiring soon (days_until_expiry ≤ 30)
- **Green**: Current (days_until_expiry > 30)

### 4. Seniority Calculation (pilot-service.ts)
- Based on `commencement_date`
- Earlier date = lower seniority number = higher priority
- Automatic recalculation on commencement date changes

---

## Dependencies Map

```
pilot-service.ts (DONE)
  ├─ certification-utils.ts
  ├─ retirement-utils.ts
  └─ pagination-utils.ts

leave-service.ts
  ├─ roster-utils.ts
  └─ pilot-service.ts

leave-eligibility-service.ts (COMPLEX)
  ├─ leave-service.ts
  ├─ pilot-service.ts
  └─ roster-utils.ts

expiring-certifications-service.ts
  ├─ certification-utils.ts
  └─ roster-utils.ts

dashboard-service.ts
  ├─ cache-service.ts
  ├─ pilot-service.ts
  └─ leave-service.ts

analytics-service.ts
  ├─ analytics-data-service.ts (NEW)
  ├─ pilot-service.ts
  └─ cache-service.ts

pdf-service.ts (RENAMED)
  ├─ expiring-certifications-service.ts
  ├─ settings-service.ts (NEW)
  ├─ pilot-service.ts
  └─ leave-service.ts

cache-service.ts (STANDALONE)
  └─ (no dependencies)

audit-service.ts (RENAMED, STANDALONE)
  └─ (no dependencies)

certification-service.ts (NEW)
  ├─ pilot-service.ts
  └─ certification-utils.ts
```

---

## Testing After Migration

For each service, verify:

1. **TypeScript Compilation**: `npm run type-check`
2. **Import Resolution**: All `@/` imports resolve correctly
3. **Supabase Client**: All functions use `await createClient()`
4. **Business Logic**: All calculations produce same results as v1
5. **Error Handling**: All errors are caught and logged

---

## Next Steps

1. Port remaining services in dependency order:
   - cache-service.ts (no dependencies)
   - audit-service.ts (no dependencies)
   - expiring-certifications-service.ts
   - leave-service.ts
   - leave-eligibility-service.ts (COMPLEX - requires careful testing)
   - dashboard-service.ts
   - analytics-service.ts
   - pdf-service.ts
   - certification-service.ts (NEW)

2. Create utility files in `/lib/utils/`:
   - certification-utils.ts
   - roster-utils.ts
   - retirement-utils.ts
   - pagination-utils.ts

3. Test each service with integration tests

4. Update todo file to "done" status

---

## Notes

- All services are server-side only in v2
- Client components will use API routes that call these services
- Maintain 100% business logic compatibility with v1
- Use generated TypeScript types from `@/types/supabase`
- Follow Next.js 15 async patterns (`await createClient()`, `await cookies()`)
