# Unified Pilot Request Management System - Implementation Plan

**Author**: Maurice Rondeau
**Date**: November 11, 2025
**Status**: APPROVED - Ready for Implementation

---

## 🎯 Project Overview

Transform the current fragmented pilot request system into a **unified management hub** that consolidates:
- **Leave Requests** (RDO, SDO, ANNUAL, SICK, LSL, LWOP, MATERNITY, COMPASSIONATE)
- **Flight Requests** (additional flights, schedule changes)
- **Leave Bids** (annual preference submissions)

**From multiple submission channels**:
- Pilot Portal (primary)
- Email (admin manual entry)
- Phone (admin manual entry)
- Oracle System (admin manual entry)

**Into a centralized admin portal with**:
- Roster period management
- 21-day deadline tracking
- Automated alerts
- Conflict detection
- Comprehensive reporting
- PDF export + email delivery

---

## 👥 Primary Users

1. **Pilots** (27 pilots): Submit requests via pilot portal
2. **Fleet Manager**: Review, approve/deny requests, manage deadlines, generate reports

---

## 📐 Critical Business Rules

### Roster Period Timeline
```
Example: RP01/2026 (Jan 8 - Feb 4, 2026)

Day -31: Request deadline (21 days before roster publishes)
Day -10: Roster publishes
Day 0:   Roster period starts
```

**Calculation**:
- Roster Period Start Date: Known (uses RP12/2025 = Oct 11, 2025 as anchor)
- Roster Publish Date: Start Date - 10 days
- Request Deadline Date: Publish Date - 21 days (= Start Date - 31 days)

### Crew Availability Rules
- **Minimum Captains**: 10 available at all times
- **Minimum First Officers**: 10 available at all times
- Rank-separated calculations (Captains and First Officers evaluated independently)

### Approval Priority
1. Seniority number (lower = higher priority)
2. Submission date (earlier = higher priority)

### Submission Timing
- **On-time**: Submitted ≥ 21 days before roster period starts
- **Late**: Submitted < 21 days before roster period starts
- **Past Deadline**: Submitted after roster deadline date

---

## 🏗️ Implementation Phases

### **PHASE 1: Unified Data Model (Week 1-2)**

#### 1.1 New Database Tables

**Table: `pilot_requests`** (replaces `leave_requests` + `flight_requests`)
```sql
CREATE TABLE pilot_requests (
  -- Identity
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pilot_id uuid REFERENCES pilots(id) ON DELETE CASCADE,
  pilot_user_id uuid REFERENCES pilot_users(id),
  employee_number text NOT NULL,
  rank text NOT NULL,
  name text NOT NULL,

  -- Request Classification
  request_category text NOT NULL, -- LEAVE | FLIGHT | LEAVE_BID
  request_type text NOT NULL, -- RDO | SDO | ANNUAL | SICK | LSL | LWOP | MATERNITY | COMPASSIONATE | FLIGHT_REQUEST | SCHEDULE_CHANGE

  -- Submission Tracking
  submission_channel text NOT NULL, -- PILOT_PORTAL | EMAIL | PHONE | ORACLE | ADMIN_PORTAL
  submission_date timestamptz NOT NULL DEFAULT NOW(),
  submitted_by_admin_id uuid REFERENCES users(id),
  source_reference text, -- Email ID, phone log ref, Oracle ticket #
  source_attachment_url text, -- S3 URL for email screenshot, etc.

  -- Date/Time Details
  start_date date NOT NULL,
  end_date date,
  days_count integer,
  flight_date date, -- For single-day flight requests
  roster_period text NOT NULL, -- e.g., "RP01/2026"
  roster_period_start_date date NOT NULL,
  roster_publish_date date NOT NULL,
  roster_deadline_date date NOT NULL,

  -- Workflow Status
  workflow_status text NOT NULL DEFAULT 'SUBMITTED', -- DRAFT | SUBMITTED | IN_REVIEW | APPROVED | DENIED | WITHDRAWN
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz,
  review_comments text,

  -- Conflict Detection
  conflict_flags jsonb DEFAULT '[]'::jsonb,
  availability_impact jsonb, -- { captains_before: 15, captains_after: 14, fos_before: 12, fos_after: 11 }

  -- Metadata
  is_late_request boolean DEFAULT false,
  is_past_deadline boolean DEFAULT false,
  priority_score integer DEFAULT 0,
  reason text,
  notes text,

  -- Audit
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),

  -- Constraints
  CHECK (request_category IN ('LEAVE', 'FLIGHT', 'LEAVE_BID')),
  CHECK (workflow_status IN ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'DENIED', 'WITHDRAWN')),
  CHECK (submission_channel IN ('PILOT_PORTAL', 'EMAIL', 'PHONE', 'ORACLE', 'ADMIN_PORTAL'))
);

-- Indexes
CREATE INDEX idx_pilot_requests_roster_period ON pilot_requests(roster_period);
CREATE INDEX idx_pilot_requests_status ON pilot_requests(workflow_status);
CREATE INDEX idx_pilot_requests_pilot_id ON pilot_requests(pilot_id);
CREATE INDEX idx_pilot_requests_deadline ON pilot_requests(roster_deadline_date);
CREATE INDEX idx_pilot_requests_dates ON pilot_requests(start_date, end_date);

-- Prevent overlapping requests for same pilot
CREATE UNIQUE INDEX idx_pilot_requests_no_overlap
ON pilot_requests(pilot_id, daterange(start_date, COALESCE(end_date, start_date), '[]'))
WHERE workflow_status IN ('SUBMITTED', 'IN_REVIEW', 'APPROVED');
```

**Table: `roster_periods`**
```sql
CREATE TABLE roster_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL, -- "RP01/2026"
  period_number integer NOT NULL, -- 1-13
  year integer NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  publish_date date NOT NULL, -- start_date - 10 days
  request_deadline_date date NOT NULL, -- publish_date - 21 days
  status text DEFAULT 'OPEN', -- OPEN | LOCKED | PUBLISHED | ARCHIVED
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),

  CHECK (status IN ('OPEN', 'LOCKED', 'PUBLISHED', 'ARCHIVED')),
  UNIQUE(period_number, year)
);

CREATE INDEX idx_roster_periods_deadline ON roster_periods(request_deadline_date);
CREATE INDEX idx_roster_periods_year ON roster_periods(year);
```

**Table: `roster_reports`** (audit trail)
```sql
CREATE TABLE roster_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roster_period_code text NOT NULL REFERENCES roster_periods(code),
  generated_at timestamptz DEFAULT NOW(),
  generated_by uuid REFERENCES users(id),
  report_type text NOT NULL, -- PREVIEW | FINAL
  approved_count integer DEFAULT 0,
  pending_count integer DEFAULT 0,
  denied_count integer DEFAULT 0,
  withdrawn_count integer DEFAULT 0,
  min_crew_captains integer,
  min_crew_fos integer,
  min_crew_date date,
  pdf_url text,
  email_recipients text[],
  sent_at timestamptz,

  CHECK (report_type IN ('PREVIEW', 'FINAL'))
);

CREATE INDEX idx_roster_reports_period ON roster_reports(roster_period_code);
CREATE INDEX idx_roster_reports_sent ON roster_reports(sent_at);
```

#### 1.2 Migration Strategy

**Step 1**: Create new tables alongside existing ones
**Step 2**: Create database views for backward compatibility:
```sql
CREATE VIEW leave_requests AS
SELECT
  id,
  pilot_id,
  request_type AS leave_type,
  start_date,
  end_date,
  days_count,
  roster_period,
  workflow_status AS status,
  submission_channel AS request_method,
  reviewed_by,
  reviewed_at,
  review_comments,
  created_at,
  updated_at
FROM pilot_requests
WHERE request_category = 'LEAVE';

CREATE VIEW flight_requests AS
SELECT
  id,
  pilot_id,
  request_type,
  flight_date,
  workflow_status AS status,
  reason,
  reviewed_by,
  reviewed_at,
  review_comments AS reviewer_comments,
  created_at,
  updated_at
FROM pilot_requests
WHERE request_category = 'FLIGHT';
```

**Step 3**: Migrate existing data (if any)
**Step 4**: Update services to use `pilot_requests` table
**Step 5**: Deprecate old tables after 3 months

---

### **PHASE 2: Roster Period Service (Week 2)**

#### 2.1 Roster Period Calculation Service

**New file: `lib/services/roster-period-service.ts`**

```typescript
/**
 * Roster Period Service
 * Author: Maurice Rondeau
 * Date: November 11, 2025
 *
 * Handles all roster period date calculations based on 28-day cycles.
 * Known anchor: RP12/2025 starts on October 11, 2025
 */

import { createClient } from '@/lib/supabase/server'

// Known anchor point for roster period calculation
const ANCHOR_ROSTER_PERIOD = 12
const ANCHOR_YEAR = 2025
const ANCHOR_START_DATE = new Date('2025-10-11')
const ROSTER_PERIOD_DAYS = 28
const ROSTER_PUBLISH_DAYS_BEFORE = 10
const REQUEST_DEADLINE_DAYS_BEFORE_PUBLISH = 21

export interface RosterPeriodDates {
  code: string // "RP01/2026"
  periodNumber: number // 1-13
  year: number
  startDate: Date
  endDate: Date
  publishDate: Date
  deadlineDate: Date
  daysUntilDeadline: number
  daysUntilPublish: number
  daysUntilStart: number
  isOpen: boolean
  isPastDeadline: boolean
  status: 'OPEN' | 'LOCKED' | 'PUBLISHED' | 'ARCHIVED'
}

/**
 * Calculate start date for any roster period
 */
export function calculateRosterStartDate(periodNumber: number, year: number): Date {
  // Calculate difference from anchor
  const periodDiff = (year - ANCHOR_YEAR) * 13 + (periodNumber - ANCHOR_ROSTER_PERIOD)
  const daysDiff = periodDiff * ROSTER_PERIOD_DAYS

  const startDate = new Date(ANCHOR_START_DATE)
  startDate.setDate(startDate.getDate() + daysDiff)

  return startDate
}

/**
 * Calculate all dates for a roster period
 */
export function calculateRosterPeriodDates(periodNumber: number, year: number): RosterPeriodDates {
  const startDate = calculateRosterStartDate(periodNumber, year)

  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + ROSTER_PERIOD_DAYS - 1)

  const publishDate = new Date(startDate)
  publishDate.setDate(publishDate.getDate() - ROSTER_PUBLISH_DAYS_BEFORE)

  const deadlineDate = new Date(publishDate)
  deadlineDate.setDate(deadlineDate.getDate() - REQUEST_DEADLINE_DAYS_BEFORE_PUBLISH)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const daysUntilPublish = Math.ceil((publishDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const daysUntilStart = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  const isPastDeadline = today > deadlineDate
  const isOpen = !isPastDeadline

  let status: 'OPEN' | 'LOCKED' | 'PUBLISHED' | 'ARCHIVED' = 'OPEN'
  if (today > startDate) {
    status = 'ARCHIVED'
  } else if (today > publishDate) {
    status = 'PUBLISHED'
  } else if (isPastDeadline) {
    status = 'LOCKED'
  }

  const code = `RP${String(periodNumber).padStart(2, '0')}/${year}`

  return {
    code,
    periodNumber,
    year,
    startDate,
    endDate,
    publishDate,
    deadlineDate,
    daysUntilDeadline,
    daysUntilPublish,
    daysUntilStart,
    isOpen,
    isPastDeadline,
    status
  }
}

/**
 * Get roster period code from a date
 */
export function getRosterPeriodCodeFromDate(date: Date): string {
  // Find which roster period contains this date
  let year = date.getFullYear()
  let periodNumber = 1

  // Start searching from current year RP1
  for (let testYear = year - 1; testYear <= year + 1; testYear++) {
    for (let testPeriod = 1; testPeriod <= 13; testPeriod++) {
      const periodDates = calculateRosterPeriodDates(testPeriod, testYear)
      if (date >= periodDates.startDate && date <= periodDates.endDate) {
        return periodDates.code
      }
    }
  }

  // Fallback
  return `RP01/${year}`
}

/**
 * Get upcoming roster periods (next N periods)
 */
export function getUpcomingRosterPeriods(count: number = 5): RosterPeriodDates[] {
  const periods: RosterPeriodDates[] = []
  const today = new Date()

  let year = today.getFullYear()
  let periodNumber = 1

  // Find current/next period
  for (let testPeriod = 1; testPeriod <= 13; testPeriod++) {
    const dates = calculateRosterPeriodDates(testPeriod, year)
    if (dates.endDate >= today) {
      periodNumber = testPeriod
      break
    }
  }

  // Get next N periods
  for (let i = 0; i < count; i++) {
    periods.push(calculateRosterPeriodDates(periodNumber, year))

    periodNumber++
    if (periodNumber > 13) {
      periodNumber = 1
      year++
    }
  }

  return periods
}

/**
 * Sync roster periods to database
 */
export async function syncRosterPeriodsToDatabase() {
  const supabase = await createClient()

  // Get current year and next 2 years
  const currentYear = new Date().getFullYear()
  const years = [currentYear, currentYear + 1, currentYear + 2]

  for (const year of years) {
    for (let periodNumber = 1; periodNumber <= 13; periodNumber++) {
      const dates = calculateRosterPeriodDates(periodNumber, year)

      // Upsert roster period
      const { error } = await supabase
        .from('roster_periods')
        .upsert({
          code: dates.code,
          period_number: dates.periodNumber,
          year: dates.year,
          start_date: dates.startDate.toISOString().split('T')[0],
          end_date: dates.endDate.toISOString().split('T')[0],
          publish_date: dates.publishDate.toISOString().split('T')[0],
          request_deadline_date: dates.deadlineDate.toISOString().split('T')[0],
          status: dates.status,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'code'
        })

      if (error) {
        console.error(`Failed to sync roster period ${dates.code}:`, error)
      }
    }
  }

  console.log('✅ Roster periods synced to database')
}
```

---

### **PHASE 3: Deadline Alert System (Week 3)**

#### 3.1 Deadline Alert Service

**New file: `lib/services/roster-deadline-alert-service.ts`**

```typescript
/**
 * Roster Deadline Alert Service
 * Author: Maurice Rondeau
 * Date: November 11, 2025
 *
 * Sends automated alerts for approaching roster deadlines
 */

import { createClient } from '@/lib/supabase/server'
import { getUpcomingRosterPeriods } from './roster-period-service'
import { sendEmail } from './email-service'

export interface DeadlineAlert {
  rosterPeriodCode: string
  deadlineDate: Date
  daysRemaining: number
  urgency: 'INFO' | 'WARNING' | 'CRITICAL' | 'URGENT'
  approvedCount: number
  pendingCount: number
  deniedCount: number
}

/**
 * Get deadline alerts for upcoming roster periods
 */
export async function getDeadlineAlerts(): Promise<DeadlineAlert[]> {
  const supabase = await createClient()
  const upcomingPeriods = getUpcomingRosterPeriods(5)
  const alerts: DeadlineAlert[] = []

  for (const period of upcomingPeriods) {
    // Only alert for periods approaching deadline
    if (period.daysUntilDeadline > 21) continue

    // Get request counts
    const { data: requests } = await supabase
      .from('pilot_requests')
      .select('workflow_status')
      .eq('roster_period', period.code)

    const approvedCount = requests?.filter(r => r.workflow_status === 'APPROVED').length || 0
    const pendingCount = requests?.filter(r => r.workflow_status === 'SUBMITTED' || r.workflow_status === 'IN_REVIEW').length || 0
    const deniedCount = requests?.filter(r => r.workflow_status === 'DENIED').length || 0

    let urgency: 'INFO' | 'WARNING' | 'CRITICAL' | 'URGENT' = 'INFO'
    if (period.daysUntilDeadline === 0) urgency = 'URGENT'
    else if (period.daysUntilDeadline <= 1) urgency = 'CRITICAL'
    else if (period.daysUntilDeadline <= 3) urgency = 'WARNING'

    alerts.push({
      rosterPeriodCode: period.code,
      deadlineDate: period.deadlineDate,
      daysRemaining: period.daysUntilDeadline,
      urgency,
      approvedCount,
      pendingCount,
      deniedCount
    })
  }

  return alerts
}

/**
 * Send deadline notification email to fleet manager
 */
export async function sendDeadlineNotificationEmail(alert: DeadlineAlert) {
  const subject = alert.daysRemaining === 0
    ? `🚨 ROSTER DEADLINE TODAY: ${alert.rosterPeriodCode}`
    : `⏰ Roster Deadline Alert: ${alert.rosterPeriodCode} (${alert.daysRemaining} days)`

  const body = `
    <h2>Roster Period Deadline Alert</h2>
    <p><strong>Roster Period:</strong> ${alert.rosterPeriodCode}</p>
    <p><strong>Deadline:</strong> ${alert.deadlineDate.toLocaleDateString()}</p>
    <p><strong>Days Remaining:</strong> ${alert.daysRemaining}</p>

    <h3>Request Summary</h3>
    <ul>
      <li>✅ Approved: ${alert.approvedCount}</li>
      <li>⏳ Pending Review: ${alert.pendingCount}</li>
      <li>❌ Denied: ${alert.deniedCount}</li>
    </ul>

    ${alert.pendingCount > 0 ? `
      <p style="color: orange;"><strong>⚠️  You have ${alert.pendingCount} pending requests that need review!</strong></p>
    ` : ''}

    ${alert.daysRemaining === 0 ? `
      <p style="color: red;"><strong>🚨 TODAY is the deadline. Please generate and send the report to the rostering team.</strong></p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/reports/roster-period/${alert.rosterPeriodCode}">Generate Report Now →</a></p>
    ` : `
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/requests?roster_period=${alert.rosterPeriodCode}">View Requests →</a></p>
    `}

    <p>Best regards,<br>Fleet Management System</p>
  `

  await sendEmail({
    to: process.env.FLEET_MANAGER_EMAIL || 'admin@fleet.com',
    subject,
    html: body
  })
}

/**
 * Run daily deadline check (cron job)
 */
export async function runDailyDeadlineCheck() {
  console.log('🔍 Running daily roster deadline check...')

  const alerts = await getDeadlineAlerts()

  for (const alert of alerts) {
    // Only send email for specific milestones
    if ([0, 1, 3, 7, 14, 21].includes(alert.daysRemaining)) {
      console.log(`📧 Sending deadline alert for ${alert.rosterPeriodCode} (${alert.daysRemaining} days)`)
      await sendDeadlineNotificationEmail(alert)
    }
  }

  console.log(`✅ Deadline check complete. Sent ${alerts.length} alerts.`)
}
```

---

### **PHASE 4: Unified Reporting System (Week 4-5)**

[Report builder and PDF generation implementation details...]

---

### **PHASE 5: Conflict Detection (Week 6)**

[Conflict detection service implementation details...]

---

## 📊 Progress Tracking

- [x] Phase 0: Planning and approval
- [ ] Phase 1: Database schema (Week 1-2)
- [ ] Phase 2: Roster period service (Week 2)
- [ ] Phase 3: Deadline alerts (Week 3)
- [ ] Phase 4: Reporting system (Week 4-5)
- [ ] Phase 5: Conflict detection (Week 6)
- [ ] Phase 6: Admin dashboard (Week 7-8)
- [ ] Phase 7: Testing (Week 9)
- [ ] Phase 8: Production rollout (Week 10)

---

## 🎯 Success Metrics

1. **Deadline Compliance**: 100% of roster reports sent on time
2. **Channel Migration**: 80%+ requests via pilot portal
3. **Approval Speed**: < 48 hours average time-to-approval
4. **Conflict Detection**: 95%+ conflicts detected before approval
5. **Admin Time Savings**: 60% reduction in manual entry time

---

**Implementation Started**: November 11, 2025
**Target Completion**: January 20, 2026 (10 weeks)
