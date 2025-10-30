# Enhanced Leave Management System - Implementation Plan

**Date**: October 26, 2025
**Project**: Fleet Management V2 - Leave Approval Enhancement
**Status**: Planning Phase

---

## 🎯 Executive Summary

This plan implements three major enhancements to the Leave Approval System:

1. **Intelligent Date Recommendation Engine** - Suggests optimal leave dates with zero violations
2. **Calendar View** - Visual interface for leave requests and recommended dates
3. **21-Day Final Review System** - Automated deadline tracking with PDF report generation

---

## 📋 Requirements Analysis

### Requirement 1: Intelligent Date Recommendation System

**User Request**:
> "Can we come with a system to recommend dates to have no violations and the leave priority will be based on seniority, less days taken in that year. Pilot who has been taking many days leave during that year will be given less priority."

**Enhanced Solution**:
- **Leave Balance Tracking**: Track days taken vs. entitlement per year
- **Fairness Algorithm**: Pilots with fewer days taken get higher priority
- **Seniority Factor**: Lower seniority number = higher base priority
- **Violation-Free Guarantee**: Only recommend dates that maintain crew minimums
- **Alternative Date Suggestions**: If requested dates violate, suggest nearest alternatives

### Requirement 2: Calendar View

**User Request**:
> "Can we also have a calendar view to view leave requests and the recommended dates"

**Solution**:
- **Visual Calendar Interface**: Month/year view with color-coded leave requests
- **Recommended Dates Highlight**: Show AI-suggested optimal dates
- **Interactive Selection**: Click dates to see details and make requests
- **Crew Availability Overlay**: Visual indicators for crew status each day
- **Multi-Pilot View**: See all pilots' leave in one calendar

### Requirement 3: 21-Day Final Review System

**User Request**:
> "All requests must be reviewed and provided to the rostering team 21 days before the next roster commences, therefore we need a report generation and be able to provide a PDF copy to the rostering team"

**Solution**:
- **Deadline Tracking**: Automatic calculation of 21-day deadline per roster period
- **Alert System**: Warnings when approaching deadline
- **Final Review Report**: Comprehensive PDF with all approved/denied requests
- **Rostering Team Export**: Professional PDF format ready for distribution
- **Audit Trail**: Track when reports were generated and sent

---

## 🏗️ System Architecture

### Component Hierarchy

```
Enhanced Leave System
├── 1. Leave Balance Tracking System
│   ├── Database Schema (leave_balances table)
│   ├── Annual Entitlement Service
│   ├── Balance Calculation Logic
│   └── Historical Usage Tracking
│
├── 2. Intelligent Recommendation Engine
│   ├── Date Recommendation Service
│   ├── Fairness Scoring Algorithm
│   ├── Alternative Date Finder
│   ├── Confidence Scoring
│   └── API Endpoints
│
├── 3. Calendar View Interface
│   ├── Calendar Component (Full Calendar)
│   ├── Leave Request Overlay
│   ├── Recommended Dates Display
│   ├── Crew Availability Indicators
│   └── Interactive Date Selection
│
└── 4. Final Review & PDF System
    ├── Deadline Calculation Service
    ├── Alert & Notification System
    ├── Final Review Dashboard
    ├── PDF Report Generator
    └── Email Distribution Service
```

---

## 📊 Enhanced Priority Algorithm

### Current Priority Scoring (Existing)
```
Priority Score = Seniority Factor + Urgency + Request Type + Conflict Penalty
- Seniority: (100 - seniority_number) × 50  [0-4950 points]
- Urgency: max(0, 30 - days_until_leave) × 2  [0-60 points]
- Request Type: ANNUAL +20, SICK +10  [0-20 points]
- Conflicts: -15 per conflict  [penalty]
```

### Enhanced Priority Scoring (New)
```
Enhanced Priority = Base Priority + Fairness Bonus + Pattern Bonus

Base Priority (70%):
- Seniority Factor: (100 - seniority_number) × 50  [0-4950 points]
- Urgency Factor: max(0, 30 - days_until_leave) × 2  [0-60 points]
- Request Type: ANNUAL +20, SICK +10  [0-20 points]

Fairness Bonus (20%):
- Days Remaining = (Annual Entitlement - Days Taken This Year)
- Fairness Score = (Days Remaining / Annual Entitlement) × 1000
- More days remaining = higher priority
- Example: 25 days left of 28 = 892 points
           5 days left of 28 = 178 points

Pattern Bonus (10%):
- Spread Bonus: +100 if this is first leave in 90 days
- Short Duration Bonus: +50 if ≤ 3 days
- Off-Peak Bonus: +50 if outside peak periods (Dec-Jan)

Total Score Range: 0-6,280 points
```

---

## 🗄️ Database Schema Changes

### New Table: `leave_balances`

```sql
CREATE TABLE leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pilot_id UUID NOT NULL REFERENCES pilots(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,

  -- Entitlements
  annual_entitlement DECIMAL(4,1) NOT NULL DEFAULT 28.0,
  sick_entitlement DECIMAL(4,1) NOT NULL DEFAULT 10.0,

  -- Usage tracking
  annual_taken DECIMAL(4,1) NOT NULL DEFAULT 0.0,
  annual_pending DECIMAL(4,1) NOT NULL DEFAULT 0.0,
  sick_taken DECIMAL(4,1) NOT NULL DEFAULT 0.0,
  sick_pending DECIMAL(4,1) NOT NULL DEFAULT 0.0,

  -- Calculated fields
  annual_remaining DECIMAL(4,1) GENERATED ALWAYS AS
    (annual_entitlement - annual_taken - annual_pending) STORED,
  sick_remaining DECIMAL(4,1) GENERATED ALWAYS AS
    (sick_entitlement - sick_taken - sick_pending) STORED,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE(pilot_id, year),
  CHECK (annual_taken >= 0),
  CHECK (sick_taken >= 0),
  CHECK (annual_pending >= 0),
  CHECK (sick_pending >= 0)
);

-- Indexes
CREATE INDEX idx_leave_balances_pilot_year ON leave_balances(pilot_id, year);
CREATE INDEX idx_leave_balances_year ON leave_balances(year);

-- Auto-update trigger
CREATE OR REPLACE FUNCTION update_leave_balances_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leave_balances_updated_at
  BEFORE UPDATE ON leave_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_leave_balances_timestamp();
```

### New Table: `final_review_deadlines`

```sql
CREATE TABLE final_review_deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roster_period VARCHAR(20) NOT NULL UNIQUE, -- e.g., "RP01/2026"
  roster_start_date DATE NOT NULL,
  deadline_date DATE NOT NULL, -- 21 days before roster_start_date

  -- Status tracking
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, in_review, completed
  total_requests INTEGER NOT NULL DEFAULT 0,
  reviewed_requests INTEGER NOT NULL DEFAULT 0,
  pending_requests INTEGER NOT NULL DEFAULT 0,

  -- Report generation
  report_generated_at TIMESTAMPTZ,
  report_generated_by UUID REFERENCES an_users(id),
  report_file_path TEXT,

  -- Alerts
  first_alert_sent_at TIMESTAMPTZ,
  final_alert_sent_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CHECK (deadline_date < roster_start_date),
  CHECK (status IN ('pending', 'in_review', 'completed', 'overdue'))
);

-- Indexes
CREATE INDEX idx_final_review_deadlines_period ON final_review_deadlines(roster_period);
CREATE INDEX idx_final_review_deadlines_deadline ON final_review_deadlines(deadline_date);
CREATE INDEX idx_final_review_deadlines_status ON final_review_deadlines(status);
```

### New Table: `recommended_dates`

```sql
CREATE TABLE recommended_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pilot_id UUID NOT NULL REFERENCES pilots(id) ON DELETE CASCADE,

  -- Original request (if applicable)
  original_request_id UUID REFERENCES leave_requests(id),
  original_start_date DATE,
  original_end_date DATE,

  -- Recommended dates
  recommended_start_date DATE NOT NULL,
  recommended_end_date DATE NOT NULL,
  duration_days INTEGER NOT NULL,

  -- Scoring
  recommendation_score DECIMAL(6,2) NOT NULL, -- 0-100 confidence score
  crew_availability_score DECIMAL(4,2) NOT NULL, -- 0-100
  fairness_score DECIMAL(4,2) NOT NULL, -- 0-100
  seniority_score DECIMAL(4,2) NOT NULL, -- 0-100

  -- Reasoning
  recommendation_reason TEXT,
  alternative_rank INTEGER, -- 1 = best alternative, 2 = second best, etc.

  -- Status
  accepted BOOLEAN DEFAULT FALSE,
  accepted_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),

  -- Constraints
  CHECK (recommended_end_date >= recommended_start_date),
  CHECK (duration_days > 0),
  CHECK (recommendation_score >= 0 AND recommendation_score <= 100)
);

-- Indexes
CREATE INDEX idx_recommended_dates_pilot ON recommended_dates(pilot_id);
CREATE INDEX idx_recommended_dates_original ON recommended_dates(original_request_id);
CREATE INDEX idx_recommended_dates_dates ON recommended_dates(recommended_start_date, recommended_end_date);
CREATE INDEX idx_recommended_dates_score ON recommended_dates(recommendation_score DESC);
```

---

## 🔧 Service Layer Implementation

### 1. Leave Balance Service

**File**: `lib/services/leave-balance-service.ts`

```typescript
/**
 * Leave Balance Service
 * Manages annual leave entitlements and usage tracking
 */

export interface LeaveBalance {
  id: string
  pilotId: string
  year: number
  annualEntitlement: number
  annualTaken: number
  annualPending: number
  annualRemaining: number
  sickEntitlement: number
  sickTaken: number
  sickPending: number
  sickRemaining: number
}

export interface BalanceUpdate {
  pilotId: string
  year: number
  leaveType: 'ANNUAL' | 'SICK'
  days: number
  operation: 'add_taken' | 'remove_taken' | 'add_pending' | 'remove_pending'
}

// Core functions
export async function getLeaveBalance(pilotId: string, year: number): Promise<LeaveBalance | null>
export async function initializeBalanceForYear(pilotId: string, year: number): Promise<LeaveBalance>
export async function updateBalance(update: BalanceUpdate): Promise<LeaveBalance>
export async function getAllBalancesForYear(year: number): Promise<LeaveBalance[]>
export async function calculateFairnessScore(pilotId: string, year: number): Promise<number>
export async function getRankingByFairness(year: number, rank: 'Captain' | 'First Officer'): Promise<LeaveBalance[]>
```

### 2. Date Recommendation Service

**File**: `lib/services/date-recommendation-service.ts`

```typescript
/**
 * Date Recommendation Service
 * Intelligent algorithm to suggest optimal leave dates
 */

export interface DateRecommendationRequest {
  pilotId: string
  desiredStartDate?: Date
  desiredEndDate?: Date
  duration: number // Number of days
  flexibility: number // Days willing to shift (e.g., ±7 days)
  leaveType: 'ANNUAL' | 'SICK' | 'RDO'
}

export interface DateRecommendation {
  recommendedStartDate: Date
  recommendedEndDate: Date
  durationDays: number
  confidence: number // 0-100%
  crewAvailabilityScore: number
  fairnessScore: number
  seniorityScore: number
  overallScore: number
  reasoning: string
  alternativeRank: number
  violations: string[]
  conflicts: ConflictInfo[]
}

export interface RecommendationResponse {
  requestedDates: DateRecommendation | null // null if violates
  alternatives: DateRecommendation[] // Up to 5 alternative date ranges
  analysis: {
    originalDateViolations: string[]
    crewAvailabilityForecast: CrewAvailability[]
    pilotLeaveBalance: LeaveBalance
    conflictingPilots: string[]
  }
}

// Core functions
export async function recommendDates(request: DateRecommendationRequest): Promise<RecommendationResponse>
export async function findAlternativeDates(request: DateRecommendationRequest, maxAlternatives: number): Promise<DateRecommendation[]>
export async function validateDates(pilotId: string, startDate: Date, endDate: Date): Promise<ValidationResult>
export async function calculateRecommendationScore(pilotId: string, startDate: Date, endDate: Date): Promise<number>
export async function getBestDatesForPilot(pilotId: string, month: number, year: number): Promise<DateRecommendation[]>
```

### 3. Final Review Service

**File**: `lib/services/final-review-service.ts`

```typescript
/**
 * Final Review Service
 * Manages 21-day deadline tracking and final review process
 */

export interface FinalReviewDeadline {
  id: string
  rosterPeriod: string
  rosterStartDate: Date
  deadlineDate: Date
  daysUntilDeadline: number
  status: 'pending' | 'in_review' | 'completed' | 'overdue'
  totalRequests: number
  reviewedRequests: number
  pendingRequests: number
  progress: number // percentage
}

export interface FinalReviewReport {
  rosterPeriod: string
  generatedAt: Date
  generatedBy: string
  deadlineDate: Date
  summary: {
    totalRequests: number
    approved: number
    denied: number
    pending: number
  }
  approvedRequests: LeaveRequestWithEligibility[]
  deniedRequests: LeaveRequestWithEligibility[]
  pendingRequests: LeaveRequestWithEligibility[]
  crewAvailability: CrewAvailabilitySummary
  violations: string[]
  notes: string
}

// Core functions
export async function calculateDeadlineForPeriod(rosterPeriod: string): Promise<FinalReviewDeadline>
export async function getUpcomingDeadlines(daysAhead: number): Promise<FinalReviewDeadline[]>
export async function getDeadlineStatus(rosterPeriod: string): Promise<FinalReviewDeadline>
export async function generateFinalReviewReport(rosterPeriod: string): Promise<FinalReviewReport>
export async function markDeadlineCompleted(rosterPeriod: string, userId: string): Promise<void>
export async function sendDeadlineAlert(deadline: FinalReviewDeadline, alertType: 'first' | 'final'): Promise<void>
```

### 4. PDF Report Service (Enhanced)

**File**: `lib/services/pdf-report-service.ts` (enhance existing)

```typescript
/**
 * PDF Report Service
 * Generate professional PDF reports for rostering team
 */

export interface RosteringTeamReport {
  rosterPeriod: string
  reportDate: Date
  deadline: Date
  prepared_by: string

  sections: {
    executiveSummary: string
    approvedLeave: LeaveRequestSummary[]
    deniedLeave: LeaveRequestSummary[]
    pendingLeave: LeaveRequestSummary[]
    crewAvailability: CrewForecast[]
    violations: ViolationReport[]
    recommendations: string[]
  }

  attachments: {
    detailedSchedule: CalendarData
    crewMinimumChart: ChartData
    complianceMetrics: MetricsData
  }
}

// Core functions
export async function generateRosteringTeamPDF(rosterPeriod: string): Promise<Buffer>
export async function generateCalendarPDF(month: number, year: number): Promise<Buffer>
export async function generatePilotLeaveSummaryPDF(pilotId: string, year: number): Promise<Buffer>
export async function emailReportToRosteringTeam(rosterPeriod: string, recipients: string[]): Promise<void>
```

---

## 🎨 UI Components

### 1. Calendar View Component

**File**: `components/leave/leave-calendar-view.tsx`

```typescript
/**
 * Leave Calendar View
 * Interactive calendar showing all leave requests and recommended dates
 */

interface LeaveCalendarViewProps {
  month: number
  year: number
  selectedPilotId?: string // Filter to specific pilot
  showRecommendations?: boolean
  onDateSelect?: (date: Date) => void
}

// Features:
- Month/Year navigation
- Color-coded leave requests by status
- Recommended dates highlighted with special styling
- Crew availability indicators (green/yellow/red)
- Hover tooltips with request details
- Click to view full request details
- Multi-pilot overlay mode
- Export to PDF/image
```

### 2. Date Recommendation Panel

**File**: `components/leave/date-recommendation-panel.tsx`

```typescript
/**
 * Date Recommendation Panel
 * Shows AI-suggested optimal dates with reasoning
 */

interface DateRecommendationPanelProps {
  pilotId: string
  requestedDates?: { start: Date; end: Date }
  duration: number
  onAcceptRecommendation?: (recommendation: DateRecommendation) => void
}

// Features:
- Original request validation
- Top 5 alternative dates
- Confidence scores with visual indicators
- Detailed reasoning explanations
- "Accept Recommendation" quick action
- Comparison view (requested vs. recommended)
- Fairness score display
```

### 3. Final Review Dashboard

**File**: `app/dashboard/leave/final-review/page.tsx`

```typescript
/**
 * Final Review Dashboard
 * 21-day deadline tracking and report generation
 */

// Features:
- Countdown timer to next deadline
- Progress bars for each roster period
- Quick stats (total/reviewed/pending)
- Alert indicators (approaching deadline)
- "Generate Report" button
- Preview report before PDF export
- Email to rostering team
- Historical reports archive
```

### 4. Leave Balance Widget

**File**: `components/leave/leave-balance-widget.tsx`

```typescript
/**
 * Leave Balance Widget
 * Shows pilot's leave entitlement and usage
 */

interface LeaveBalanceWidgetProps {
  pilotId: string
  year: number
  compact?: boolean
}

// Features:
- Annual leave: taken/pending/remaining
- Sick leave: taken/pending/remaining
- Visual progress bars
- Fairness ranking indicator
- Year-over-year comparison
- "Request Leave" quick action
```

---

## 📡 API Endpoints

### Recommendation Endpoints

```typescript
// POST /api/leave-requests/recommend-dates
// Request optimal leave dates with alternatives
{
  pilotId: string
  desiredStartDate?: string
  desiredEndDate?: string
  duration: number
  flexibility: number
  leaveType: string
}

// GET /api/leave-requests/best-dates/:pilotId/:month/:year
// Get top recommended dates for a pilot in a specific month

// POST /api/leave-requests/validate-dates
// Check if specific dates would violate crew minimums
{
  pilotId: string
  startDate: string
  endDate: string
}
```

### Balance Endpoints

```typescript
// GET /api/leave-balances/:pilotId/:year
// Get leave balance for a pilot in a specific year

// GET /api/leave-balances/ranking/:year/:rank
// Get fairness ranking for all pilots of a rank

// POST /api/leave-balances/initialize/:year
// Initialize balances for all pilots for a new year
```

### Final Review Endpoints

```typescript
// GET /api/final-review/deadlines
// Get all upcoming deadlines

// GET /api/final-review/:rosterPeriod
// Get deadline status for specific roster period

// POST /api/final-review/:rosterPeriod/generate-report
// Generate final review PDF report

// POST /api/final-review/:rosterPeriod/send-email
// Email report to rostering team
{
  recipients: string[]
  message?: string
}

// GET /api/final-review/reports/history
// Get list of all generated reports
```

---

## 🧮 Algorithm Details

### Recommendation Engine Logic

```typescript
function recommendOptimalDates(request: DateRecommendationRequest): DateRecommendation[] {
  // Step 1: Get pilot data
  const pilot = await getPilot(request.pilotId)
  const balance = await getLeaveBalance(request.pilotId, currentYear)

  // Step 2: Define search window
  const searchStart = request.desiredStartDate
    ? subDays(request.desiredStartDate, request.flexibility)
    : new Date()
  const searchEnd = request.desiredStartDate
    ? addDays(request.desiredStartDate, request.flexibility)
    : addMonths(new Date(), 3)

  // Step 3: Generate candidate date ranges
  const candidates: DateRange[] = []
  for (let start = searchStart; start <= searchEnd; start = addDays(start, 1)) {
    const end = addDays(start, request.duration - 1)
    if (end <= searchEnd) {
      candidates.push({ start, end })
    }
  }

  // Step 4: Score each candidate
  const scoredCandidates = await Promise.all(
    candidates.map(async (range) => {
      const crewScore = await calculateCrewAvailabilityScore(range.start, range.end, pilot.role)
      const fairnessScore = calculateFairnessScore(balance)
      const seniorityScore = calculateSeniorityScore(pilot.seniority_number)
      const conflictPenalty = await calculateConflictPenalty(pilot.id, range.start, range.end)

      const overallScore =
        (crewScore * 0.40) +
        (fairnessScore * 0.25) +
        (seniorityScore * 0.15) +
        (conflictPenalty * 0.20)

      return {
        range,
        crewScore,
        fairnessScore,
        seniorityScore,
        overallScore,
        violations: await checkViolations(pilot.id, range.start, range.end)
      }
    })
  )

  // Step 5: Filter out violating dates
  const validCandidates = scoredCandidates.filter(c => c.violations.length === 0)

  // Step 6: Sort by overall score
  const sorted = validCandidates.sort((a, b) => b.overallScore - a.overallScore)

  // Step 7: Return top 5 recommendations
  return sorted.slice(0, 5).map((candidate, index) => ({
    recommendedStartDate: candidate.range.start,
    recommendedEndDate: candidate.range.end,
    durationDays: request.duration,
    confidence: candidate.overallScore,
    crewAvailabilityScore: candidate.crewScore,
    fairnessScore: candidate.fairnessScore,
    seniorityScore: candidate.seniorityScore,
    overallScore: candidate.overallScore,
    reasoning: generateReasoning(candidate),
    alternativeRank: index + 1,
    violations: [],
    conflicts: []
  }))
}

function calculateFairnessScore(balance: LeaveBalance): number {
  // More days remaining = higher score
  const remainingRatio = balance.annualRemaining / balance.annualEntitlement
  return remainingRatio * 100
}

function calculateSeniorityScore(seniorityNumber: number): number {
  // Lower seniority number = higher score
  return ((27 - seniorityNumber) / 27) * 100
}

function calculateCrewAvailabilityScore(start: Date, end: Date, rank: string): number {
  // Higher crew availability = higher score
  const availability = await getCrewAvailabilityForRange(start, end, rank)
  const minRequired = 10
  const avgAvailable = availability.reduce((sum, day) => sum + day.available, 0) / availability.length

  // Score: 100 if avgAvailable >= minRequired + 5 (buffer)
  //        0 if avgAvailable <= minRequired
  const score = Math.min(100, Math.max(0, ((avgAvailable - minRequired) / 5) * 100))
  return score
}
```

---

## 📅 Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Create database migrations for new tables
- [ ] Implement leave balance service
- [ ] Build balance initialization for all pilots
- [ ] Add balance tracking to existing leave approval logic
- [ ] Create balance UI widget
- [ ] Test balance calculations

### Phase 2: Recommendation Engine (Week 2)
- [ ] Implement date recommendation algorithm
- [ ] Build recommendation service with scoring
- [ ] Create recommendation API endpoints
- [ ] Add alternative date finder
- [ ] Implement recommendation panel UI
- [ ] Test recommendation accuracy

### Phase 3: Calendar View (Week 3)
- [ ] Integrate FullCalendar or build custom calendar
- [ ] Add leave request overlays
- [ ] Implement recommended dates highlighting
- [ ] Add crew availability indicators
- [ ] Create interactive date selection
- [ ] Build calendar PDF export
- [ ] Test calendar functionality

### Phase 4: Final Review System (Week 4)
- [ ] Implement deadline calculation logic
- [ ] Build final review service
- [ ] Create deadline tracking dashboard
- [ ] Enhance PDF generation for rostering team
- [ ] Add email distribution system
- [ ] Implement alert notifications
- [ ] Build report history archive
- [ ] Test end-to-end workflow

---

## 🧪 Testing Strategy

### Unit Tests
- Leave balance calculations
- Recommendation scoring algorithm
- Deadline calculation logic
- PDF generation functions

### Integration Tests
- Balance updates on leave approval/denial
- Recommendation API endpoints
- Calendar data fetching
- Final review report generation

### E2E Tests
- Complete leave request with recommendations
- Calendar view navigation and interaction
- Final review workflow from deadline to PDF
- Rostering team email delivery

### Performance Tests
- Recommendation engine with 100+ candidates
- Calendar rendering with 500+ leave requests
- PDF generation with full year data
- Concurrent balance updates

---

## 📊 Success Metrics

### Functionality
- ✅ 100% of recommendations avoid crew violations
- ✅ Average confidence score > 75%
- ✅ Recommendation generated in < 500ms
- ✅ Calendar loads < 2 seconds
- ✅ PDF generates < 5 seconds
- ✅ Deadlines calculated accurately for all roster periods

### User Experience
- ✅ Pilots accept recommended dates > 60% of time
- ✅ Fairness score variance < 20% (equitable distribution)
- ✅ Final review reports generated on time 100%
- ✅ Calendar view rated intuitive by users
- ✅ Zero crew minimum violations after implementation

---

## 🔐 Security & Compliance

### Authorization
- Only Admins/Managers can access final review
- Only Admins can generate reports
- Pilots can only see their own balances
- Recommendations respect role-based access

### Data Privacy
- Leave balance history not shared between pilots
- PDF reports encrypted in transit
- Audit logging for all recommendations accepted
- Report generation tracked with user attribution

### Audit Trail
- Every balance update logged
- Every recommendation tracked
- Every deadline completion recorded
- Every PDF generation logged with recipient list

---

## 📝 Next Steps

1. **Get User Approval** on this plan
2. **Prioritize Phases** based on business urgency
3. **Allocate Resources** for each phase
4. **Begin Phase 1** with database migrations
5. **Iterate and Test** throughout implementation

---

**Plan Created**: October 26, 2025
**Status**: Ready for Implementation
**Estimated Effort**: 4 weeks (1 phase per week)
**Risk Level**: Medium (new algorithm complexity)

