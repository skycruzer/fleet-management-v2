# Leave Approval System Analysis - Complete Documentation Index

**Created:** October 26, 2025
**Updated:** October 26, 2025
**Analysis Scope:** Fleet Management V2 Leave Approval System

## Overview

This directory contains a comprehensive analysis of the Fleet Management V2 leave approval system, including current implementation details, data structures, algorithms, and complete specifications for building a recommendation engine.

## Documents Included

### 1. LEAVE-APPROVAL-SYSTEM-ANALYSIS.md (573 lines)
**Purpose:** Complete technical analysis of the current leave approval system

**Contents:**
- Executive summary of the leave approval architecture
- Database schema (leave_requests table, pilots table)
- Current priority scoring logic (5 factors, 0-298 point scale)
- Crew availability calculation methods (per-date, per-rank)
- Leave balance tracking (current gaps - none implemented)
- Date availability checking logic (5 conflict types)
- Eligibility status determination (5 statuses)
- Leave eligibility service (comprehensive checking)
- Bulk operations (approve/deny)
- Approval history and audit logging
- Current gaps and limitations
- Data available for recommendation engine
- Business rules summary
- Input/output specification for recommendation engine

**Key Sections:**
- Section 2: Data structures (12 fields per leave request)
- Section 3: Priority scoring (198 + 50 + 0-30 + 20 = 0-298 points)
- Section 4: No leave balance system currently
- Section 5: 5 conflict types detected
- Section 7: Advanced eligibility service features
- Section 14: Output structure for recommendations

### 2. LEAVE-SYSTEM-TECHNICAL-SUMMARY.md (347 lines)
**Purpose:** Quick reference guide for developers

**Contents:**
- Key files overview (9 files listed with purposes)
- Core data flow (visual walkthrough)
- Priority score calculation example
- Crew availability status levels (Safe/Warning/Critical)
- Conflict detection quick reference
- Complete API endpoint documentation
  - GET /api/leave-requests
  - POST /api/leave-requests
  - PATCH /api/leave-requests/[id]
  - POST /api/leave-requests/bulk-approve
  - GET /api/leave-requests/crew-availability
- Common query patterns
- Database constraints
- Error handling strategies
- Testing scenarios (4 scenarios)
- Performance considerations
- Debugging tips

**Best For:** Developers needing quick implementation reference

### 3. RECOMMENDATION-ENGINE-REQUIREMENTS.md (615 lines)
**Purpose:** Complete specification for building a recommendation engine

**Contents:**
- System context (what exists, what's missing)
- Data inventory (pilot data, leave requests, calculated data, history)
- Input/output data models (complete TypeScript interfaces)
- Recommendation algorithm components
  - Crew availability analysis
  - Conflict analysis
  - Request pattern analysis
  - Seniority & fairness scoring
  - Operational risk assessment
- Combined scoring algorithm
- Business rules to enforce
- Recommendation engine workflow
  - Synchronous processing (130-280ms)
  - Background analysis (async)
- Integration points with existing services
- Data requirements (required/recommended/nice-to-have)
- Testing strategy (unit/integration/scenario tests)
- Performance targets
- Reporting & analytics

**Key Algorithms:**
- Crew availability scoring (-50 to +50)
- Conflict scoring (-40 to +30)
- Pattern scoring (-30 to +10)
- Seniority scoring (-30 to +20)
- Risk scoring (-40 to +20)
- Combined weighted score (40% crew + 25% risk + 15% conflict + 10% seniority + 10% pattern)

## Key Findings

### Current System Strengths

1. Clear crew availability calculations (per date, per rank)
2. Sophisticated seniority-based prioritization
3. Multiple conflict detection types (EXACT, PARTIAL, ADJACENT, NEARBY)
4. Separation of Captains and First Officers (independent evaluation)
5. Audit logging and approval history
6. Bulk operation support
7. Well-structured service layer pattern

### Current System Limitations

1. **No Leave Balance Tracking**
   - No entitlement system
   - No carryover management
   - No leave type-specific allocations

2. **Limited Conflict Prevention**
   - Conflicts detected only during approval review
   - No automatic spreading suggestions at creation
   - No blocking of conflicting submissions

3. **Bulk Operation Weaknesses**
   - No collective impact validation
   - Could approve conflicting requests together
   - No transaction rollback on failure

4. **Missing Intelligence**
   - No historical pattern analysis
   - No predictive crew forecasting
   - No optimization for fairness
   - No cost/efficiency considerations

5. **No Recommendation Engine**
   - Manual review required for all conflicts
   - No confidence scoring
   - No risk assessment
   - No alternative suggestions

## Data Available for Recommendation Engine

### Pilot Data (27 records)
- ID, name, employee_id, role, seniority_number (1-27)
- Commencement date, is_active, user_id
- Captain qualifications (JSONB)

### Leave Request Data (varies)
- ID, pilot_id, type (8 types), roster_period
- start_date, end_date, days_count
- status (PENDING/APPROVED/DENIED), request_date, request_method
- reason, is_late_request, reviewed_by, reviewed_at, review_comments

### Calculated Data
- Crew availability (per date, per rank)
- Conflict detection (5 types, overlaps)
- Eligibility status (5 types)
- Priority scores (0-298)

### Historical Data
- All APPROVED leave requests (with dates)
- All DENIED leave requests (with reasons)
- Approval/denial decisions (timestamps, reviewers)
- Request methods (source tracking)

## Business Rules Summary

### Critical (Non-negotiable)
1. Minimum crew: 10 Captains AND 10 First Officers (simultaneously)
2. Rank separation: Captains evaluated independently from First Officers
3. Seniority order: Lower number = higher priority within same rank
4. One request per pilot per date range (unique constraint)

### Policy (Can override with justification)
1. Late request: < 21 days notice (flagged for review)
2. Fair distribution: By seniority within same rank
3. Request limits: No explicit limits (managed via crew minimum)

### Operational
1. Roster periods: 28-day cycles (RP1-RP13)
2. Certification conflicts: Avoid leave during required checks
3. Scheduling: Consider pilot roster assignments

## Recommendation Engine Outputs

### Decision Options
- **AUTO_APPROVE**: Safe to approve immediately (confidence > 80%)
- **AUTO_DENY**: Must deny to maintain operations (crew shortage)
- **REQUIRE_REVIEW**: Manual review needed (conflicts/edge cases)

### Provided Information
- Confidence score (0-100%)
- Reasoning (pros/cons/risks)
- Crew impact (per-date availability)
- Alternatives (reschedule, substitute, partial)
- Related requests (conflicts)
- Suggested reviewer (SCHEDULING/OPERATIONS/HR)

## Performance Targets

- Single request: < 500ms
- Batch (50 requests): < 5 seconds
- Crew forecast (30 days): < 1 second
- Historical analysis: < 30 seconds

## Implementation Roadmap

### Phase 1: Foundation
1. Implement recommendation engine core
2. Integrate with existing approval service
3. Add to API responses

### Phase 2: Enhancement
1. Add confidence scoring
2. Implement risk assessment
3. Add alternative suggestions

### Phase 3: Intelligence
1. Historical pattern analysis
2. Predictive crew forecasting
3. Fairness optimization

### Phase 4: Advanced
1. Machine learning for approval prediction
2. Cost optimization
3. Certification integration

## Integration with Existing Code

### Leave Approval Service
- Location: `lib/services/leave-approval-service.ts`
- Use: Recommendation engine can enhance priority scoring
- Enhancement: Sort by recommended_action first, then confidence, then priority

### Leave Eligibility Service
- Location: `lib/services/leave-eligibility-service.ts`
- Use: Recommendation engine builds on existing crew/conflict analysis
- Enhancement: Add confidence scoring to existing checks

### Leave Service
- Location: `lib/services/leave-service.ts`
- Use: CRUD operations
- Enhancement: Add recommendation field to LeaveRequest type

### API Routes
- Location: `app/api/leave-requests/*`
- Use: Expose recommendation engine results
- Enhancement: Add recommendation object to responses

## Types & Interfaces

### New Types Needed

```typescript
interface LeaveRecommendation {
  action: 'AUTO_APPROVE' | 'AUTO_DENY' | 'REQUIRE_REVIEW'
  confidence: number (0-100)
  reasoning: {
    pros: string[]
    cons: string[]
    risks: Risk[]
  }
  crewImpact: CrewImpactDay[]
  alternatives?: Alternative[]
  alternativePilots?: PilotAlternative[]
  reviewSuggestion?: ReviewSuggestion
  processingTime: number (ms)
  dataPointsUsed: number
  uncertaintyFactors: string[]
}
```

## Quick Start for Developers

1. **Understand Current System**
   - Read: LEAVE-APPROVAL-SYSTEM-ANALYSIS.md (Sections 1-3)
   - Focus: Priority scoring, crew availability, conflict detection

2. **Review Technical Details**
   - Read: LEAVE-SYSTEM-TECHNICAL-SUMMARY.md
   - Focus: API endpoints, common queries, testing scenarios

3. **Plan Recommendation Engine**
   - Read: RECOMMENDATION-ENGINE-REQUIREMENTS.md
   - Focus: Algorithm components, input/output, integration points

4. **Implement**
   - Create: `lib/services/leave-recommendation-service.ts`
   - Types: Extend `types/leave-approval.ts`
   - API: Add to `app/api/leave-requests/route.ts`

## Testing Checklist

- [ ] Crew minimum is never violated
- [ ] Seniority order is respected
- [ ] Rank separation is enforced
- [ ] Confidence scores are calibrated
- [ ] All 4 testing scenarios pass
- [ ] Performance targets met
- [ ] Edge cases handled (exact minimum crew, conflicts)
- [ ] Audit logging works
- [ ] API integration complete
- [ ] Dashboard displays recommendations

## Files Modified During Analysis

Created:
- LEAVE-APPROVAL-SYSTEM-ANALYSIS.md
- LEAVE-SYSTEM-TECHNICAL-SUMMARY.md
- RECOMMENDATION-ENGINE-REQUIREMENTS.md
- LEAVE-APPROVAL-ANALYSIS-INDEX.md (this file)

Analyzed (not modified):
- lib/services/leave-approval-service.ts
- lib/services/leave-eligibility-service.ts
- lib/services/leave-service.ts
- types/leave-approval.ts
- app/api/leave-requests/route.ts (and subdirectories)
- types/supabase.ts (schema)

## Related Documentation

Existing documents that complement this analysis:
- LEAVE-APPROVAL-DASHBOARD-PLAN.md (UI/UX perspective)
- LEAVE-REQUEST-SYSTEM-OVERVIEW.md (system overview)
- LEAVE-SYSTEM-TECHNICAL-SUMMARY.md (quick reference)
- LEAVE-APPROVAL-TESTING-GUIDE.md (testing details)

## Summary Statistics

| Metric | Value |
|--------|-------|
| Total lines of analysis | 1,535 |
| Files analyzed | 9+ |
| Data structures documented | 12+ |
| Functions documented | 25+ |
| Algorithms explained | 5+ |
| API endpoints documented | 5 |
| Test scenarios | 4-5 |
| Business rules | 10+ |
| Scoring factors | 10+ |

## Next Steps

1. Review all three analysis documents
2. Identify priority order for implementation
3. Create detailed design document for recommendation engine
4. Plan database schema extensions (if needed)
5. Implement core recommendation service
6. Add API integration
7. Build dashboard UI components
8. Write comprehensive tests
9. Deploy and monitor

## Questions & Clarifications

### For Stakeholders
- What's the priority order for recommendation engine features?
- Should leave balance tracking be added?
- Are there cost/efficiency considerations?
- Should machine learning be explored?

### For Developers
- Should recommendation engine be synchronous or async?
- How should confidence thresholds be configured?
- Should audit logs track recommendation decisions?
- How should fairness metrics be monitored?

## Contact & Attribution

Analysis created: October 26, 2025
Analyzed system: Fleet Management V2 - Leave Approval Module
Database: Supabase (wgdmgvonqysflwdiiols)
Production pilots: 27 active
Production leaves: ~50-100 active requests

---

**End of Index Document**

This analysis provides a complete foundation for understanding and building a recommendation engine for the Fleet Management V2 leave approval system. All critical information, data structures, algorithms, and integration points are documented above.

