# Certification Renewal Planning System - Technical Specification

**Date**: October 24, 2025
**Author**: BMad Business Analyst (Mary)
**Status**: Design Phase
**Version**: 1.0

---

## Executive Summary

This document outlines a comprehensive certification renewal planning system designed to distribute pilot certification renewals evenly throughout the year across 13 roster periods (28-day cycles). The system prevents clustering of renewals by intelligently scheduling pilot pairs based on grace periods, expiry dates, and roster period alignment.

**Key Goals**:

1. Prevent all pilots from renewing certifications at the same time
2. Distribute pilot pairs across 13 roster periods (RP1-RP13)
3. Respect certification-specific grace periods
4. Integrate seamlessly with existing 28-day roster system
5. Maintain operational readiness while managing renewals

---

## Current State Analysis

### Database Statistics (as of October 2025)

**Overall Fleet**:

- Total Pilots: 27
- Total Certification Records: 607
- Active Check Types: 34
- Categories: 8

**Category Distribution**:
| Category | Pilots | Total Certs | Current | Expired | Expiring ≤90 Days |
|----------|--------|-------------|---------|---------|-------------------|
| **Pilot Medical** | 26 | 36 | 30 | 0 | 12 |
| **Simulator Checks** | 26 | 52 | 51 | 1 | 15 |
| **Flight Checks** | 26 | 54 | 43 | 3 | 4 |
| **Ground Courses** | 26 | 156 | 153 | 1 | 29 |
| **ID Cards** | 26 | 52 | 52 | 0 | 0 |
| **Foreign Work Permit** | 11 | 35 | 28 | 0 | 0 |
| **Travel Visa** | 10 | 35 | 14 | 3 | 4 |
| **Non-renewal** | 26 | 187 | 143 | 2 | 0 |

### Critical Findings

**Immediate Clustering Risks** (Next 90 Days):

- **December 2025**: 36 certifications expiring (21 Ground Courses, 6 Simulator, 4 Flight, 3 Medical, 2 Visa)
  - 16 unique pilots affected across Ground Courses alone
- **November 2025**: 18 certifications expiring (7 Ground, 6 Simulator, 4 Medical, 1 Visa)
  - High concentration of renewals

**Medium-Term Concerns** (90-180 Days):

- **January 2026**: 11 certifications (6 Medical, 3 Simulator, 2 Ground)
- **February 2026**: 17 certifications (9 Simulator, 4 Medical, 3 Ground, 1 Visa)
- **March 2026**: 23 certifications (9 Ground, 5 Medical, 5 ID Cards, 4 Flight)

**Key Insights**:

1. Ground Courses show the most clustering (26 pilots all on similar cycles)
2. Medical certifications cluster around specific months (biannual or annual renewals)
3. Simulator checks distribute more evenly but still show concentration
4. Flight checks are relatively well-distributed already

---

## Business Requirements

### Grace Period Rules

Based on aviation regulations and user requirements:

| Certification Type   | Grace Period | Renewal Window                  | Examples                      |
| -------------------- | ------------ | ------------------------------- | ----------------------------- |
| **Pilot Medical**    | 28 days      | Can renew 28 days before expiry | MEDI, MEDI_OVER60             |
| **Flight Checks**    | 90 days      | Can renew 90 days before expiry | B767_RTC, RHS_RTC, INSTR_AUTH |
| **Simulator Checks** | 90 days      | Can renew 90 days before expiry | B767_IRR, B767_COMP           |
| **Ground Courses**   | 60 days      | Can renew 60 days before expiry | DGA, AVSEC, SMS1, SEP, CRM    |
| **ID Cards**         | 0 days       | Renew on or after expiry        | PNG_ASIC, PX_ID_CARD          |
| **Work Permits**     | 0 days       | Renew on or after expiry        | WORK_PERMIT, VISA_EMPLOY      |
| **Travel Visas**     | 0 days       | Renew on or after expiry        | VISA_AUST, VISA_CHINA         |

### Distribution Strategy

**Primary Goal**: Distribute pilot pairs evenly across 13 roster periods per year

**Pairing Logic**:

- 27 pilots = 13 pairs + 1 single pilot
- Prioritize pairing pilots with similar certification expiry dates
- Consider seniority for fairness (lower seniority number = higher priority for preferred dates)
- Allow flexibility for pilot preferences when possible

**Roster Period Alignment** (28-Day Cycles):

- **Known Anchor**: RP12/2025 starts October 11, 2025
- Each roster period is exactly 28 days
- After RP13/YYYY → automatically rolls to RP1/(YYYY+1)
- Planning should align renewal dates to roster period start dates for operational simplicity

**Load Balancing**:

- Calculate total renewals needed per category per year
- Distribute evenly: `renewals_per_period = total_renewals / 13`
- Adjust for months with higher concentration (December, February)
- Prevent more than 4 pilots (2 pairs) off simultaneously for same certification type

---

## Technical Design

### Database Schema

#### 1. New Table: `certification_renewal_plans`

Stores the planned renewal schedule for each pilot's certifications.

```sql
CREATE TABLE certification_renewal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  pilot_id UUID NOT NULL REFERENCES pilots(id) ON DELETE CASCADE,
  check_type_id UUID NOT NULL REFERENCES check_types(id) ON DELETE CASCADE,

  -- Planning Details
  original_expiry_date DATE NOT NULL,        -- Current expiry date
  planned_renewal_date DATE NOT NULL,        -- Suggested renewal date
  planned_roster_period VARCHAR(20) NOT NULL, -- e.g., "RP03/2026"
  renewal_window_start DATE NOT NULL,        -- Grace period start (earliest renewal)
  renewal_window_end DATE NOT NULL,          -- Original expiry (latest renewal)

  -- Pairing Information
  paired_pilot_id UUID REFERENCES pilots(id), -- If paired with another pilot
  pair_group_id UUID,                        -- Groups multiple pilots for same renewal

  -- Status Tracking
  status VARCHAR(20) NOT NULL DEFAULT 'planned', -- planned, confirmed, in_progress, completed, cancelled
  priority INTEGER NOT NULL DEFAULT 0,        -- Higher = more urgent (0-10 scale)
  notes TEXT,                                 -- Admin notes for special considerations

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES an_users(id),

  -- Constraints
  CONSTRAINT unique_pilot_check_plan UNIQUE (pilot_id, check_type_id, original_expiry_date),
  CONSTRAINT valid_status CHECK (status IN ('planned', 'confirmed', 'in_progress', 'completed', 'cancelled'))
);

-- Indexes for performance
CREATE INDEX idx_renewal_plans_pilot ON certification_renewal_plans(pilot_id);
CREATE INDEX idx_renewal_plans_check_type ON certification_renewal_plans(check_type_id);
CREATE INDEX idx_renewal_plans_roster_period ON certification_renewal_plans(planned_roster_period);
CREATE INDEX idx_renewal_plans_planned_date ON certification_renewal_plans(planned_renewal_date);
CREATE INDEX idx_renewal_plans_status ON certification_renewal_plans(status);
CREATE INDEX idx_renewal_plans_pair_group ON certification_renewal_plans(pair_group_id);
```

#### 2. New Table: `roster_period_capacity`

Tracks the planning capacity for each roster period to prevent overloading.

```sql
CREATE TABLE roster_period_capacity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Roster Period
  roster_period VARCHAR(20) NOT NULL UNIQUE, -- "RP01/2026"
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,

  -- Capacity Limits
  max_pilots_per_category JSONB NOT NULL DEFAULT '{}', -- { "Medical": 4, "Simulator": 6, "Flight": 4, "Ground": 8 }
  current_allocations JSONB NOT NULL DEFAULT '{}',     -- { "Medical": 2, "Simulator": 3, ... }

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_roster_capacity_period ON roster_period_capacity(roster_period);
```

#### 3. New Table: `renewal_plan_history`

Audit trail for plan changes.

```sql
CREATE TABLE renewal_plan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  renewal_plan_id UUID NOT NULL REFERENCES certification_renewal_plans(id) ON DELETE CASCADE,

  -- Change Details
  change_type VARCHAR(50) NOT NULL, -- created, rescheduled, paired, unpaired, confirmed, cancelled, completed
  previous_date DATE,
  new_date DATE,
  previous_roster_period VARCHAR(20),
  new_roster_period VARCHAR(20),
  reason TEXT,

  -- Metadata
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  changed_by UUID REFERENCES an_users(id)
);

-- Index
CREATE INDEX idx_renewal_history_plan ON renewal_plan_history(renewal_plan_id);
```

---

### Planning Algorithm

#### Phase 1: Data Collection & Analysis

**Input**:

- All pilot certifications from `pilot_checks` table
- Current roster period system from `roster-utils.ts`
- Grace period rules by category

**Process**:

1. **Fetch all certifications** with `expiry_date >= CURRENT_DATE`
2. **Group by category** (Medical, Flight, Simulator, Ground)
3. **Calculate renewal windows** for each certification:
   ```typescript
   const gracePeriod = getGracePeriod(checkType.category)
   const renewalWindowStart = subDays(expiryDate, gracePeriod)
   const renewalWindowEnd = expiryDate
   ```
4. **Identify clustering** - find months with >15% of pilots expiring in same category

**Output**: Structured data showing concentration by month and category

---

#### Phase 2: Optimal Roster Period Assignment

**Goal**: Assign each certification to an optimal roster period within its renewal window

**Algorithm**:

```typescript
function assignOptimalRosterPeriod(certification, allCertifications) {
  const { renewalWindowStart, renewalWindowEnd, category } = certification

  // Step 1: Get all eligible roster periods within renewal window
  const eligiblePeriods = getRosterPeriodsInRange(renewalWindowStart, renewalWindowEnd)

  // Step 2: Calculate "load" for each eligible period in this category
  const periodLoads = eligiblePeriods.map((period) => ({
    period,
    currentLoad: countPlannedRenewals(period, category, allCertifications),
    capacity: getCapacity(period, category),
  }))

  // Step 3: Select period with lowest load (balance across year)
  const optimalPeriod = periodLoads.reduce((best, current) =>
    current.currentLoad < best.currentLoad ? current : best
  )

  // Step 4: If load would exceed capacity, select next-best period
  if (optimalPeriod.currentLoad >= optimalPeriod.capacity) {
    return (
      periodLoads
        .filter((p) => p.currentLoad < p.capacity)
        .sort((a, b) => a.currentLoad - b.currentLoad)[0]?.period || eligiblePeriods[0]
    )
  }

  return optimalPeriod.period
}
```

**Capacity Limits** (per roster period per category):

- Medical: 4 pilots (2 pairs)
- Flight Checks: 4 pilots (2 pairs)
- Simulator Checks: 6 pilots (3 pairs)
- Ground Courses: 8 pilots (4 pairs) - higher capacity due to frequency

---

#### Phase 3: Pilot Pairing

**Goal**: Pair pilots with similar expiry dates to reduce operational impact

**Algorithm**:

```typescript
function pairPilotsForRenewal(pilotsInPeriod, category) {
  // Step 1: Sort pilots by seniority (fairness)
  const sortedPilots = pilotsInPeriod.sort((a, b) => a.seniority_number - b.seniority_number)

  // Step 2: Group into pairs
  const pairs = []
  for (let i = 0; i < sortedPilots.length; i += 2) {
    if (i + 1 < sortedPilots.length) {
      // Pair exists
      pairs.push({
        pilot1: sortedPilots[i],
        pilot2: sortedPilots[i + 1],
        groupId: generateUUID(),
      })
    } else {
      // Single pilot (odd number)
      pairs.push({
        pilot1: sortedPilots[i],
        pilot2: null,
        groupId: generateUUID(),
      })
    }
  }

  return pairs
}
```

**Pairing Priority**:

1. Lower seniority number gets first choice of roster period
2. Pilots with multiple certifications expiring in same window get priority
3. Consider pilot preferences if system allows input

---

#### Phase 4: Schedule Generation

**Output**: Complete renewal schedule for all pilots for the next 12 months

**Data Structure**:

```typescript
interface RenewalPlan {
  planId: string
  pilotId: string
  pilotName: string
  seniorityNumber: number
  checkType: {
    id: string
    code: string
    description: string
    category: string
  }
  originalExpiryDate: Date
  plannedRenewalDate: Date
  plannedRosterPeriod: string // "RP03/2026"
  renewalWindowStart: Date
  renewalWindowEnd: Date
  pairedWithPilotId?: string
  pairedWithPilotName?: string
  pairGroupId?: string
  status: 'planned' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  priority: number // 0-10 (10 = most urgent)
  notes?: string
}

interface RosterPeriodSummary {
  rosterPeriod: string
  periodStartDate: Date
  periodEndDate: Date
  categoryBreakdown: {
    [category: string]: {
      plannedCount: number
      capacity: number
      pilots: Array<{ id: string; name: string; checkType: string }>
    }
  }
  totalPlannedRenewals: number
  totalCapacity: number
  utilizationPercentage: number
}
```

---

### Service Layer Architecture

#### 1. `lib/services/certification-renewal-planning-service.ts`

**Core Functions**:

```typescript
// Generate complete renewal plan for next 12 months
async function generateRenewalPlan(options?: { monthsAhead: number }): Promise<RenewalPlan[]>

// Get renewal plan for specific pilot
async function getPilotRenewalPlan(pilotId: string): Promise<RenewalPlan[]>

// Get all renewals planned for specific roster period
async function getRenewalsByRosterPeriod(rosterPeriod: string): Promise<RenewalPlan[]>

// Update planned renewal date
async function updatePlannedRenewalDate(
  planId: string,
  newDate: Date,
  reason: string
): Promise<RenewalPlan>

// Confirm renewal plan
async function confirmRenewalPlan(planId: string, confirmedBy: string): Promise<RenewalPlan>

// Mark renewal as completed
async function completeRenewal(planId: string, actualDate: Date): Promise<RenewalPlan>

// Get roster period capacity summary
async function getRosterPeriodCapacity(rosterPeriod: string): Promise<RosterPeriodSummary>

// Check if roster period has capacity for additional renewal
async function checkCapacity(
  rosterPeriod: string,
  category: string
): Promise<{ hasCapacity: boolean; available: number; total: number }>

// Pair two pilots for same renewal window
async function pairPilots(
  pilot1Id: string,
  pilot2Id: string,
  checkTypeId: string,
  rosterPeriod: string
): Promise<{ pair1: RenewalPlan; pair2: RenewalPlan }>

// Unpair pilots
async function unpairPilots(pairGroupId: string): Promise<void>

// Get clustering analysis
async function getClusteringAnalysis(): Promise<{
  highRisk: RosterPeriodSummary[]
  mediumRisk: RosterPeriodSummary[]
  lowRisk: RosterPeriodSummary[]
}>
```

---

### API Endpoints

#### `POST /api/renewal-planning/generate`

Generate complete renewal plan for all pilots.

**Request**:

```json
{
  "monthsAhead": 12,
  "categories": ["Medical", "Flight Checks", "Simulator Checks", "Ground Courses"]
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "totalPlans": 250,
    "byCategory": {
      "Medical": 52,
      "Flight Checks": 48,
      "Simulator Checks": 52,
      "Ground Courses": 98
    },
    "rosterPeriodSummary": [
      {
        "rosterPeriod": "RP01/2026",
        "totalRenewals": 18,
        "capacity": 24,
        "utilization": 75
      }
    ],
    "clusteringWarnings": [
      {
        "rosterPeriod": "RP12/2025",
        "category": "Ground Courses",
        "count": 21,
        "capacity": 8,
        "exceeded": true
      }
    ]
  }
}
```

#### `GET /api/renewal-planning/pilot/:pilotId`

Get renewal plan for specific pilot.

**Response**:

```json
{
  "success": true,
  "data": {
    "pilotId": "abc123",
    "pilotName": "John Doe",
    "renewals": [
      {
        "checkType": "Aviation Medical",
        "originalExpiry": "2026-03-15",
        "plannedRenewal": "2026-02-16",
        "rosterPeriod": "RP02/2026",
        "renewalWindow": {
          "start": "2026-02-16",
          "end": "2026-03-15"
        },
        "pairedWith": "Jane Smith",
        "status": "confirmed"
      }
    ]
  }
}
```

#### `GET /api/renewal-planning/roster-period/:period`

Get all renewals for specific roster period.

**Response**:

```json
{
  "success": true,
  "data": {
    "rosterPeriod": "RP03/2026",
    "periodDates": {
      "start": "2026-02-14",
      "end": "2026-03-13"
    },
    "categoryBreakdown": {
      "Medical": {
        "count": 4,
        "capacity": 4,
        "pilots": [
          { "name": "John Doe", "checkType": "MEDI" },
          { "name": "Jane Smith", "checkType": "MEDI" }
        ]
      }
    }
  }
}
```

#### `PUT /api/renewal-planning/:planId/reschedule`

Reschedule a planned renewal.

**Request**:

```json
{
  "newDate": "2026-03-20",
  "reason": "Pilot on leave during original window"
}
```

---

### UI Components

#### 1. **Renewal Planning Dashboard** (`/dashboard/renewal-planning`)

**Features**:

- **Timeline View**: 13-period timeline showing all planned renewals
- **Category Filters**: Filter by Medical, Flight, Simulator, Ground
- **Capacity Indicators**: Visual indicators for roster periods nearing capacity (green/yellow/red)
- **Clustering Alerts**: Warnings for periods with too many renewals
- **Quick Actions**: Regenerate plan, export to CSV, print schedule

**Layout**:

```
┌─────────────────────────────────────────────────────┐
│  Renewal Planning Dashboard - Next 12 Months        │
├─────────────────────────────────────────────────────┤
│  Filters: [Medical] [Flight] [Simulator] [Ground]  │
├─────────────────────────────────────────────────────┤
│  RP01/2026  RP02/2026  RP03/2026  RP04/2026 ...     │
│  ────────   ────────   ────────   ────────          │
│  Medical: 2 Medical: 4 Medical: 3 Medical: 1        │
│  Flight: 3  Flight: 2  Flight: 4  Flight: 3         │
│  Sim: 4     Sim: 5     Sim: 3     Sim: 6            │
│  Ground: 6  Ground: 8  Ground: 7  Ground: 5         │
│  ────────   ────────   ────────   ────────          │
│  Total: 15  Total: 19  Total: 17  Total: 15         │
│  🟢 67%     🟡 79%     🟢 71%     🟢 63%             │
└─────────────────────────────────────────────────────┘
```

#### 2. **Pilot Renewal Schedule** (`/dashboard/pilots/:id/renewals`)

**Features**:

- Individual pilot's renewal schedule
- Timeline of all upcoming certifications
- Pairing information (who they're scheduled with)
- Ability to reschedule (if admin)

#### 3. **Roster Period Detail View** (`/dashboard/renewal-planning/roster-period/:period`)

**Features**:

- All pilots scheduled for renewals in this period
- Breakdown by category
- Pairing assignments
- Capacity utilization
- Ability to add/remove pilots from this period

---

## Implementation Plan

### Phase 1: Database Setup (Week 1)

**Tasks**:

1. Create migration for `certification_renewal_plans` table
2. Create migration for `roster_period_capacity` table
3. Create migration for `renewal_plan_history` table
4. Seed initial roster period capacity data for RP01/2026 through RP13/2026
5. Update TypeScript types with `npm run db:types`

**Deliverables**:

- ✅ Database schema implemented
- ✅ Types generated
- ✅ Test data seeded

---

### Phase 2: Service Layer (Week 2-3)

**Tasks**:

1. Create `certification-renewal-planning-service.ts`
2. Implement core planning algorithm
3. Implement roster period assignment logic
4. Implement pilot pairing logic
5. Add capacity checking
6. Create helper utilities for grace period calculations
7. Write unit tests for service functions

**Deliverables**:

- ✅ Service layer complete
- ✅ Planning algorithm tested
- ✅ Grace period logic validated

---

### Phase 3: API Routes (Week 3)

**Tasks**:

1. Create `/api/renewal-planning/generate` POST endpoint
2. Create `/api/renewal-planning/pilot/:pilotId` GET endpoint
3. Create `/api/renewal-planning/roster-period/:period` GET endpoint
4. Create `/api/renewal-planning/:planId/reschedule` PUT endpoint
5. Create `/api/renewal-planning/:planId/confirm` PUT endpoint
6. Create `/api/renewal-planning/:planId/complete` PUT endpoint
7. Add error handling and validation

**Deliverables**:

- ✅ API endpoints functional
- ✅ Swagger/OpenAPI documentation
- ✅ Postman collection for testing

---

### Phase 4: UI Components (Week 4-5)

**Tasks**:

1. Create main dashboard page (`/dashboard/renewal-planning`)
2. Build timeline component for 13-period view
3. Create roster period detail modal
4. Build pilot renewal schedule component
5. Add filtering and search functionality
6. Implement capacity indicators (color-coded)
7. Add export to CSV functionality
8. Create Storybook stories for all components
9. Write Playwright E2E tests

**Deliverables**:

- ✅ UI components complete
- ✅ Responsive design
- ✅ Accessibility compliant
- ✅ E2E tests passing

---

### Phase 5: Integration & Testing (Week 5-6)

**Tasks**:

1. Run initial plan generation with real data
2. Validate clustering is reduced
3. Test capacity enforcement
4. Test rescheduling functionality
5. Test pilot pairing
6. Generate 12-month plan for all pilots
7. Review with stakeholders
8. Adjust algorithm based on feedback

**Deliverables**:

- ✅ Complete renewal plan generated
- ✅ Stakeholder approval
- ✅ Documentation updated

---

## Success Metrics

### Quantitative Metrics

1. **Clustering Reduction**:
   - **Before**: 36 certifications in December 2025 (21 Ground Courses)
   - **Target**: No more than 8 certifications per category per roster period
   - **Measurement**: `COUNT(*) GROUP BY roster_period, category`

2. **Load Balancing**:
   - **Target**: Standard deviation of renewals per period < 3
   - **Current**: High variance (2 in RP01 to 36 in RP12)
   - **Measurement**: `STDDEV(count) OVER (roster_period)`

3. **Operational Impact**:
   - **Target**: Never more than 4 pilots (2 pairs) off simultaneously for same check
   - **Measurement**: Max pilots per roster period per category

4. **Planning Efficiency**:
   - **Target**: 95% of certifications scheduled within renewal window
   - **Measurement**: `renewals_within_window / total_renewals * 100`

### Qualitative Metrics

1. **User Satisfaction**: Fleet managers report reduced workload for scheduling
2. **Pilot Feedback**: Pilots report better predictability of renewal schedules
3. **Compliance**: No certifications expire unplanned due to scheduling conflicts

---

## Risk Analysis

### Risk 1: Algorithm Complexity

**Risk**: Planning algorithm may not account for all edge cases
**Impact**: High
**Probability**: Medium
**Mitigation**:

- Extensive testing with real data before production
- Manual override capability for admins
- Iterative refinement based on first 3 months of usage

### Risk 2: Grace Period Violations

**Risk**: Planned date falls outside allowable renewal window
**Impact**: Critical
**Probability**: Low
**Mitigation**:

- Strict validation in service layer
- Database constraints on renewal_window_start/end
- Automated alerts if violation detected

### Risk 3: Pilot Scheduling Conflicts

**Risk**: Planned renewal conflicts with pilot leave or other commitments
**Impact**: Medium
**Probability**: High
**Mitigation**:

- Integration with leave request system
- Manual reschedule capability
- Buffer periods in capacity planning

### Risk 4: Regulatory Changes

**Risk**: Grace period rules change due to regulatory updates
**Impact**: Medium
**Probability**: Low
**Mitigation**:

- Grace periods stored in configuration table (not hard-coded)
- Admin ability to update grace periods
- Automatic plan regeneration when rules change

---

## Future Enhancements

### Phase 2 Features (Post-Launch)

1. **Pilot Preferences**: Allow pilots to indicate preferred renewal periods
2. **Training Center Integration**: API integration with training center booking systems
3. **Automated Notifications**: Email/SMS reminders 30/14/7 days before planned renewal
4. **Mobile App**: Pilot-facing mobile app to view personal renewal schedule
5. **Predictive Analytics**: ML model to predict optimal renewal windows based on historical data
6. **Conflict Resolution**: Automated conflict detection and resolution suggestions
7. **Cost Optimization**: Factor in training costs when scheduling (group discounts)

---

## Appendix

### A. Grace Period Calculation Examples

**Example 1: Medical Certification**

```
Expiry Date: 2026-03-15
Grace Period: 28 days
Renewal Window: 2026-02-16 to 2026-03-15
Eligible Roster Periods: RP02/2026 (Feb 14 - Mar 13)
Optimal Date: 2026-02-16 (start of RP02/2026)
```

**Example 2: Simulator Check**

```
Expiry Date: 2026-05-20
Grace Period: 90 days
Renewal Window: 2026-02-19 to 2026-05-20
Eligible Roster Periods: RP02/2026, RP03/2026, RP04/2026, RP05/2026
Optimal Date: Earliest period with lowest load
```

### B. Roster Period Reference

```
RP01/2026: Jan 03 - Jan 30
RP02/2026: Jan 31 - Feb 27
RP03/2026: Feb 28 - Mar 27
RP04/2026: Mar 28 - Apr 24
RP05/2026: Apr 25 - May 22
RP06/2026: May 23 - Jun 19
RP07/2026: Jun 20 - Jul 17
RP08/2026: Jul 18 - Aug 14
RP09/2026: Aug 15 - Sep 11
RP10/2026: Sep 12 - Oct 09
RP11/2026: Oct 10 - Nov 06
RP12/2026: Nov 07 - Dec 04
RP13/2026: Dec 05 - Jan 01 2027
```

### C. Database Query Examples

**Find all certifications expiring in next roster period**:

```sql
SELECT
  p.first_name || ' ' || p.last_name AS pilot_name,
  ct.check_description,
  pc.expiry_date,
  pc.expiry_date - (SELECT grace_period FROM check_type_grace_periods WHERE category = ct.category) AS renewal_window_start
FROM pilot_checks pc
JOIN pilots p ON pc.pilot_id = p.id
JOIN check_types ct ON pc.check_type_id = ct.id
WHERE pc.expiry_date BETWEEN '2026-01-03' AND '2026-01-30'
ORDER BY ct.category, pc.expiry_date;
```

**Check roster period capacity**:

```sql
SELECT
  rp.roster_period,
  rp.period_start_date,
  ct.category,
  COUNT(crp.id) AS planned_renewals,
  (rp.max_pilots_per_category->ct.category)::int AS capacity,
  COUNT(crp.id)::float / (rp.max_pilots_per_category->ct.category)::int * 100 AS utilization_pct
FROM roster_period_capacity rp
CROSS JOIN (SELECT DISTINCT category FROM check_types) ct
LEFT JOIN certification_renewal_plans crp
  ON crp.planned_roster_period = rp.roster_period
  AND crp.check_type_id IN (SELECT id FROM check_types WHERE category = ct.category)
GROUP BY rp.roster_period, rp.period_start_date, ct.category, rp.max_pilots_per_category
ORDER BY rp.period_start_date, ct.category;
```

---

**End of Specification Document**

**Next Steps**: Proceed to Phase 1 (Database Setup) upon approval.
