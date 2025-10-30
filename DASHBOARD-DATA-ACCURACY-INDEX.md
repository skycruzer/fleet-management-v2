# Fleet Management V2 - Dashboard Data Accuracy Documentation Index

## Overview

This documentation provides a comprehensive analysis of the Fleet Management V2 dashboard data flow, accuracy verification, and configuration management for pilot requirements.

**Date**: October 25, 2025
**Database**: Supabase Project `wgdmgvonqysflwdiiols`
**Current Status**: Verified and Documented

---

## Documentation Files

### 1. DASHBOARD-DATA-FLOW-ANALYSIS.md (Main Report)
**Purpose**: Comprehensive analysis of how dashboard data flows from database to UI

**Contains**:
- Executive summary of system architecture
- Pilot requirements configuration storage and retrieval
- Dashboard service architecture and query flow
- Admin service requirements retrieval
- Pilot requirements card calculation logic
- Leave eligibility service crew requirements
- Current database state analysis
- Data accuracy verification methodology
- Services architecture diagram
- Critical verification areas
- Recommended improvements
- Final verification checklist

**Use When**: You need detailed understanding of how dashboard metrics are calculated and where they come from

**Key Sections**:
- Section 1: Pilot Requirements Configuration (where settings are stored)
- Section 2: Dashboard Service Architecture (how metrics are calculated)
- Section 3: Admin Service (how requirements are retrieved)
- Section 5: Leave Eligibility Service (how crew requirements are used)
- Section 6: Current Database State Analysis (actual vs. required pilots)

---

### 2. DASHBOARD-QUICK-REFERENCE.md (Quick Lookup)
**Purpose**: Quick reference guide for common questions about dashboard accuracy

**Contains**:
- Current requirements structure (JSON format)
- Current pilot counts (actual data)
- Services and functions used for requirements
- Key components and their locations
- Calculation examples with actual numbers
- Critical business rules (minimum crew requirements)
- Data flow diagram
- Type safety mechanisms
- Cache behavior
- Error handling
- Database verification queries
- Troubleshooting guide
- Performance notes

**Use When**: You need quick answers to specific questions about dashboard data

**Perfect For**:
- "Where are pilot requirements stored?" → Settings table, JSONB format
- "How many pilots do we need?" → 28 total (7 captains + 7 first officers per 2 aircraft)
- "Why are leave requests being denied?" → Crew below minimum (19 captains vs 20 required)
- "Which files should I check?" → Links to exact file locations and line numbers

---

### 3. DASHBOARD-VERIFICATION-QUERIES.sql (Database Verification)
**Purpose**: SQL queries to verify dashboard data accuracy directly in database

**Contains**:
- Verify pilot requirements settings exist and are valid
- Check pilot counts by role and status
- Verify captain qualifications (examiners, training captains)
- Verify leave eligibility crew requirements
- Check staffing level calculations
- Examine examiner and training captain requirements
- Verify data integrity constraints
- Analyze leave request impact on crew availability
- Verify certification compliance data
- Summary report query

**Use When**: You need to audit data accuracy at the database level

**How to Use**:
1. Open Supabase dashboard or pgAdmin for your project
2. Copy a query from this file
3. Execute in database console
4. Compare results with dashboard display
5. If mismatch, check data integrity queries

**Most Important Queries**:
- Query 1: Verify pilot_requirements setting exists
- Query 2: Verify pilot counts (should show 19 Captains, 7 First Officers)
- Query 3: Verify examiner count (should show 3)
- Query 5: Verify crew requirements (identifies crew imbalance)

---

## Quick Navigation

### By Question

**Q: Where are pilot requirements stored?**
- File: DASHBOARD-QUICK-REFERENCE.md → Settings Storage section
- Also: DASHBOARD-DATA-FLOW-ANALYSIS.md → Section 1

**Q: How are pilot counts calculated?**
- File: DASHBOARD-QUICK-REFERENCE.md → Calculation Examples
- Also: DASHBOARD-DATA-FLOW-ANALYSIS.md → Section 2

**Q: What's the complete data flow from database to dashboard?**
- File: DASHBOARD-DATA-FLOW-ANALYSIS.md → Section 2 & 8
- Visual: DASHBOARD-QUICK-REFERENCE.md → Data Flow Diagram

**Q: Why are leave requests being denied?**
- File: DASHBOARD-QUICK-REFERENCE.md → Troubleshooting section
- Also: DASHBOARD-DATA-FLOW-ANALYSIS.md → Section 5 & 6

**Q: How can I verify dashboard accuracy?**
- File: DASHBOARD-VERIFICATION-QUERIES.sql (run all queries)
- Also: DASHBOARD-DATA-FLOW-ANALYSIS.md → Section 9 & 13

**Q: What files should I change to update requirements?**
- Answer: `/app/dashboard/admin/settings/` (Admin panel)
- Or directly: `settings` table in database with key='pilot_requirements'

**Q: What's the minimum crew requirement?**
- File: DASHBOARD-QUICK-REFERENCE.md → Critical Business Rules
- Current: 20 Captains AND 20 First Officers minimum
- Actual: 19 Captains, 7 First Officers (BELOW minimum!)

---

### By Role

**For Software Developers**:
1. Read: DASHBOARD-DATA-FLOW-ANALYSIS.md (full context)
2. Reference: DASHBOARD-QUICK-REFERENCE.md (while coding)
3. Use: DASHBOARD-VERIFICATION-QUERIES.sql (for testing)
4. Key files to review:
   - `/lib/services/admin-service.ts` (line 358: getPilotRequirements)
   - `/lib/services/dashboard-service.ts` (line 77: getDashboardMetrics)
   - `/components/dashboard/pilot-requirements-card.tsx` (line 72: Display component)

**For Database Administrators**:
1. Read: DASHBOARD-QUICK-REFERENCE.md → Database Verification Queries
2. Run: All queries in DASHBOARD-VERIFICATION-QUERIES.sql
3. Reference: DASHBOARD-DATA-FLOW-ANALYSIS.md → Section 13 (verification checklist)
4. Check: Settings table for pilot_requirements record

**For Project Managers / Fleet Managers**:
1. Read: DASHBOARD-DATA-FLOW-ANALYSIS.md → Executive Summary & Section 6
2. Focus: Current Database State Analysis & Critical Business Rules
3. Action: Review crew imbalance (19 Captains vs 20 minimum required)

**For System Administrators / DevOps**:
1. Check: DASHBOARD-QUICK-REFERENCE.md → Cache Behavior section
2. Monitor: Performance notes (100-300ms without cache, <10ms with cache)
3. Verify: Error handling (silent failures with console logging)
4. Review: Database verification queries for health checks

---

## Key Findings Summary

### Dashboard Data Accuracy: VERIFIED ✅

The dashboard accurately displays:
- **Pilot Counts**: 19 Captains, 7 First Officers (verified against database)
- **Examiners**: 3 Captains with 'examiner' qualification
- **Training Captains**: 5 Captains with 'training_captain' qualification
- **Compliance**: 93% (26 actual vs 28 required)
- **Requirements**: Retrieved from settings table with proper error handling

### Critical Business Issues IDENTIFIED ⚠️

1. **Crew Imbalance** - Captain shortage:
   - Current: 19 Captains
   - Required: 20 Captains (10 per hull × 2 aircraft)
   - Impact: NO Captain leave can be approved

2. **Crew Imbalance** - First Officer shortage:
   - Current: 7 First Officers
   - Required: 20 First Officers (10 per hull × 2 aircraft)
   - Impact: NO First Officer leave can be approved

3. **Staffing Shortfall**:
   - Current: 26 pilots
   - Required: 28 pilots
   - Gap: -2 pilots (93% compliance)

### Data Accuracy Mechanisms

1. **Source**: `settings` table, JSONB column, key='pilot_requirements'
2. **Retrieval**: `getPilotRequirements()` with type validation
3. **Processing**: 5 parallel queries with error checking
4. **Caching**: 5-minute TTL for performance
5. **Fallback**: Hardcoded defaults if settings missing
6. **Type Safety**: Array.isArray() check for qualifications

---

## Files in This Documentation Suite

| File | Size | Purpose |
|------|------|---------|
| DASHBOARD-DATA-FLOW-ANALYSIS.md | Large | Comprehensive technical analysis |
| DASHBOARD-QUICK-REFERENCE.md | Medium | Quick lookup and troubleshooting |
| DASHBOARD-VERIFICATION-QUERIES.sql | Medium | Database verification queries |
| DASHBOARD-DATA-ACCURACY-INDEX.md | This file | Navigation and summary |

---

## Code References

### Core Service Layer

**Admin Service** (`lib/services/admin-service.ts`):
- `getPilotRequirements()` - Line 358-417 ⭐ Primary function
- `getDefaultPilotRequirements()` - Line 472-483 (Fallback)

**Dashboard Service** (`lib/services/dashboard-service.ts`):
- `getDashboardMetrics()` - Line 77-100 (Cache layer)
- `computeDashboardMetrics()` - Line 106-309 (Calculation logic)
- Pilot counting logic - Line 162-192

**Leave Eligibility Service** (`lib/services/leave-eligibility-service.ts`):
- `getCrewRequirements()` - Line 165-194 (Crew minimum calculation)
- `calculateCrewAvailability()` - Line 204-293 (Leave impact analysis)

### Display Components

**Pilot Requirements Card** (`components/dashboard/pilot-requirements-card.tsx`):
- `PilotRequirementsCard` - Line 72-363 (Main component)
- `getPilotCounts()` - Line 29-70 (Pilot count retrieval)

---

## Troubleshooting Quick Links

**Problem**: Dashboard shows wrong pilot count
→ See: DASHBOARD-QUICK-REFERENCE.md → "Dashboard shows wrong pilot counts"

**Problem**: Leave requests always getting denied
→ See: DASHBOARD-QUICK-REFERENCE.md → "Leave requests always denied"

**Problem**: Requirements are using default values
→ See: DASHBOARD-DATA-FLOW-ANALYSIS.md → Section 3 → Error Handling

**Problem**: Examiners/Training Captains count is wrong
→ See: DASHBOARD-VERIFICATION-QUERIES.sql → Query 3 (Captain qualifications)

**Problem**: Dashboard metrics are stale
→ See: DASHBOARD-QUICK-REFERENCE.md → "Cache Behavior"

---

## Implementation Checklist

Use this checklist when implementing dashboard features or fixing accuracy issues:

- [ ] Read DASHBOARD-DATA-FLOW-ANALYSIS.md (understand architecture)
- [ ] Review relevant code files (admin-service, dashboard-service)
- [ ] Run verification queries (DASHBOARD-VERIFICATION-QUERIES.sql)
- [ ] Check cache invalidation if changing data
- [ ] Verify type safety for JSONB storage
- [ ] Test error handling (missing settings, NULL values)
- [ ] Benchmark query performance (should be <300ms)
- [ ] Document any changes to requirements structure

---

## Related Documentation

- `/CLAUDE.md` - Project setup and architecture overview
- `/types/supabase.ts` - TypeScript types for database schema
- `/supabase/migrations/` - Database schema history
- `/app/dashboard/admin/settings/` - Admin settings UI

---

## Questions?

Refer to the appropriate documentation:

1. **Technical How-It-Works** → DASHBOARD-DATA-FLOW-ANALYSIS.md
2. **Quick Answer** → DASHBOARD-QUICK-REFERENCE.md
3. **Database Verification** → DASHBOARD-VERIFICATION-QUERIES.sql
4. **Navigation Help** → This file (DASHBOARD-DATA-ACCURACY-INDEX.md)

---

**Last Updated**: October 25, 2025
**Maintained By**: Cloud Architecture Team
**Database**: Supabase (wgdmgvonqysflwdiiols)

