# Certification Renewal Planning System

## Executive Summary & Visual Analysis

**Date**: October 24, 2025
**Status**: Design Complete - Ready for Implementation

---

## 🎯 Problem Statement

**Current Situation**: All 27 pilots have certification renewals clustered in specific months, creating operational bottlenecks.

**Critical Issue Identified**:

- **December 2025**: 36 certifications expiring (21 Ground Courses alone!)
- **16 pilots** need Ground Course renewals in the same month
- High risk of operational disruption

**Goal**: Distribute pilot pairs evenly across 13 roster periods (28-day cycles) throughout the year.

---

## 📊 Current Clustering Analysis

### Immediate Concerns (Next 90 Days)

| Month        | Total Certs | Ground | Simulator | Medical | Flight | Status      |
| ------------ | ----------- | ------ | --------- | ------- | ------ | ----------- |
| **Nov 2025** | 18          | 7      | 6         | 4       | 0      | 🟡 High     |
| **Dec 2025** | 36          | 21     | 6         | 3       | 4      | 🔴 Critical |
| **Jan 2026** | 11          | 2      | 3         | 6       | 0      | 🟢 Normal   |
| **Feb 2026** | 17          | 3      | 9         | 4       | 0      | 🟡 High     |

### Category Analysis

**Most Problematic Categories**:

1. **Ground Courses**: 156 total certifications, all 26 pilots on similar cycles
   - CRM, AVSEC, DGA, SMS1, SEP all expiring in December
2. **Medical**: 36 total certifications, clustering in Nov/Jan/Feb
3. **Simulator Checks**: 52 total certifications, relatively well-distributed

**Best Distributed**:

- ID Cards: No immediate clustering
- Flight Checks: Well-distributed across the year

---

## 💡 Proposed Solution

### Grace Period System

| Certification Type   | Grace Period | Renewal Flexibility                      |
| -------------------- | ------------ | ---------------------------------------- |
| **Medical**          | 28 days      | Can renew starting 28 days before expiry |
| **Flight/Simulator** | 90 days      | Can renew starting 90 days before expiry |
| **Ground Courses**   | 60 days      | Can renew starting 60 days before expiry |

**Example**: If medical expires March 15, 2026:

- Renewal window: February 16 - March 15 (28 days)
- Can schedule in RP02/2026 or RP03/2026
- Choose period with lower pilot load

### Distribution Strategy

**Capacity Limits Per Roster Period**:

- Medical: 4 pilots max (2 pairs)
- Flight Checks: 4 pilots max (2 pairs)
- Simulator Checks: 6 pilots max (3 pairs)
- Ground Courses: 8 pilots max (4 pairs)

**Pairing Logic**:

- 27 pilots = 13 pairs + 1 single
- Pair by seniority for fairness
- Minimize operational impact

---

## 🗓️ 13 Roster Period System

Each roster period is exactly 28 days:

```
RP01/2026: Jan 03 - Jan 30  |  RP08/2026: Jul 18 - Aug 14
RP02/2026: Jan 31 - Feb 27  |  RP09/2026: Aug 15 - Sep 11
RP03/2026: Feb 28 - Mar 27  |  RP10/2026: Sep 12 - Oct 09
RP04/2026: Mar 28 - Apr 24  |  RP11/2026: Oct 10 - Nov 06
RP05/2026: Apr 25 - May 22  |  RP12/2026: Nov 07 - Dec 04
RP06/2026: May 23 - Jun 19  |  RP13/2026: Dec 05 - Jan 01 2027
RP07/2026: Jun 20 - Jul 17  |
```

**Planning Integration**: Renewal dates align to roster period start dates for operational simplicity.

---

## 🔧 Technical Implementation

### New Database Tables

**1. `certification_renewal_plans`** (Main planning table)

- Stores planned renewal dates for each pilot certification
- Links pilots into pairs for same renewal window
- Tracks status: planned → confirmed → in_progress → completed

**2. `roster_period_capacity`** (Load balancing)

- Tracks how many pilots allocated to each roster period
- Prevents overloading any single period
- Enforces capacity limits per category

**3. `renewal_plan_history`** (Audit trail)

- Tracks all changes to renewal plans
- Who rescheduled, when, and why
- Full audit compliance

### Service Layer

**Core Service**: `certification-renewal-planning-service.ts`

**Key Functions**:

- `generateRenewalPlan()` - Generate complete 12-month schedule
- `getPilotRenewalPlan(pilotId)` - Individual pilot schedule
- `getRenewalsByRosterPeriod(period)` - All renewals in a period
- `updatePlannedRenewalDate(planId, newDate)` - Reschedule renewal
- `pairPilots(pilot1, pilot2, checkType)` - Create pilot pair
- `checkCapacity(rosterPeriod, category)` - Check if period has space

---

## 🎨 User Interface

### 1. Renewal Planning Dashboard (`/dashboard/renewal-planning`)

**Visual Timeline**:

```
┌────────────────────────────────────────────────────────────┐
│  Renewal Planning Dashboard - Next 12 Months               │
├────────────────────────────────────────────────────────────┤
│  Filter: [All] [Medical] [Flight] [Simulator] [Ground]    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  RP01/2026  RP02/2026  RP03/2026  RP04/2026  RP05/2026    │
│  ────────   ────────   ────────   ────────   ────────     │
│  Med:  2    Med:  4    Med:  3    Med:  1    Med:  2      │
│  Flt:  3    Flt:  2    Flt:  4    Flt:  3    Flt:  2      │
│  Sim:  4    Sim:  5    Sim:  3    Sim:  6    Sim:  4      │
│  Grnd: 6    Grnd: 8    Grnd: 7    Grnd: 5    Grnd: 8      │
│  ────────   ────────   ────────   ────────   ────────     │
│  Total: 15  Total: 19  Total: 17  Total: 15  Total: 16    │
│  🟢 63%     🟡 79%     🟢 71%     🟢 63%     🟢 67%        │
│                                                            │
│  ✅ = Under capacity  🟡 = Approaching capacity           │
│  🔴 = Over capacity                                       │
└────────────────────────────────────────────────────────────┘
```

**Features**:

- Color-coded capacity indicators
- Click roster period to see details
- Filter by category
- Export to CSV
- Regenerate plan button

### 2. Pilot Renewal Schedule

Individual pilot view showing:

- All upcoming renewals
- Paired pilots
- Roster periods assigned
- Ability to reschedule (admin only)

### 3. Roster Period Detail

Detailed view of single roster period:

- All pilots scheduled
- Breakdown by category
- Pairing assignments
- Capacity utilization

---

## 📈 Expected Improvements

### Quantitative

**Before** (Current State):

- December 2025: 36 certifications
- Standard deviation: High variance
- Max pilots per period: 21 (Ground Courses)

**After** (With Planning System):

- Max per category per period: 8 (Ground Courses)
- Standard deviation: < 3
- Even distribution across 13 periods

### Qualitative

- ✅ Predictable renewal schedule for pilots
- ✅ Reduced administrative workload
- ✅ Fewer scheduling conflicts
- ✅ Better operational planning
- ✅ Compliance assurance

---

## 🚀 Implementation Timeline

### Phase 1: Database (Week 1)

- Create 3 new tables
- Seed roster period capacity data
- Generate TypeScript types

### Phase 2: Service Layer (Week 2-3)

- Implement planning algorithm
- Build core service functions
- Write unit tests

### Phase 3: API (Week 3)

- Create REST endpoints
- Add validation
- Document with Swagger

### Phase 4: UI (Week 4-5)

- Build dashboard components
- Create timeline view
- Add filtering and search
- Write E2E tests

### Phase 5: Testing & Launch (Week 5-6)

- Generate initial plan with real data
- Validate with stakeholders
- Refine algorithm
- Production deployment

**Total Duration**: 5-6 weeks

---

## ⚠️ Key Risks & Mitigations

| Risk                                     | Impact   | Mitigation                                      |
| ---------------------------------------- | -------- | ----------------------------------------------- |
| Algorithm doesn't account for edge cases | High     | Extensive testing, manual override capability   |
| Grace period violations                  | Critical | Strict validation, database constraints         |
| Pilot scheduling conflicts               | Medium   | Leave system integration, reschedule capability |
| Regulatory changes                       | Medium   | Configuration-based grace periods               |

---

## 🎯 Success Metrics

1. **Clustering Reduction**: No more than 8 certifications per category per period
2. **Load Balancing**: Standard deviation < 3 across all periods
3. **Operational Impact**: Never > 4 pilots off simultaneously for same check
4. **Planning Efficiency**: 95% of certifications scheduled within renewal window
5. **User Satisfaction**: Fleet managers report reduced scheduling workload

---

## 📋 Next Steps

**Ready to Proceed?**

1. ✅ Review this specification document
2. ✅ Approve database schema design
3. ⏳ Begin Phase 1: Database setup
4. ⏳ Implement service layer
5. ⏳ Build UI components
6. ⏳ Test with real data
7. ⏳ Production deployment

**Questions to Resolve**:

- Do grace periods match regulatory requirements exactly?
- Are capacity limits (4-8 pilots per period) acceptable?
- Any specific pairing preferences to consider?
- Should pilots be able to request preferred renewal periods?

---

## 📚 Documentation References

**Main Specification**: `CERTIFICATION-RENEWAL-PLANNING-SPEC.md` (complete technical details)

**Related Files**:

- `lib/utils/roster-utils.ts` - Existing roster period system
- `lib/services/certification-service.ts` - Current certification logic
- `CERTIFICATIONS-REDESIGN-SUMMARY.md` - Recent page redesign

**Database Schema**: See spec document Section "Database Schema" for SQL DDL

**API Documentation**: See spec document Section "API Endpoints" for complete API reference

---

**Status**: ✅ Design phase complete - awaiting approval to begin implementation

**Contact**: BMad Business Analyst (Mary) | Fleet Management V2 Team
