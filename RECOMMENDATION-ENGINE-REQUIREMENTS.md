# Leave Approval Recommendation Engine - Requirements Analysis

## Overview

This document provides a comprehensive analysis of data structures, algorithms, and requirements needed to build an intelligent leave request recommendation engine for the Fleet Management V2 system.

## 1. System Context

### Current System

The Fleet Management V2 has two parallel services:

1. **Leave Approval Service** (`leave-approval-service.ts`)
   - Dashboard-focused approval workflow
   - Priority scoring algorithm
   - Bulk operations
   - Crew availability calculations

2. **Leave Eligibility Service** (`leave-eligibility-service.ts`)
   - Detailed eligibility checking
   - Conflict detection and analysis
   - Seniority-based recommendations
   - Alternative pilot suggestions

### What Exists

```
leave_requests (9 status values, 8 types, 27 pilots, roster periods)
     ↓
Conflict Detection (5 conflict types)
     ↓
Crew Availability Calculation (per date, per rank)
     ↓
Priority Scoring (5 factors, 0-298 point scale)
     ↓
Eligibility Status (5 statuses)
     ↓
Recommended Action (APPROVE/DENY/REVIEW)
```

### What's Missing

- Leave balance/entitlement tracking
- Historical pattern analysis
- Predictive crew availability
- Advanced optimization algorithms
- Cost/efficiency metrics
- Roster conflict detection
- Certification expiration integration

## 2. Data Inventory

### 2.1 Pilot Data Available

**Current Table:** `pilots` (27 records)

```
id (UUID)
first_name, last_name, middle_name
employee_id (unique)
role ('Captain' | 'First Officer') ← Critical for separation
seniority_number (1-27) ← Key for priority
commencement_date (used to derive seniority)
is_active (boolean)
user_id (portal association)
captain_qualifications (JSONB - type/expiry data)
```

### 2.2 Leave Request Data Available

**Current Table:** `leave_requests` (varies daily)

```
id (UUID)
pilot_id (FK → pilots)
request_type ('RDO'|'SDO'|'ANNUAL'|'SICK'|'LSL'|'LWOP'|'MATERNITY'|'COMPASSIONATE')
roster_period ('RP1/2025' ... 'RP13/2025', 28-day cycles)
start_date, end_date (ISO dates)
days_count (calculated: end - start + 1)
status ('PENDING' | 'APPROVED' | 'DENIED')
request_date (submission timestamp)
request_method ('EMAIL'|'ORACLE'|'LEAVE_BIDS'|'SYSTEM')
reason (free text, optional)
is_late_request (< 21 days notice)
reviewed_by, reviewed_at, review_comments
created_at, updated_at
```

### 2.3 Calculated Data Available

**From Services:**

```
crew_availability:
  - Total active pilots by rank
  - Pilots on approved leave by date
  - Available crew per date (captains/first officers)
  - Status (safe/warning/critical)
  - Shortfall amounts

conflicts:
  - Type (EXACT|PARTIAL|ADJACENT|NEARBY)
  - Overlapping pilots (same rank only)
  - Overlap days count
  - Priority indicators (seniority-based)

eligibility:
  - Crew minimum violations (per date)
  - Affected dates
  - Alternative pilot recommendations
  - Conflicting pending requests
```

### 2.4 Historical Data Available

**Through Queries:**

```
All APPROVED leave requests (with dates, types, duration)
All DENIED leave requests (with review comments)
Approval/denial decisions (with timestamps, reviewers)
Request methods (source tracking)
Late request flags (policy compliance)
```

## 3. Recommendation Engine Input/Output Specification

### 3.1 Input Data Model

```typescript
interface LeaveRecommendationInput {
  // Request identification
  requestId: string
  pilotId: string
  submissionDate: string (ISO)
  
  // Request details
  startDate: string (ISO)
  endDate: string (ISO)
  daysRequested: number
  requestType: 'RDO'|'SDO'|'ANNUAL'|'SICK'|'LSL'|'LWOP'|'MATERNITY'|'COMPASSIONATE'
  rosterPeriod: string (e.g., 'RP11/2025')
  reason?: string
  isLateRequest: boolean
  
  // Pilot context
  pilotId: string
  pilotName: string
  pilotRole: 'Captain' | 'First Officer'
  seniorityNumber: number (1-27, lower = senior)
  employeeId: string
  
  // System context (provided by engine)
  currentDate: string (ISO)
  allActivePilots: Pilot[]
  allPendingRequests: LeaveRequest[]
  allApprovedLeave: LeaveRequest[]
  historicalApprovals: ApprovalHistory[] (last 100)
}
```

### 3.2 Output Data Model

```typescript
interface LeaveRecommendation {
  // Primary recommendation
  action: 'AUTO_APPROVE' | 'AUTO_DENY' | 'REQUIRE_REVIEW'
  confidence: number (0-100, higher = more certain)
  
  // Reasoning
  reasoning: {
    pros: string[] (factors supporting approval)
    cons: string[] (factors against approval)
    risks: {
      type: 'CREW_SHORTAGE' | 'OPERATIONAL' | 'FAIRNESS' | 'COMPLIANCE'
      description: string
      severity: 'LOW' | 'MEDIUM' | 'HIGH'
    }[]
  }
  
  // Operational impact
  crewImpact: {
    date: string (ISO)
    captainsAfterApproval: number
    firstOfficersAfterApproval: number
    status: 'safe' | 'warning' | 'critical'
  }[]
  
  // Alternatives
  alternatives?: {
    type: 'RESCHEDULE' | 'SUBSTITUTE' | 'PARTIAL_APPROVAL'
    description: string
    suggestedAction: string
  }[]
  
  // Pilot recommendations
  alternativePilots?: {
    pilotId: string
    pilotName: string
    seniorityNumber: number
    role: string
    canCover: boolean
    reason: string
  }[]
  
  // Suggested review
  reviewSuggestion?: {
    priority: 'HIGH' | 'MEDIUM' | 'LOW'
    suggestedReviewer: 'SCHEDULING_MANAGER' | 'OPERATIONS_MANAGER' | 'HR'
    comments: string
    relatedRequests: string[] (request IDs to consider together)
  }
  
  // Additional metadata
  processingTime: number (ms)
  dataPointsUsed: number
  uncertaintyFactors: string[]
}
```

## 4. Recommendation Algorithm Components

### 4.1 Crew Availability Analysis

**Input:** Request dates, pilot rank

**Process:**
```
1. For each date in [start_date, end_date]:
   a. Count active pilots of this rank
   b. Count APPROVED leave requests on this date
   c. Count pending requests on this date
   d. Calculate: available = total - approved - (pending factor)
   e. Determine: status = SAFE/WARNING/CRITICAL

2. Calculate shortfall: shortage = available - minimum (if < 0)

3. Impact score: 
   - No shortfall → +50
   - <= 2 under minimum → +20
   - 3-5 under minimum → -20
   - >= 6 under minimum → -50 (AUTO_DENY)
```

### 4.2 Conflict Analysis

**Input:** All requests, target request

**Process:**
```
1. Find all PENDING requests for same rank, overlapping dates
2. For each conflict:
   a. Determine conflict type (EXACT/PARTIAL/ADJACENT/NEARBY)
   b. Compare seniority (this_pilot vs conflicting_pilot)
   c. Calculate approval overlap (if both approved)
   d. Assign priority score
   e. Check if collective approvals would violate crew minimum

3. Conflict score:
   - No conflicts → +30
   - All conflicts lower seniority → +10
   - Some higher seniority → -20 (REQUIRE_REVIEW)
   - Multiple high-seniority → -40 (REQUIRE_REVIEW)
```

### 4.3 Request Pattern Analysis

**Input:** Historical requests, pilot, request type

**Process:**
```
1. Analyze pilot's historical leave:
   a. Average days per year
   b. Request types distribution
   c. Approval rate
   d. Late request percentage
   e. Seasonal patterns

2. Compare to fleet patterns:
   a. Average approval rate by type
   b. Seasonal high-demand periods
   c. Policy compliance (late requests)
   d. Fairness metrics (equitable distribution)

3. Pattern score:
   - Within normal patterns → +10
   - Unusual but reasonable → 0
   - Excessive or policy violation → -30
```

### 4.4 Seniority & Fairness

**Input:** All requests for overlapping period, all pilots

**Process:**
```
1. Rank all conflicting requests by seniority
2. Determine "fair" approval set:
   a. How many can be approved while maintaining crew minimum?
   b. Which seniorities should be approved?
   c. Which pilots should reschedule?

3. Fairness score:
   - Fair distribution (seniority-based) → +20
   - Some unfairness (policy override needed) → 0
   - Major unfairness (pilot discrimination) → -30
```

### 4.5 Operational Risk Assessment

**Input:** Crew impact, conflicts, pilot qualifications

**Process:**
```
1. Crew risk: 
   - Available crew level vs minimum
   - Impact duration
   - Recovery time

2. Qualification risk:
   - Does pilot have required certifications?
   - Are certifications expiring during leave?
   - Are there check requirements?

3. Operational risk:
   - Is aircraft operational during dates?
   - Are there scheduled maintenance/checks?
   - Is there another pilot on leave?

4. Risk score:
   - Low risk → +20
   - Medium risk → 0 (REQUIRE_REVIEW)
   - High risk → -40 (AUTO_DENY or REQUIRE_REVIEW)
```

## 5. Scoring Algorithm

### 5.1 Combined Score Calculation

```typescript
function calculateRecommendationScore(inputs: {
  crewAvailabilityScore: number (-50 to +50)
  conflictScore: number (-40 to +30)
  patternScore: number (-30 to +10)
  seniorityScore: number (-30 to +20)
  riskScore: number (-40 to +20)
}): {
  action: 'AUTO_APPROVE' | 'AUTO_DENY' | 'REQUIRE_REVIEW'
  confidence: number (0-100)
} {
  // Weighted scoring
  const totalScore = 
    inputs.crewAvailabilityScore * 0.40 +    // Most critical: crew availability
    inputs.riskScore * 0.25 +                  // Critical: operational risk
    inputs.conflictScore * 0.15 +              // Important: conflicts
    inputs.seniorityScore * 0.10 +             // Important: fairness
    inputs.patternScore * 0.10                 // Secondary: patterns

  // Convert to action
  if (totalScore >= 60) {
    return {
      action: 'AUTO_APPROVE',
      confidence: Math.min(100, totalScore)
    }
  } else if (totalScore <= -40) {
    return {
      action: 'AUTO_DENY',
      confidence: Math.min(100, Math.abs(totalScore))
    }
  } else {
    return {
      action: 'REQUIRE_REVIEW',
      confidence: Math.abs(totalScore)
    }
  }
}
```

### 5.2 Confidence Calculation

```
Base: 50 (neutral)

Adjustments:
  + 10 for each factor strongly supporting decision
  + 5 for each factor supporting decision
  - 5 for conflicting data
  - 10 for contradicting factors
  
Ceiling: 100%
Floor: 0% (indicates need for human review)
```

## 6. Business Rules to Enforce

### Critical Constraints (Cannot Override)

1. **Crew Minimum**: Always ≥10 Captains AND ≥10 First Officers
2. **Unique Requests**: One request per pilot per date range
3. **Rank Separation**: Captains and First Officers evaluated independently
4. **Active Pilots Only**: Cannot request leave if inactive

### Policy Rules (Can Override with Justification)

1. **Late Request**: ≥21 days notice recommended
2. **Fair Distribution**: Seniority order within same rank
3. **Request Limits**: No explicit limit, but managed via crew minimum
4. **Leave Types**: No limits per type (but may track for patterns)

### Operational Rules

1. **Roster Periods**: Leave aligned to 28-day cycles
2. **Certification Conflicts**: Avoid leave during required checks
3. **Maintenance Windows**: Avoid leave during aircraft downtime
4. **Scheduling**: Consider pilot roster assignments

## 7. Recommendation Engine Workflow

### 7.1 Synchronous Processing (Immediate)

```
Input: Single LeaveRequest

1. Basic Validation (< 10ms)
   - Request data valid?
   - Pilot exists and active?
   - Dates make sense?

2. Crew Impact Analysis (50-100ms)
   - Calculate crew availability for dates
   - Check minimum crew violation
   
3. Conflict Detection (50-100ms)
   - Find overlapping requests
   - Analyze seniority comparison
   - Check collective impact

4. Risk Assessment (10-50ms)
   - Operational risks
   - Qualification checks
   - Policy compliance

5. Generate Recommendation (10-20ms)
   - Calculate combined score
   - Determine confidence
   - Build explanation

Total: 130-280ms
Response: LeaveRecommendation object
```

### 7.2 Background Analysis (Async)

```
Input: Single LeaveRequest (or batch)

1. Historical Pattern Analysis
   - Analyze pilot's history
   - Compare to fleet patterns
   - Identify anomalies

2. Predictive Analysis
   - Forecast crew availability next 30 days
   - Identify shortage periods
   - Suggest optimal approval timing

3. Optimization
   - Find best approval subset if multiple conflicts
   - Suggest reschedule options
   - Calculate fairness metrics

Processing: Background job (minutes)
Output: Enhanced recommendation with alternatives
```

## 8. Integration Points

### 8.1 With Leave Approval Service

```
Current: calculatePriorityScore()
Enhanced by: Full recommendation engine
Usage: Sort pending requests by recommended action first, 
       then by confidence, then by priority score
```

### 8.2 With Leave Eligibility Service

```
Current: checkLeaveEligibility()
Enhanced by: Detailed risk scoring
Usage: Provide more detailed reasoning for REQUIRE_REVIEW cases
```

### 8.3 With API Routes

```
GET /api/leave-requests
  Enhanced: Add recommended_action, confidence to each request

GET /api/leave-requests/[id]
  Enhanced: Add full LeaveRecommendation object

POST /api/leave-requests/bulk-approve
  Enhanced: Validate bulk operations against all requests,
           prevent crew minimum violations
```

## 9. Data Required for Recommendation Engine

### Required (Must Have)

- All active pilots with seniority numbers
- All leave_requests (PENDING/APPROVED/DENIED)
- Current date
- Crew minimum requirements (10 per rank)

### Highly Recommended (Should Have)

- Historical approval/denial decisions (last 1 year)
- Pilot qualifications and certification status
- Roster assignments (which pilots work which schedules)
- Aircraft operational status

### Nice to Have (Would Improve)

- Leave preferences per pilot
- Pilot cost/salary data
- Fleet scheduling calendar
- Maintenance schedule
- Historical crew shortage incidents
- Pilot performance metrics

## 10. Testing Strategy

### Unit Tests

1. Crew availability calculation edge cases
2. Conflict detection accuracy
3. Scoring algorithm correctness
4. Boundary conditions (exactly at minimum crew)

### Integration Tests

1. End-to-end approval recommendations
2. Bulk operation validation
3. API integration
4. Database consistency

### Scenario Tests

**Scenario 1: Simple Approval**
- No conflicts, adequate crew
- Expected: AUTO_APPROVE, high confidence

**Scenario 2: Crew Shortage**
- Would drop below minimum
- Expected: AUTO_DENY or REQUIRE_REVIEW (if some can be approved)

**Scenario 3: Seniority Conflict**
- Multiple same-rank requests
- Expected: REQUIRE_REVIEW with seniority guidance

**Scenario 4: Late Request**
- < 21 days notice
- Expected: REQUIRE_REVIEW with policy note

**Scenario 5: Complex Multi-Request**
- Multiple overlapping requests, varying seniorities
- Expected: REQUIRE_REVIEW with detailed analysis

## 11. Performance Targets

- Single request analysis: < 500ms
- Batch (50 requests): < 5 seconds
- Crew availability forecast (30 days): < 1 second
- Historical analysis (async): < 30 seconds

## 12. Reporting & Analytics

### Metrics to Track

1. Recommendation acceptance rate (% AUTO_APPROVE approved, etc.)
2. Override rate (% REQUIRE_REVIEW that got different decision)
3. Crew shortage incidents (dates with < 10 crew)
4. Request approval/denial rate by type
5. Late request incidence
6. Fairness metrics (approval distribution by seniority)

### Dashboards

1. Recommendation engine effectiveness
2. Crew availability forecast (30-day rolling)
3. Leave request pipeline (pending → decision)
4. Pilot fairness (leave approval equity)

## Conclusion

The recommendation engine should:

1. **Maintain Crew Minimum** (non-negotiable)
2. **Apply Seniority Fairly** (within same rank)
3. **Explain Decisions** (transparency)
4. **Support Managers** (not replace them)
5. **Learn from History** (improve over time)

The system has solid foundations with conflict detection, crew availability calculations, and priority scoring. The recommendation engine will add:

- Unified decision framework
- Confidence scoring
- Risk assessment
- Alternative suggestions
- Historical pattern analysis
- Predictive capabilities

