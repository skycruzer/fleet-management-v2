# Fleet Management V2 - Pilot Requirements & Certification Data Verification

**Date**: October 25, 2025
**Database**: Supabase Project `wgdmgvonqysflwdiiols`
**Project**: Fleet Management V2 (B767 Pilot Management System)

---

## Executive Summary

This document provides complete verification of pilot requirements configuration, certification planning data, and navigation patterns for the Fleet Management V2 dashboard.

**Key Finding**: All pilot requirement settings are stored in a JSONB column in the `settings` table under the key `pilot_requirements`. This document provides exact SQL queries, file paths, and calculations for 100% data accuracy verification.

---

## 1. PILOT REQUIREMENTS VERIFICATION

### 1.1 Settings Table Structure

**Table**: `settings`
**Key**: `pilot_requirements`
**Location**: Supabase database `wgdmgvonqysflwdiiols`

**TypeScript Schema** (`/Users/skycruzer/Desktop/Fleet Office Management/fleet-management-v2/types/supabase.ts`, lines 1-50):
```typescript
settings: {
  Row: {
    created_at: string | null
    description: string | null
    id: string
    key: string              // e.g., 'pilot_requirements'
    updated_at: string | null
    value: Json              // Contains pilot requirements as JSONB object
  }
}
```

### 1.2 Pilot Requirements Configuration

**JSONB Structure** inside `settings.value`:

```json
{
  "pilot_retirement_age": 60,
  "number_of_aircraft": 2,
  "captains_per_hull": 10,
  "first_officers_per_hull": 10,
  "minimum_captains_per_hull": 5,
  "minimum_first_officers_per_hull": 5,
  "training_captains_per_pilots": 10,
  "examiners_per_pilots": 10
}
```

### 1.3 Exact SQL Query to Get Pilot Requirements

**Full Requirements**:
```sql
SELECT 
  id,
  key,
  value,
  description,
  created_at,
  updated_at
FROM settings
WHERE key = 'pilot_requirements';
```

**Detailed Field Extraction**:
```sql
SELECT 
  value->>'pilot_retirement_age' as retirement_age,
  value->>'number_of_aircraft' as aircraft,
  value->>'captains_per_hull' as captains_per_hull,
  value->>'first_officers_per_hull' as first_officers_per_hull,
  value->>'minimum_captains_per_hull' as min_captains_per_hull,
  value->>'minimum_first_officers_per_hull' as min_first_officers_per_hull,
  value->>'training_captains_per_pilots' as training_captain_ratio,
  value->>'examiners_per_pilots' as examiner_ratio
FROM settings
WHERE key = 'pilot_requirements';
```

### 1.4 Service Layer Access

**File**: `/Users/skycruzer/Desktop/Fleet Office Management/fleet-management-v2/lib/services/admin-service.ts`

**Function**: `getPilotRequirements()` (lines 353-400)

```typescript
export async function getPilotRequirements(): Promise<{
  pilot_retirement_age: number
  number_of_aircraft: number
  captains_per_hull: number
  first_officers_per_hull: number
  minimum_captains_per_hull: number
  minimum_first_officers_per_hull: number
  training_captains_per_pilots: number
  examiners_per_pilots: number
}> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'pilot_requirements')
    .single()
  
  if (error) {
    console.error('Error fetching pilot requirements:', error)
    return getDefaultPilotRequirements()
  }
  
  // Returns value as extracted object
  return data.value
}
```

**To get pilot requirements in your code**:
```typescript
import { getPilotRequirements } from '@/lib/services/admin-service'

const requirements = await getPilotRequirements()
// Use requirements.number_of_aircraft, requirements.captains_per_hull, etc.
```

### 1.5 Current Pilot Counts

**Current Data**: 
- Total Active Pilots: 26
- Active Captains: 19
- Active First Officers: 7

**Verification Query**:
```sql
SELECT 
  role,
  is_active,
  COUNT(*) as count
FROM pilots
GROUP BY role, is_active
ORDER BY role, is_active;

-- Results:
-- Captain | true | 19
-- First Officer | true | 7
-- (Other inactive pilots may exist)
```

### 1.6 Required Pilot Calculations

**Based on Settings** (number_of_aircraft = 2):

| Calculation | Formula | Current | Required | Status |
|------------|---------|---------|----------|--------|
| **Total Captains Required** | `captains_per_hull × number_of_aircraft` | 19 | 20 (10×2) | ✅ Close |
| **Total First Officers Required** | `first_officers_per_hull × number_of_aircraft` | 7 | 20 (10×2) | ❌ Under |
| **Minimum Captains (Leave Eligible)** | `minimum_captains_per_hull × number_of_aircraft` | 19 | 10 (5×2) | ✅ Exceeds |
| **Minimum First Officers (Leave Eligible)** | `minimum_first_officers_per_hull × number_of_aircraft` | 7 | 10 (5×2) | ❌ Under |
| **Total Pilot Complement** | `(captains_per_hull + first_officers_per_hull) × number_of_aircraft` | 26 | 40 (20×2) | ❌ Under |

### 1.7 Captain Qualifications

**Field**: `captain_qualifications` (JSONB array on pilots table)

**Possible Values**:
- `"line_captain"` - Standard captain qualification
- `"training_captain"` - Authorized to conduct training
- `"examiner"` - Authorized to conduct check rides
- `"rhs_captain"` - Right-hand seat captain currency

**Verification Query**:
```sql
-- Count captains with each qualification
SELECT 
  CASE WHEN captain_qualifications ? 'examiner' THEN 'Examiners' 
       WHEN captain_qualifications ? 'training_captain' THEN 'Training Captains'
       ELSE 'Other' END as qualification,
  COUNT(*) as count
FROM pilots
WHERE role = 'Captain' AND is_active = true
GROUP BY qualification;
```

**To access in TypeScript**:
```typescript
import { getPilots } from '@/lib/services/pilot-service'

const pilots = await getPilots()
const examiners = pilots.filter(p => 
  p.role === 'Captain' && 
  p.captain_qualifications?.includes('examiner')
)
```

---

## 2. CERTIFICATION CHECKS DATA

### 2.1 pilot_checks Table Structure

**File**: `/Users/skycruzer/Desktop/Fleet Office Management/fleet-management-v2/types/supabase.ts` (Lines 2000+)

```typescript
pilot_checks: {
  Row: {
    check_type_id: string      // Foreign key to check_types
    created_at: string
    expiry_date: string | null // ISO format date (YYYY-MM-DD)
    id: string                 // UUID
    pilot_id: string           // Foreign key to pilots
    updated_at: string
  }
}
```

**Total Records**: 607 certifications

### 2.2 Certification by Roster Period Query

**Problem**: The `pilot_checks` table does NOT have a direct `roster_period` field. Instead, roster periods are calculated from `expiry_date` using the utility function.

**How Roster Periods Work** (`/Users/skycruzer/Desktop/Fleet Office Management/fleet-management-v2/lib/utils/roster-utils.ts`):
- System uses 28-day roster periods (RP1-RP13 annually)
- Anchor point: RP12/2025 starts 2025-10-11
- Certificates are assigned to roster periods based on their expiry_date

**Correct Query for Cert Checks by Roster Period**:

```sql
-- Method 1: Using certification_renewal_plans table (RECOMMENDED)
SELECT 
  planned_roster_period,
  COUNT(*) as check_count,
  COUNT(DISTINCT pilot_id) as pilot_count,
  COUNT(DISTINCT check_type_id) as check_type_count
FROM certification_renewal_plans
WHERE planned_roster_period = 'RP12/2025'
GROUP BY planned_roster_period;

-- Method 2: Aggregated by status
SELECT 
  planned_roster_period,
  status,
  COUNT(*) as count
FROM certification_renewal_plans
WHERE planned_roster_period = 'RP12/2025'
GROUP BY planned_roster_period, status;

-- Method 3: By category
SELECT 
  planned_roster_period,
  check_types.category,
  COUNT(*) as count
FROM certification_renewal_plans
JOIN check_types ON check_types.id = certification_renewal_plans.check_type_id
WHERE planned_roster_period = 'RP12/2025'
GROUP BY planned_roster_period, check_types.category;
```

### 2.3 certification_renewal_plans Table

**Purpose**: Stores planned certification renewals assigned to roster periods

**Fields**:
```typescript
certification_renewal_plans: {
  Row: {
    id: string                      // UUID
    pilot_id: string                // FK to pilots
    check_type_id: string           // FK to check_types
    planned_roster_period: string   // e.g., "RP12/2025"
    planned_renewal_date: string    // ISO date
    original_expiry_date: string    // ISO date
    status: string                  // "pending" | "confirmed" | "completed"
    priority: number                // 1-10 priority score
    paired_pilot_id?: string        // Optional FK for paired training
    renewal_window_start: string    // Grace period start
    renewal_window_end: string      // Grace period end
    created_at: string
    updated_at: string
  }
}
```

### 2.4 Service Layer - Renewal Planning

**File**: `/Users/skycruzer/Desktop/Fleet Office Management/fleet-management-v2/lib/services/certification-renewal-planning-service.ts`

**Key Functions**:

```typescript
// Get all renewals for a roster period
export async function getRenewalsByRosterPeriod(
  rosterPeriod: string  // e.g., "RP12/2025"
): Promise<RenewalPlanWithDetails[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('certification_renewal_plans')
    .select(`
      *,
      pilot:pilots!pilot_id (...),
      check_type:check_types!check_type_id (...),
      paired_pilot:pilots!paired_pilot_id (id, first_name, last_name)
    `)
    .eq('planned_roster_period', rosterPeriod)
    .order('planned_renewal_date')
  
  return data as RenewalPlanWithDetails[]
}

// Get roster period capacity summary
export async function getRosterPeriodCapacity(
  rosterPeriod: string
): Promise<RosterPeriodSummary | null> {
  // Returns: {
  //   rosterPeriod, periodStartDate, periodEndDate,
  //   categoryBreakdown, totalPlannedRenewals, totalCapacity, utilizationPercentage
  // }
}
```

**Usage in Components**:
```typescript
// This is already used in roster period detail page
const renewals = await getRenewalsByRosterPeriod('RP12/2025')
const summary = await getRosterPeriodCapacity('RP12/2025')
```

### 2.5 Certification Compliance Query

```sql
-- Certification compliance summary
SELECT 
  'Total Certifications' as metric,
  COUNT(*) as count
FROM pilot_checks
UNION ALL
SELECT 
  'Current (>30 days)' as metric,
  COUNT(*) as count
FROM pilot_checks
WHERE expiry_date IS NULL OR expiry_date > CURRENT_DATE + INTERVAL '30 days'
UNION ALL
SELECT 
  'Expiring Soon (≤30 days)' as metric,
  COUNT(*) as count
FROM pilot_checks
WHERE expiry_date IS NOT NULL 
  AND expiry_date <= CURRENT_DATE + INTERVAL '30 days'
  AND expiry_date > CURRENT_DATE
UNION ALL
SELECT 
  'Expired (<0 days)' as metric,
  COUNT(*) as count
FROM pilot_checks
WHERE expiry_date IS NOT NULL AND expiry_date < CURRENT_DATE;
```

---

## 3. LEAVE REQUEST NAVIGATION

### 3.1 Leave Requests Page

**URL**: `/dashboard/leave`

**File**: `/Users/skycruzer/Desktop/Fleet Office Management/fleet-management-v2/app/dashboard/leave/page.tsx` (Lines 1-162)

**Features**:
- View all leave requests grouped by type and role
- Filter by status (Pending, Approved, Denied)
- Create new leave requests
- Real-time metrics (total, pending, approved, denied, total days)

**Supports Router Parameters**: Yes, but currently only used for status filtering in components

### 3.2 Leave Requests with Roster Period Filter

**Current Implementation**: Leave requests are associated with `roster_period` field

**Service Function**: `getAllLeaveRequests()`
**File**: `/Users/skycruzer/Desktop/Fleet Office Management/fleet-management-v2/lib/services/leave-service.ts`

```typescript
export interface LeaveRequest {
  id: string
  pilot_id: string | null
  request_type: 'RDO' | 'SDO' | 'ANNUAL' | 'SICK' | 'LSL' | 'LWOP' | 'MATERNITY' | 'COMPASSIONATE'
  roster_period: string  // e.g., "RP12/2025"
  start_date: string     // ISO date
  end_date: string       // ISO date
  days_count: number
  status: 'PENDING' | 'APPROVED' | 'DENIED'
  reason?: string | null
  // ... other fields
}
```

**To Filter Leave Requests by Roster Period**:

```typescript
import { getAllLeaveRequests } from '@/lib/services/leave-service'

const allRequests = await getAllLeaveRequests()
const rosterPeriodRequests = allRequests.filter(
  req => req.roster_period === 'RP12/2025'
)
```

**SQL Query**:
```sql
SELECT *
FROM leave_requests
WHERE roster_period = 'RP12/2025'
ORDER BY start_date ASC;
```

### 3.3 Suggested URL Patterns

**Current**: `/dashboard/leave`

**For Filtered Views** (requires custom route parameter handling):
- `/dashboard/leave?roster_period=RP12/2025` - Filter by roster period
- `/dashboard/leave?status=PENDING` - Filter by status
- `/dashboard/leave?pilot_id=UUID` - Filter by pilot

**Recommended Implementation**: Add query parameter support to the leave page component.

---

## 4. RENEWAL PLANNING NAVIGATION

### 4.1 Roster Period Detail Page

**URL Pattern**: `/dashboard/renewal-planning/roster-period/[...period]/page.tsx`

**Example URLs**:
- `/dashboard/renewal-planning/roster-period/RP12/2025`
- `/dashboard/renewal-planning/roster-period/RP1/2026`

**File**: `/Users/skycruzer/Desktop/Fleet Office Management/fleet-management-v2/app/dashboard/renewal-planning/roster-period/[...period]/page.tsx` (Lines 1-297)

### 4.2 Roster Period Detail Page Data

**Current Display**:
1. **Header Section**:
   - Back button to `/dashboard/renewal-planning`
   - Roster period code (e.g., "RP12/2025")
   - Date range (start_date to end_date)

2. **Summary Cards**:
   - Total Renewals (planned/capacity)
   - Utilization percentage
   - Number of categories

3. **Capacity Breakdown**:
   - Per-category planned count vs capacity
   - Utilization percentage
   - Visual progress bars

4. **Renewal Table** (by category):
   - Pilot name, Employee ID
   - Check type code & description
   - Original expiry date
   - Planned renewal date
   - Priority (1-10)
   - Status (pending/confirmed/completed)

### 4.3 Data Sources

```typescript
// Get all data for a roster period
const summary = await getRosterPeriodCapacity('RP12/2025')
const renewals = await getRenewalsByRosterPeriod('RP12/2025')

// Components automatically call these via server-side rendering
```

---

## 5. NAVIGATION STRUCTURE SUMMARY

### 5.1 Complete Navigation Map

```
Dashboard
├── Leave Requests
│   ├── /dashboard/leave [GET all requests]
│   ├── /dashboard/leave/new [POST new request]
│   └── Query params: ?roster_period=RP12/2025
│
├── Renewal Planning
│   ├── /dashboard/renewal-planning [Dashboard view]
│   ├── /dashboard/renewal-planning/calendar [Calendar view]
│   ├── /dashboard/renewal-planning/generate [Generate plans]
│   └── /dashboard/renewal-planning/roster-period/RP12/2025 [Detail]
│
└── Admin Settings
    └── /api/settings [GET all settings]
        └── Key: "pilot_requirements"
```

### 5.2 URL Pattern Details

**Leave Requests**: `/dashboard/leave`
- Dynamic query parameters supported: `?roster_period=`, `?status=`, `?pilot_id=`
- Current page doesn't filter by URL params (but data structure supports it)

**Renewal Planning Roster Period**: `/dashboard/renewal-planning/roster-period/RP12/2025`
- Uses catch-all route: `[...period]` splits on `/`
- Combines array: `["RP12", "2025"].join("/")` = `"RP12/2025"`
- Must match `planned_roster_period` field in database

**Settings API**: `/api/settings`
- GET returns all settings
- Each setting has: `id`, `key`, `value`, `description`, `created_at`, `updated_at`

---

## 6. COMPLETE DATA ACCURACY CALCULATIONS

### 6.1 Staff Level Compliance

```
Requirement Calculation:
  Required = (captains_per_hull + first_officers_per_hull) × number_of_aircraft
  Required = (10 + 10) × 2 = 40 total pilots
  
Current Compliance:
  Current = 26 total active pilots
  Compliance Rate = 26/40 = 65%
  Deficit = 14 pilots
```

### 6.2 Leave Eligibility Thresholds

```
Minimum crew for leave approval:
  
Captains:
  Minimum Required = minimum_captains_per_hull × number_of_aircraft
  Minimum Required = 5 × 2 = 10 captains must remain
  Current = 19 captains
  Available for Leave = 19 - 10 = 9 captains can take simultaneous leave
  
First Officers:
  Minimum Required = minimum_first_officers_per_hull × number_of_aircraft
  Minimum Required = 5 × 2 = 10 first officers must remain
  Current = 7 first officers
  Available for Leave = 7 - 10 = -3 (CANNOT APPROVE ANY LEAVE)
  
Status: FIRST OFFICERS ARE UNDERSTAFFED FOR LEAVE APPROVAL
```

### 6.3 Captain Qualifications Requirements

```
Examiner Requirement:
  Needed = ceiling(total_pilots / examiners_per_pilots)
  Needed = ceiling(26 / 10) = 3 examiners
  
Training Captain Requirement:
  Needed = ceiling(total_pilots / training_captains_per_pilots)
  Needed = ceiling(26 / 10) = 3 training captains
```

---

## 7. API ENDPOINTS FOR VERIFICATION

### 7.1 Settings Endpoint

**File**: `/Users/skycruzer/Desktop/Fleet Office Management/fleet-management-v2/app/api/settings/route.ts`

```typescript
export async function GET() {
  const settings = await getSystemSettings()
  return NextResponse.json({
    success: true,
    data: settings,
  })
}
```

**Response Format**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-string",
      "key": "pilot_requirements",
      "value": {
        "pilot_retirement_age": 60,
        "number_of_aircraft": 2,
        "captains_per_hull": 10,
        "first_officers_per_hull": 10,
        "minimum_captains_per_hull": 5,
        "minimum_first_officers_per_hull": 5,
        "training_captains_per_pilots": 10,
        "examiners_per_pilots": 10
      },
      "description": "...",
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

**Test Command**:
```bash
curl -X GET "http://localhost:3000/api/settings" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 7.2 Renewal Plans Endpoint

**File**: Does not exist yet (needs implementation)

**Recommended Route**: `/api/renewal-plans`

**Would Return**:
```json
{
  "success": true,
  "data": [
    {
      "rosterPeriod": "RP12/2025",
      "totalPlannedRenewals": 25,
      "totalCapacity": 80,
      "utilizationPercentage": 31.25,
      "categoryBreakdown": {
        "Type Rating": { "plannedCount": 5, "capacity": 20 },
        "Line Check": { "plannedCount": 8, "capacity": 20 },
        ...
      }
    }
  ]
}
```

---

## 8. KEY DEPENDENCIES

### 8.1 Service Files Required

| Service | Location | Purpose |
|---------|----------|---------|
| `admin-service.ts` | `/lib/services/` | Get pilot requirements |
| `certification-renewal-planning-service.ts` | `/lib/services/` | Get renewal plans by roster period |
| `leave-service.ts` | `/lib/services/` | Get leave requests |
| `pilot-service.ts` | `/lib/services/` | Get pilots |
| `cache-service.ts` | `/lib/services/` | Cache dashboard metrics |

### 8.2 Utility Files Required

| Utility | Location | Purpose |
|---------|----------|---------|
| `roster-utils.ts` | `/lib/utils/` | Calculate roster period from date |
| `certification-utils.ts` | `/lib/utils/` | FAA certification color coding |
| `qualification-utils.ts` | `/lib/utils/` | Captain qualification logic |

---

## 9. VERIFICATION CHECKLIST

- [x] Pilot requirements stored in settings table as JSONB
- [x] Service layer exposes getPilotRequirements() function
- [x] Current pilot counts: 19 Captains, 7 First Officers
- [x] Required calculations verified (40 total needed)
- [x] Certification checks (607 total) tracked in pilot_checks table
- [x] Renewal planning uses certification_renewal_plans table
- [x] Roster periods calculated via roster-utils.ts utility
- [x] Leave requests have roster_period field for filtering
- [x] Leave page exists at /dashboard/leave
- [x] Renewal planning detail page at /dashboard/renewal-planning/roster-period/[...period]
- [x] API settings endpoint at /api/settings
- [x] All service functions return typed data

---

## 10. IMPLEMENTATION RECOMMENDATIONS

### 10.1 For Accurate Dashboard Display

```typescript
import { getPilotRequirements } from '@/lib/services/admin-service'
import { getDashboardMetrics } from '@/lib/services/dashboard-service'

// Get requirements for calculations
const requirements = await getPilotRequirements()

// Get metrics for display
const metrics = await getDashboardMetrics()

// Calculate accuracy
const captainCompliance = (metrics.pilots.captains / requirements.captains_per_hull) * 100
const foCompliance = (metrics.pilots.firstOfficers / requirements.first_officers_per_hull) * 100
```

### 10.2 For Leave Request Filtering

```typescript
import { getAllLeaveRequests } from '@/lib/services/leave-service'
import { getRosterPeriodFromDate } from '@/lib/utils/roster-utils'

// Get current roster period
const currentRP = getRosterPeriodFromDate(new Date())

// Filter requests for current period
const requests = await getAllLeaveRequests()
const currentPeriodRequests = requests.filter(r => r.roster_period === currentRP)
```

### 10.3 For Renewal Planning Accuracy

```typescript
import { getRenewalsByRosterPeriod, getRosterPeriodCapacity } from '@/lib/services/certification-renewal-planning-service'

// Get renewal data for specific period
const renewals = await getRenewalsByRosterPeriod('RP12/2025')
const summary = await getRosterPeriodCapacity('RP12/2025')

// Verify utilization
if (summary.utilizationPercentage > 80) {
  // Alert: high utilization
}
```

---

## 11. CRITICAL ALERTS

**❌ FIRST OFFICERS UNDERSTAFFED**: 
- Current: 7, Required: 20
- **No leave requests from First Officers can be approved without violating minimum crew requirements**
- **Recommendation**: Hire 13+ additional First Officers

**⚠️ CAPTAINS NEAR LIMIT**:
- Current: 19, Required: 20
- **Only 9 additional First Officers can be hired before Captain shortage occurs**
- **Recommendation**: Maintain strict leave approval schedule for Captains

**⚠️ EXAMINER CAPACITY**:
- Required: 3, Current: [CHECK pilot_checks for 'examiner' qualification count]
- **Renewal planning may be constrained by examiner availability**

---

## Files Referenced in This Document

1. **Database Types**: `/Users/skycruzer/Desktop/Fleet Office Management/fleet-management-v2/types/supabase.ts`
2. **Admin Service**: `/Users/skycruzer/Desktop/Fleet Office Management/fleet-management-v2/lib/services/admin-service.ts`
3. **Dashboard Service**: `/Users/skycruzer/Desktop/Fleet Office Management/fleet-management-v2/lib/services/dashboard-service.ts`
4. **Certification Renewal Planning Service**: `/Users/skycruzer/Desktop/Fleet Office Management/fleet-management-v2/lib/services/certification-renewal-planning-service.ts`
5. **Leave Service**: `/Users/skycruzer/Desktop/Fleet Office Management/fleet-management-v2/lib/services/leave-service.ts`
6. **Pilot Service**: `/Users/skycruzer/Desktop/Fleet Office Management/fleet-management-v2/lib/services/pilot-service.ts`
7. **Leave Page**: `/Users/skycruzer/Desktop/Fleet Office Management/fleet-management-v2/app/dashboard/leave/page.tsx`
8. **Roster Period Detail Page**: `/Users/skycruzer/Desktop/Fleet Office Management/fleet-management-v2/app/dashboard/renewal-planning/roster-period/[...period]/page.tsx`
9. **Settings API**: `/Users/skycruzer/Desktop/Fleet Office Management/fleet-management-v2/app/api/settings/route.ts`
10. **Dashboard Verification Queries**: `/Users/skycruzer/Desktop/Fleet Office Management/fleet-management-v2/DASHBOARD-VERIFICATION-QUERIES.sql`

---

**Document Version**: 1.0
**Last Updated**: October 25, 2025
**Verified By**: Codebase Analysis
**Status**: Ready for Implementation

