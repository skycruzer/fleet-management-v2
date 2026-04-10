---
status: done
priority: p3
issue_id: '025'
tags: [documentation]
dependencies: []
completed_date: 2025-10-17
---

# Document Business Rules in Code

## Problem Statement

Complex business rules (roster periods, leave eligibility) not documented in code comments.

## Findings

- **Severity**: 🟢 P3 (MEDIUM)

## Resolution Summary

Added comprehensive business rule documentation to three critical utility files:

1. **roster-utils.ts** (270 lines of documentation)
   - 28-day roster period calculation logic
   - RP1-RP13 annual cycle with year rollover
   - Known anchor point: RP12/2025 starts Oct 11, 2025
   - Leave request boundary validation
   - Final review window (22 days before next roster)
   - Countdown utilities and date handling

2. **certification-utils.ts** (180 lines of documentation)
   - FAA certification compliance color coding
   - Red (expired), Yellow (≤30 days), Green (>30 days)
   - Certification categories and their icons
   - Compliance percentage calculations
   - Filtering and reporting logic
   - Edge cases: null dates, same-day expiry

3. **qualification-utils.ts** (190 lines of documentation)
   - Captain qualification types (Line, Training, Examiner, RHS)
   - Seniority system (based on commencement_date)
   - RHS captain expiry tracking
   - Qualification badges and validation
   - JSONB storage format flexibility

## Acceptance Criteria

- [x] Business rules documented in utility files
- [x] Examples provided for each business rule
- [x] Edge cases explained thoroughly
- [x] WHY explained (not just WHAT)
- [x] Regulatory context provided

## Implementation Details

### Files Created/Modified

```
lib/utils/
├── roster-utils.ts          (NEW - 870 lines, 270 docs)
├── certification-utils.ts   (NEW - 580 lines, 180 docs)
└── qualification-utils.ts   (MODIFIED - 332 lines, 190 docs)
```

### Documentation Structure

Each file follows this pattern:

1. **BUSINESS RULES** - Critical aviation concepts explained
2. **CALCULATION LOGIC** - Step-by-step algorithms with examples
3. **USE CASES** - Real-world application scenarios
4. **EDGE CASES** - Special scenarios and error handling
5. **CODE EXAMPLES** - TypeScript usage patterns

### Key Business Rules Documented

#### 28-Day Roster Periods

- Why 28 days? Industry standard for crew scheduling
- Annual cycle: 13 periods × 28 days = 364 days
- After RP13/YYYY → RP1/(YYYY+1)
- All leave requests must align to roster boundaries
- Final review: 22 days before next roster starts

#### Certification Expiry

- Red (expired) = pilot grounded, cannot fly
- Yellow (≤30 days) = urgent renewal needed
- Green (>30 days) = compliant, flight-ready
- Why 30 days? Training scheduling buffer time
- Compliance formula: (green_count / total_count) × 100

#### Captain Qualifications

- Line Captain: Standard qualification for operations
- Training Captain (TRI): Can conduct training
- Examiner (TRE): Can conduct check rides
- RHS Captain: Right-hand seat operations (date-based expiry)
- Seniority: Lower number = higher priority (1 = most senior)

## Notes

- NO service layer files created yet (those require database connection)
- Focus was on utility functions with pure business logic
- Documentation is comprehensive enough for future developers
- Can be used as reference when porting full service layer
- Source: CLAUDE.md business rules need code comments

## Related Work

- These utilities will be used by future service layer implementations
- Reference implementations exist in air-niugini-pms project
- Next step: Port leave-eligibility-service.ts with these documented patterns
