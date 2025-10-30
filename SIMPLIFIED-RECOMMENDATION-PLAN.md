# Simplified Leave Recommendation System - Implementation Plan

**Date**: October 26, 2025
**Approach**: Calculate approved days from existing data (no new balance tracking system)
**Status**: Ready for Implementation

---

## 🎯 Simplified Requirements

Based on user feedback, the system will:

1. **Calculate Approved Days** - Query existing `leave_requests` table for APPROVED requests in current year
2. **Fairness Priority** - Pilots with fewer approved days get higher priority
3. **Seniority Factor** - Lower seniority number = higher base priority
4. **Violation-Free Recommendations** - Only suggest dates that maintain crew minimums
5. **Calendar View** - Visual interface for leave and recommended dates
6. **21-Day Final Review** - PDF report generation for rostering team

**No new database tables needed** - everything calculated from existing data!

---

## 📊 Simplified Priority Algorithm

### Enhanced Priority Scoring (Using Existing Data)

```typescript
Enhanced Priority = Seniority Score + Fairness Score + Urgency Score + Type Score

1. Seniority Score (40% weight):
   Score = (100 - seniority_number) × 50
   Range: 0-4,950 points
   Example: Seniority #1 = 4,950 points
            Seniority #27 = 3,650 points

2. Fairness Score (30% weight):
   // Calculate from existing leave_requests table
   approved_days_this_year = SUM(duration) WHERE status='APPROVED' AND YEAR(start_date) = current_year

   // Inverse relationship: fewer days taken = higher score
   Score = (365 - approved_days_this_year) × 10
   Range: 0-3,650 points

   Example: 5 days approved this year = 3,600 points
            25 days approved this year = 3,400 points
            0 days approved this year = 3,650 points (highest fairness)

3. Urgency Score (20% weight):
   Score = max(0, 30 - days_until_leave) × 2
   Range: 0-60 points

4. Type Score (10% weight):
   ANNUAL = 20 points
   SICK = 10 points
   Others = 0 points
   Range: 0-20 points

Total Maximum Score: 8,680 points
```

### Calculation Examples

**Pilot A**: Seniority #5, 10 days approved this year
- Seniority: (100 - 5) × 50 = 4,750
- Fairness: (365 - 10) × 10 = 3,550
- Urgency: 20 days until leave = (30-20) × 2 = 20
- Type: ANNUAL = 20
- **Total: 8,340 points**

**Pilot B**: Seniority #10, 25 days approved this year
- Seniority: (100 - 10) × 50 = 4,500
- Fairness: (365 - 25) × 10 = 3,400
- Urgency: 25 days until leave = (30-25) × 2 = 10
- Type: ANNUAL = 20
- **Total: 7,930 points**

**Result**: Pilot A gets higher priority (fewer days taken despite lower seniority)

---

## 🗄️ No New Database Tables Required!

### Existing Data We'll Use

```sql
-- Calculate approved days for a pilot in current year
SELECT
  pilot_id,
  SUM(EXTRACT(DAY FROM (end_date - start_date + 1))) as approved_days_this_year
FROM leave_requests
WHERE
  status = 'APPROVED'
  AND EXTRACT(YEAR FROM start_date) = EXTRACT(YEAR FROM CURRENT_DATE)
GROUP BY pilot_id;

-- Get fairness ranking (pilots with fewest approved days first)
SELECT
  p.id,
  p.first_name || ' ' || p.last_name as name,
  p.seniority_number,
  COALESCE(SUM(EXTRACT(DAY FROM (lr.end_date - lr.start_date + 1))), 0) as approved_days,
  (365 - COALESCE(SUM(EXTRACT(DAY FROM (lr.end_date - lr.start_date + 1))), 0)) * 10 as fairness_score
FROM pilots p
LEFT JOIN leave_requests lr ON p.id = lr.pilot_id
  AND lr.status = 'APPROVED'
  AND EXTRACT(YEAR FROM lr.start_date) = EXTRACT(YEAR FROM CURRENT_DATE)
WHERE p.role = 'Captain' -- or 'First Officer'
GROUP BY p.id, p.first_name, p.last_name, p.seniority_number
ORDER BY fairness_score DESC, p.seniority_number ASC;
```

### Optional: Materialized View for Performance

If querying becomes slow, we can create a materialized view:

```sql
CREATE MATERIALIZED VIEW pilot_leave_summary AS
SELECT
  p.id as pilot_id,
  p.first_name || ' ' || p.last_name as pilot_name,
  p.role,
  p.seniority_number,
  EXTRACT(YEAR FROM CURRENT_DATE) as year,
  COALESCE(SUM(
    CASE WHEN lr.status = 'APPROVED'
    THEN EXTRACT(DAY FROM (lr.end_date - lr.start_date + 1))
    ELSE 0 END
  ), 0) as approved_days,
  COALESCE(SUM(
    CASE WHEN lr.status = 'PENDING'
    THEN EXTRACT(DAY FROM (lr.end_date - lr.start_date + 1))
    ELSE 0 END
  ), 0) as pending_days,
  (365 - COALESCE(SUM(
    CASE WHEN lr.status = 'APPROVED'
    THEN EXTRACT(DAY FROM (lr.end_date - lr.start_date + 1))
    ELSE 0 END
  ), 0)) * 10 as fairness_score
FROM pilots p
LEFT JOIN leave_requests lr ON p.id = lr.pilot_id
  AND EXTRACT(YEAR FROM lr.start_date) = EXTRACT(YEAR FROM CURRENT_DATE)
GROUP BY p.id, p.first_name, p.last_name, p.role, p.seniority_number;

-- Refresh daily or after leave approvals
CREATE INDEX idx_pilot_leave_summary_pilot ON pilot_leave_summary(pilot_id);
CREATE INDEX idx_pilot_leave_summary_fairness ON pilot_leave_summary(fairness_score DESC);
```

---

## 🔧 Service Layer Implementation (Simplified)

### Enhanced Leave Approval Service

**File**: `lib/services/leave-approval-service.ts` (enhance existing)

```typescript
/**
 * Calculate approved days for a pilot in a specific year
 */
export async function getApprovedDaysForYear(
  pilotId: string,
  year: number = new Date().getFullYear()
): Promise<number> {
  const { data, error } = await supabase
    .from('leave_requests')
    .select('start_date, end_date')
    .eq('pilot_id', pilotId)
    .eq('status', 'APPROVED')
    .gte('start_date', `${year}-01-01`)
    .lte('start_date', `${year}-12-31`)

  if (error) throw new Error(`Failed to fetch approved days: ${error.message}`)

  return data.reduce((total, request) => {
    const start = new Date(request.start_date)
    const end = new Date(request.end_date)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    return total + days
  }, 0)
}

/**
 * Calculate enhanced priority score with fairness factor
 */
export async function calculateEnhancedPriorityScore(
  request: LeaveRequest
): Promise<number> {
  const pilot = request.pilots
  const year = new Date(request.start_date).getFullYear()

  // 1. Seniority Score (40% weight)
  const seniorityScore = (100 - pilot.seniority_number) * 50

  // 2. Fairness Score (30% weight) - fewer approved days = higher score
  const approvedDays = await getApprovedDaysForYear(request.pilot_id, year)
  const fairnessScore = (365 - approvedDays) * 10

  // 3. Urgency Score (20% weight)
  const daysUntilLeave = differenceInDays(parseISO(request.start_date), new Date())
  const urgencyScore = Math.max(0, 30 - daysUntilLeave) * 2

  // 4. Type Score (10% weight)
  let typeScore = 0
  if (request.request_type === 'ANNUAL') typeScore = 20
  if (request.request_type === 'SICK') typeScore = 10

  const totalScore = seniorityScore + fairnessScore + urgencyScore + typeScore
  return totalScore
}

/**
 * Get fairness ranking for all pilots of a rank
 */
export async function getFairnessRanking(
  rank: 'Captain' | 'First Officer',
  year: number = new Date().getFullYear()
): Promise<Array<{
  pilotId: string
  pilotName: string
  seniorityNumber: number
  approvedDays: number
  fairnessScore: number
  combinedScore: number
}>> {
  // Get all pilots of this rank
  const { data: pilots, error } = await supabase
    .from('pilots')
    .select('id, first_name, last_name, seniority_number')
    .eq('role', rank)
    .order('seniority_number')

  if (error) throw new Error(`Failed to fetch pilots: ${error.message}`)

  // Calculate scores for each pilot
  const rankings = await Promise.all(
    pilots.map(async (pilot) => {
      const approvedDays = await getApprovedDaysForYear(pilot.id, year)
      const fairnessScore = (365 - approvedDays) * 10
      const seniorityScore = (100 - pilot.seniority_number) * 50
      const combinedScore = seniorityScore + fairnessScore

      return {
        pilotId: pilot.id,
        pilotName: `${pilot.first_name} ${pilot.last_name}`,
        seniorityNumber: pilot.seniority_number,
        approvedDays,
        fairnessScore,
        combinedScore
      }
    })
  )

  // Sort by combined score (descending)
  return rankings.sort((a, b) => b.combinedScore - a.combinedScore)
}
```

### Date Recommendation Service (Simplified)

**File**: `lib/services/date-recommendation-service.ts` (new)

```typescript
/**
 * Recommend optimal dates based on crew availability and fairness
 */
export async function recommendDates(
  pilotId: string,
  desiredStartDate: Date,
  desiredEndDate: Date,
  flexibilityDays: number = 7
): Promise<DateRecommendation[]> {
  const pilot = await getPilot(pilotId)
  const duration = differenceInDays(desiredEndDate, desiredStartDate) + 1

  // Step 1: Calculate search window
  const searchStart = subDays(desiredStartDate, flexibilityDays)
  const searchEnd = addDays(desiredStartDate, flexibilityDays)

  // Step 2: Generate candidate date ranges
  const candidates: Array<{start: Date, end: Date}> = []
  for (let start = searchStart; start <= searchEnd; start = addDays(start, 1)) {
    const end = addDays(start, duration - 1)
    candidates.push({ start, end })
  }

  // Step 3: Score each candidate
  const scoredCandidates = await Promise.all(
    candidates.map(async (range) => {
      // Check crew availability
      const availability = await getCrewAvailabilityForRange(
        range.start,
        range.end,
        pilot.role
      )

      const violatesCrewMinimum = availability.some(day => day.available < 10)
      if (violatesCrewMinimum) {
        return null // Filter out violating dates
      }

      // Calculate scores
      const approvedDays = await getApprovedDaysForYear(pilotId)
      const fairnessScore = (365 - approvedDays) * 10
      const seniorityScore = (100 - pilot.seniority_number) * 50

      // Crew availability score (higher = better)
      const avgAvailable = availability.reduce((sum, day) => sum + day.available, 0) / availability.length
      const crewScore = ((avgAvailable - 10) / 5) * 100 // 0-100 scale

      // Combined score
      const overallScore = (seniorityScore * 0.4) + (fairnessScore * 0.3) + (crewScore * 0.3)

      return {
        recommendedStartDate: range.start,
        recommendedEndDate: range.end,
        durationDays: duration,
        confidence: Math.min(100, overallScore / 80), // Normalize to 0-100
        crewAvailabilityScore: crewScore,
        fairnessScore,
        seniorityScore,
        overallScore,
        reasoning: generateReasoning(approvedDays, avgAvailable, pilot.seniority_number),
        violations: []
      }
    })
  )

  // Step 4: Filter out null (violating) candidates
  const validCandidates = scoredCandidates.filter(c => c !== null) as DateRecommendation[]

  // Step 5: Sort by overall score
  const sorted = validCandidates.sort((a, b) => b.overallScore - a.overallScore)

  // Step 6: Return top 5 recommendations
  return sorted.slice(0, 5).map((rec, index) => ({
    ...rec,
    alternativeRank: index + 1
  }))
}

function generateReasoning(
  approvedDays: number,
  avgCrewAvailable: number,
  seniorityNumber: number
): string {
  const reasons: string[] = []

  if (approvedDays < 10) {
    reasons.push(`You have only taken ${approvedDays} days this year - high priority`)
  } else if (approvedDays > 20) {
    reasons.push(`You have taken ${approvedDays} days this year - consider spreading leave`)
  }

  if (avgCrewAvailable >= 15) {
    reasons.push(`Excellent crew availability (avg ${Math.round(avgCrewAvailable)} available)`)
  } else if (avgCrewAvailable >= 12) {
    reasons.push(`Good crew availability (avg ${Math.round(avgCrewAvailable)} available)`)
  } else {
    reasons.push(`Adequate crew availability (avg ${Math.round(avgCrewAvailable)} available)`)
  }

  if (seniorityNumber <= 5) {
    reasons.push(`High seniority (#${seniorityNumber}) provides strong priority`)
  }

  return reasons.join('. ')
}
```

---

## 🎨 UI Components (Calendar & Final Review)

### 1. Leave Summary Widget

**File**: `components/leave/leave-summary-widget.tsx`

```typescript
/**
 * Shows pilot's approved days for the year
 * Replaces complex "leave balance" with simple approved days count
 */

interface LeaveSummaryWidgetProps {
  pilotId: string
  year?: number
}

export function LeaveSummaryWidget({ pilotId, year = new Date().getFullYear() }: LeaveSummaryWidgetProps) {
  const [approvedDays, setApprovedDays] = useState(0)
  const [ranking, setRanking] = useState<number | null>(null)

  // Features:
  - Total approved days this year
  - Visual progress bar (0-365 days scale)
  - Fairness ranking among same rank
  - "You've taken X% of the year"
  - Comparison to fleet average
  - Year selector dropdown
}
```

### 2. Calendar View (using FullCalendar)

**File**: `components/leave/leave-calendar-view.tsx`

```typescript
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'

/**
 * Interactive calendar showing all leave and recommended dates
 */
export function LeaveCalendarView() {
  // Features:
  - Color-coded leave events:
    - Green: Approved leave
    - Blue: Pending leave
    - Red: Denied leave
    - Gold: Recommended dates
  - Crew availability background colors:
    - Light green: > 15 available
    - Yellow: 10-14 available
    - Red: < 10 available (violation)
  - Click date to request leave
  - Hover to see details
  - Filter by pilot
  - Export to PDF
}
```

### 3. Final Review Dashboard

**File**: `app/dashboard/leave/final-review/page.tsx`

```typescript
/**
 * 21-day deadline tracking and PDF generation
 */
export default async function FinalReviewPage() {
  // Calculate next roster period
  const nextPeriod = getNextRosterPeriod()
  const deadline = subDays(nextPeriod.startDate, 21)
  const daysUntilDeadline = differenceInDays(deadline, new Date())

  return (
    <div>
      <h1>Final Leave Review - {nextPeriod.name}</h1>

      {/* Countdown Timer */}
      <DeadlineCountdown
        deadline={deadline}
        daysRemaining={daysUntilDeadline}
      />

      {/* Progress Overview */}
      <ReviewProgress
        totalRequests={stats.total}
        reviewed={stats.reviewed}
        pending={stats.pending}
      />

      {/* Pending Requests List */}
      <PendingRequestsList
        requests={pendingRequests}
        onApprove={handleApprove}
        onDeny={handleDeny}
      />

      {/* Generate Report Button */}
      <Button onClick={generatePDF}>
        Generate PDF Report for Rostering Team
      </Button>
    </div>
  )
}
```

---

## 📄 PDF Report Generation

### Rostering Team Report Structure

```typescript
interface RosteringTeamReport {
  // Header
  rosterPeriod: string // "RP01/2026"
  rosterStartDate: Date
  reportGeneratedDate: Date
  generatedBy: string
  deadlineDate: Date

  // Executive Summary
  summary: {
    totalRequests: number
    approved: number
    denied: number
    pendingAtDeadline: number
    crewComplianceStatus: 'COMPLIANT' | 'AT_RISK' | 'VIOLATION'
  }

  // Approved Leave Schedule
  approvedLeave: Array<{
    pilotName: string
    rank: string
    seniorityNumber: number
    leaveType: string
    startDate: Date
    endDate: Date
    duration: number
    approvedDaysYTD: number
  }>

  // Crew Availability Forecast (per day of roster period)
  crewForecast: Array<{
    date: Date
    captainsAvailable: number
    firstOfficersAvailable: number
    status: 'safe' | 'warning' | 'critical'
  }>

  // Denied Requests
  deniedLeave: Array<{
    pilotName: string
    rank: string
    requestedDates: string
    denialReason: string
  }>

  // Pending (Unresolved) Requests
  pendingLeave: Array<{
    pilotName: string
    rank: string
    requestedDates: string
    daysOverdue: number
  }>

  // Recommendations
  recommendations: string[]
}
```

### PDF Generation Code

```typescript
import PDFDocument from 'pdfkit'

export async function generateRosteringTeamPDF(rosterPeriod: string): Promise<Buffer> {
  const report = await buildFinalReviewReport(rosterPeriod)

  const doc = new PDFDocument({ size: 'A4', margin: 50 })
  const chunks: Buffer[] = []

  doc.on('data', chunk => chunks.push(chunk))

  // Header
  doc.fontSize(20).text('Leave Approval Final Review', { align: 'center' })
  doc.fontSize(12).text(`Roster Period: ${report.rosterPeriod}`, { align: 'center' })
  doc.fontSize(10).text(`Generated: ${format(report.reportGeneratedDate, 'PPP')}`, { align: 'center' })
  doc.moveDown(2)

  // Executive Summary
  doc.fontSize(14).text('Executive Summary')
  doc.fontSize(10)
  doc.text(`Total Requests: ${report.summary.totalRequests}`)
  doc.text(`Approved: ${report.summary.approved}`)
  doc.text(`Denied: ${report.summary.denied}`)
  doc.text(`Pending: ${report.summary.pendingAtDeadline}`)
  doc.text(`Crew Compliance: ${report.summary.crewComplianceStatus}`)
  doc.moveDown()

  // Approved Leave Table
  doc.addPage()
  doc.fontSize(14).text('Approved Leave Schedule')
  doc.moveDown()

  // Table headers
  doc.fontSize(8)
  doc.text('Pilot', 50, doc.y, { continued: true, width: 120 })
  doc.text('Rank', 170, doc.y, { continued: true, width: 60 })
  doc.text('Leave Type', 230, doc.y, { continued: true, width: 80 })
  doc.text('Dates', 310, doc.y, { continued: true, width: 150 })
  doc.text('Days YTD', 460, doc.y, { width: 50 })
  doc.moveDown()

  // Table rows
  report.approvedLeave.forEach(leave => {
    doc.text(leave.pilotName, 50, doc.y, { continued: true, width: 120 })
    doc.text(leave.rank, 170, doc.y, { continued: true, width: 60 })
    doc.text(leave.leaveType, 230, doc.y, { continued: true, width: 80 })
    doc.text(`${format(leave.startDate, 'dd/MM')} - ${format(leave.endDate, 'dd/MM')}`, 310, doc.y, { continued: true, width: 150 })
    doc.text(leave.approvedDaysYTD.toString(), 460, doc.y, { width: 50 })
    doc.moveDown(0.5)
  })

  // Crew Availability Chart (simplified table)
  doc.addPage()
  doc.fontSize(14).text('Crew Availability Forecast')
  doc.moveDown()

  // ... continue building PDF ...

  doc.end()

  return new Promise((resolve) => {
    doc.on('end', () => {
      resolve(Buffer.concat(chunks))
    })
  })
}
```

---

## 📅 Simplified Implementation Timeline

### Week 1: Foundation & Calculations
- [ ] Add `getApprovedDaysForYear()` function
- [ ] Add `calculateEnhancedPriorityScore()` function
- [ ] Add `getFairnessRanking()` function
- [ ] Create Leave Summary Widget
- [ ] Update existing priority logic to use new calculation
- [ ] Test fairness calculations

### Week 2: Recommendation Engine
- [ ] Build `recommendDates()` function
- [ ] Create recommendation API endpoint
- [ ] Build Date Recommendation Panel UI
- [ ] Add "Get Recommendations" button to leave request form
- [ ] Test recommendation accuracy

### Week 3: Calendar View
- [ ] Install and configure FullCalendar
- [ ] Build Leave Calendar View component
- [ ] Add color coding for leave types
- [ ] Add crew availability background colors
- [ ] Add recommended dates overlay
- [ ] Test calendar interactions

### Week 4: Final Review & PDF
- [ ] Build deadline calculation logic
- [ ] Create Final Review Dashboard
- [ ] Implement countdown timer and alerts
- [ ] Build PDF report generator
- [ ] Add email distribution
- [ ] Test end-to-end workflow

---

## ✅ Simplified Benefits

1. **No New Database Tables** - Uses existing `leave_requests` data
2. **Real-Time Calculations** - Always accurate, no sync issues
3. **Simple Logic** - Easy to understand and maintain
4. **Performance** - Optional materialized view if needed
5. **Transparent** - Pilots can see exact calculation
6. **Flexible** - Easy to adjust scoring weights

---

**Next Step**: Begin Week 1 implementation?

