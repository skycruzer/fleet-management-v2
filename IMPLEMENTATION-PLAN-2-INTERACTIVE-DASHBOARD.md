# Implementation Plan #2: Interactive Retirement Forecast Dashboard

**Priority**: Medium (Export features)
**Estimated Timeline**: 2-3 weeks
**Dependencies**: None (standalone enhancement)
**Status**: Planning Phase

---

## Overview

Transform the existing retirement forecast card into a comprehensive interactive dashboard with timeline visualization, drill-down capabilities, PDF/CSV export, and crew impact analysis.

### Current State

**Existing Implementation** (✅ Already Built):
- `retirement-forecast-card.tsx` - Displays 2-year and 5-year forecasts
- `retirement-forecast-service.ts` - Calculates forecasts by rank with pilot lists
- Shows pilot names in "Initial. Surname - Time" format
- Displays counts by rank (Captains/First Officers)
- Filters 5-year section to exclude 2-year pilots

**What's Missing** (🔴 Needs Implementation):
- Interactive timeline visualization
- Drill-down to individual pilot details
- PDF/CSV export functionality
- Crew impact analysis (requirements vs available)
- Month-by-month timeline view
- Historical trend comparison

---

## Objectives

### Primary Goals
1. ✅ Add interactive timeline visualization (month-by-month retirements)
2. ✅ Implement click-to-view pilot retirement details
3. ✅ Add PDF export (formatted retirement schedule report)
4. ✅ Add CSV export (data for external analysis)
5. ✅ Display crew impact analysis (shortages/warnings)
6. ✅ Add filtering by rank and date range

### Success Metrics
- Users can visualize retirement distribution over time
- Export to PDF completes in < 5 seconds
- CSV export is instant (<1 second)
- Dashboard loads in < 800ms
- All features fully accessible (keyboard navigation, screen readers)

---

## Technical Design

### Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Dashboard Page (Server Component)                          │
│  ├── RetirementForecastCard (existing) → Enhanced          │
│  │   ├── Summary Cards (2yr/5yr counts)                    │
│  │   ├── TimelineVisualization (NEW - Client Component)   │
│  │   ├── CrewImpactAnalysis (NEW - Server Component)      │
│  │   └── ExportControls (NEW - Client Component)          │
│  │       ├── ExportPDFButton                              │
│  │       └── ExportCSVButton                              │
│  └── PilotRetirementDialog (NEW - Client Component)        │
└──────────────────────────────────────────────────────────────┘
         ↓
    retirement-forecast-service.ts (EXTENDED)
         ↓
    Supabase pilots table
```

### Technology Recommendations (from Research)

**Visualization Library**: **Tremor** (Recommended)
- ✅ Native Next.js 15 SSR support
- ✅ Built-in timeline charts
- ✅ TypeScript-first
- ✅ WCAG 2.1 AA accessible
- ✅ Lightweight (45 KB)
- ✅ Tailwind CSS integration

```bash
pnpm add @tremor/react
```

**Export Libraries**:
- **PDF**: Puppeteer (server-side, high-fidelity)
- **CSV**: PapaParse (client-side, instant)

```bash
pnpm add puppeteer papaparse
pnpm add -D @types/papaparse
```

---

## Service Layer Extensions

**File**: `/lib/services/retirement-forecast-service.ts`

### New Functions to Add

```typescript
/**
 * Get month-by-month retirement timeline for visualization
 * Returns retirements grouped by month for next 5 years
 */
export async function getMonthlyRetirementTimeline(
  retirementAge: number = 65
): Promise<{
  timeline: Array<{
    month: string        // "2025-11"
    captains: number
    firstOfficers: number
    total: number
    pilots: Array<{
      id: string
      name: string
      rank: string
      retirementDate: Date
    }>
  }>
  summary: {
    peakMonth: string    // Month with most retirements
    peakCount: number
    averagePerMonth: number
  }
}> {
  // Implementation:
  // 1. Get all pilots retiring in next 5 years
  // 2. Group by month (YYYY-MM format)
  // 3. Calculate summary statistics
}

/**
 * Get crew impact analysis comparing requirements vs available pilots
 * Shows projected shortages and warnings
 */
export async function getCrewImpactAnalysis(
  retirementAge: number = 65
): Promise<{
  monthly: Array<{
    month: string
    requiredCaptains: number
    availableCaptains: number
    captainShortage: number
    requiredFirstOfficers: number
    availableFirstOfficers: number
    firstOfficerShortage: number
    warningLevel: 'none' | 'low' | 'medium' | 'high' | 'critical'
  }>
  warnings: Array<{
    month: string
    rank: 'Captain' | 'First Officer'
    severity: 'warning' | 'critical'
    message: string
  }>
}> {
  // Implementation:
  // 1. Get monthly timeline
  // 2. Fetch pilot requirements from system settings
  // 3. Calculate available pilots per month (total - retired)
  // 4. Identify shortage periods
  // 5. Generate warning messages
}

/**
 * Generate retirement forecast PDF report
 * Server-side using Puppeteer for high-fidelity output
 */
export async function generateRetirementForecastPDF(
  retirementAge: number = 65
): Promise<Buffer> {
  // Implementation:
  // 1. Fetch all forecast data
  // 2. Render HTML template with data
  // 3. Use Puppeteer to generate PDF
  // 4. Return PDF buffer
}

/**
 * Generate retirement forecast CSV export
 * Lightweight data export for external analysis
 */
export async function generateRetirementForecastCSV(
  retirementAge: number = 65
): Promise<string> {
  // Implementation:
  // 1. Fetch forecast data
  // 2. Format as CSV with headers
  // 3. Return CSV string
}
```

---

## Component Design

### 1. TimelineVisualization Component

**File**: `/components/retirement/TimelineVisualization.tsx`

**Purpose**: Interactive month-by-month retirement timeline chart

```typescript
'use client'

import { AreaChart, Card } from '@tremor/react'

interface TimelineVisualizationProps {
  timeline: Array<{
    month: string
    captains: number
    firstOfficers: number
    total: number
  }>
  onMonthClick?: (month: string) => void
}

export function TimelineVisualization({
  timeline,
  onMonthClick
}: TimelineVisualizationProps) {
  return (
    <Card>
      <h3 className="text-tremor-title font-semibold">
        Monthly Retirement Timeline
      </h3>
      <AreaChart
        className="mt-4 h-80"
        data={timeline}
        index="month"
        categories={['captains', 'firstOfficers']}
        colors={['blue', 'emerald']}
        valueFormatter={(value) => `${value} pilots`}
        onValueChange={(v) => onMonthClick?.(v.month)}
        showLegend
        showGridLines
        showXAxis
        showYAxis
      />
    </Card>
  )
}
```

**UI Design**:
```
┌────────────────────────────────────────────────────────────┐
│ Monthly Retirement Timeline                                │
│                                                            │
│   10 ┤                                                     │
│      │                                            ▲        │
│    8 ┤                                  ▲        █        │
│      │                        ▲        █        ██        │
│    6 ┤              ▲        █        ██       ███        │
│      │    ▲        █        ██       ███      ████        │
│    4 ┤   █        ██       ███      ████     █████        │
│      │  ██       ███      ████     █████    ██████        │
│    2 ┤ ███      ████     █████    ██████   ███████        │
│      │████     █████    ██████   ███████  ████████        │
│    0 └┴─┴──────┴──┴────┴───┴────┴────┴───┴─────┴──────   │
│      2025-11 2026-03 2026-07 2026-11 2027-03 2027-07     │
│                                                            │
│   Legend: ■ Captains  ■ First Officers                    │
└────────────────────────────────────────────────────────────┘
```

### 2. CrewImpactAnalysis Component

**File**: `/components/retirement/CrewImpactAnalysis.tsx`

**Purpose**: Display crew requirements vs available pilots with shortage warnings

```typescript
interface CrewImpactAnalysisProps {
  impactData: {
    monthly: Array<{
      month: string
      requiredCaptains: number
      availableCaptains: number
      captainShortage: number
      warningLevel: 'none' | 'low' | 'medium' | 'high' | 'critical'
    }>
    warnings: Array<{
      month: string
      rank: string
      severity: 'warning' | 'critical'
      message: string
    }>
  }
}

export async function CrewImpactAnalysis({
  impactData
}: CrewImpactAnalysisProps) {
  // Server Component - fetches data
  // Displays warnings and capacity utilization chart
}
```

**UI Design**:
```
┌────────────────────────────────────────────────────────────┐
│ Crew Impact Analysis                                       │
├────────────────────────────────────────────────────────────┤
│ ⚠️  Warnings                                               │
│                                                            │
│ 🔴 CRITICAL: 2026-07                                      │
│     Only 8 Captains available (10 required)               │
│     Shortage: 2 Captains                                  │
│                                                            │
│ 🟡 WARNING: 2026-11                                       │
│     Only 9 First Officers available (10 required)         │
│     Shortage: 1 First Officer                             │
├────────────────────────────────────────────────────────────┤
│ Capacity Utilization                                       │
│                                                            │
│ Captains:      ████████████████░░░░ 85% (Critical)       │
│ First Officers: ██████████████░░░░░░ 75% (Warning)       │
│                                                            │
│ 🟢 Green: <75%   🟡 Yellow: 75-85%   🔴 Red: >85%        │
└────────────────────────────────────────────────────────────┘
```

### 3. ExportControls Component

**File**: `/components/retirement/ExportControls.tsx`

**Purpose**: PDF and CSV export buttons with loading states

```typescript
'use client'

import { Button } from '@/components/ui/button'
import { Download, FileText } from 'lucide-react'
import { useState } from 'react'

export function ExportControls() {
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const [isExportingCSV, setIsExportingCSV] = useState(false)

  const handlePDFExport = async () => {
    setIsExportingPDF(true)
    try {
      const response = await fetch('/api/retirement/export/pdf')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `retirement-forecast-${new Date().toISOString().split('T')[0]}.pdf`
      a.click()
    } finally {
      setIsExportingPDF(false)
    }
  }

  const handleCSVExport = async () => {
    setIsExportingCSV(true)
    try {
      const response = await fetch('/api/retirement/export/csv')
      const csvText = await response.text()
      const blob = new Blob([csvText], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `retirement-forecast-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
    } finally {
      setIsExportingCSV(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={handlePDFExport}
        disabled={isExportingPDF}
      >
        <FileText className="mr-2 h-4 w-4" />
        {isExportingPDF ? 'Generating PDF...' : 'Export PDF'}
      </Button>
      <Button
        variant="outline"
        onClick={handleCSVExport}
        disabled={isExportingCSV}
      >
        <Download className="mr-2 h-4 w-4" />
        {isExportingCSV ? 'Exporting...' : 'Export CSV'}
      </Button>
    </div>
  )
}
```

### 4. PilotRetirementDialog Component

**File**: `/components/retirement/PilotRetirementDialog.tsx`

**Purpose**: Modal showing detailed retirement information for a pilot

```typescript
'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface PilotRetirementDialogProps {
  pilotId: string | null
  open: boolean
  onClose: () => void
}

export function PilotRetirementDialog({
  pilotId,
  open,
  onClose
}: PilotRetirementDialogProps) {
  // Fetch pilot details when dialog opens
  // Display:
  // - Full name, rank, employee ID
  // - Date of birth
  // - Retirement date
  // - Time remaining (years, months, days)
  // - Years of service
  // - Seniority number
  // - Succession planning notes (if admin)
}
```

---

## API Routes

### POST /api/retirement/export/pdf

**Purpose**: Generate PDF retirement forecast report

**Implementation**: Server Action (Next.js 15)

```typescript
// app/api/retirement/export/pdf/route.ts

import { generateRetirementForecastPDF } from '@/lib/services/retirement-forecast-service'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const retirementAge = 65 // Fetch from system settings
    const pdfBuffer = await generateRetirementForecastPDF(retirementAge)

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="retirement-forecast-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF export error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
```

**PDF Template Structure**:
```
┌─────────────────────────────────────────────────┐
│ FLEET MANAGEMENT V2                             │
│ Retirement Forecast Report                      │
│ Generated: October 25, 2025                     │
├─────────────────────────────────────────────────┤
│                                                 │
│ EXECUTIVE SUMMARY                               │
│ • Total Retirements (2 years): 12 pilots       │
│ • Total Retirements (5 years): 23 pilots       │
│ • Peak Retirement Month: July 2026 (5 pilots)  │
│                                                 │
│ RETIREMENT SCHEDULE                             │
│                                                 │
│ 2025                                            │
│ ├─ November: 2 pilots                          │
│ │   • Capt. J. Smith (Nov 15, 2025)           │
│ │   • FO M. Johnson (Nov 28, 2025)            │
│ └─ December: 1 pilot                           │
│     • Capt. R. Williams (Dec 10, 2025)        │
│                                                 │
│ 2026                                            │
│ ...                                             │
│                                                 │
│ CREW IMPACT ANALYSIS                            │
│ • Critical Shortage Periods: 2 months          │
│   - July 2026: 2 Captain shortage              │
│   - November 2026: 1 FO shortage               │
│                                                 │
│ RECOMMENDATIONS                                 │
│ • Begin recruitment for 2 Captains by Q1 2026  │
│ • Promote 3 qualified FOs to Captain by Q2     │
│                                                 │
└─────────────────────────────────────────────────┘
```

### GET /api/retirement/export/csv

**Purpose**: Generate CSV retirement forecast data

```typescript
// app/api/retirement/export/csv/route.ts

import { generateRetirementForecastCSV } from '@/lib/services/retirement-forecast-service'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const retirementAge = 65
    const csvContent = await generateRetirementForecastCSV(retirementAge)

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="retirement-forecast-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to generate CSV' },
      { status: 500 }
    )
  }
}
```

**CSV Format**:
```csv
Pilot ID,Employee ID,Name,Rank,Date of Birth,Retirement Date,Years Until Retirement,Months Until Retirement,Seniority Number
abc-123,EMP001,John Smith,Captain,1960-11-15,2025-11-15,0,1,5
def-456,EMP002,Mary Johnson,First Officer,1960-11-28,2025-11-28,0,1,12
ghi-789,EMP003,Robert Williams,Captain,1960-12-10,2025-12-10,0,2,3
```

---

## Implementation Steps

### Phase 1: Service Layer Extensions (Days 1-3)

1. **Add `getMonthlyRetirementTimeline()`**
   - Query pilots table with retirement age calculation
   - Group retirements by month
   - Calculate summary statistics
   - Add unit tests

2. **Add `getCrewImpactAnalysis()`**
   - Fetch pilot requirements from system settings
   - Calculate available pilots per month
   - Identify shortage periods
   - Generate warning messages
   - Add unit tests

3. **Add `generateRetirementForecastPDF()`**
   - Create HTML template for PDF
   - Integrate Puppeteer for rendering
   - Format data for print
   - Optimize file size
   - Add unit tests

4. **Add `generateRetirementForecastCSV()`**
   - Format data as CSV with proper escaping
   - Include all relevant fields
   - Add unit tests

### Phase 2: UI Components (Days 4-8)

1. **Build TimelineVisualization component**
   - Install @tremor/react
   - Configure area chart
   - Add month click handling
   - Make responsive
   - Test accessibility
   - Create Storybook story

2. **Build CrewImpactAnalysis component**
   - Server Component for data fetching
   - Display warnings prominently
   - Show capacity utilization bars
   - Color-code warning levels
   - Test accessibility
   - Create Storybook story

3. **Build ExportControls component**
   - PDF export button with loading state
   - CSV export button with loading state
   - Error handling
   - Download progress feedback
   - Test accessibility
   - Create Storybook story

4. **Build PilotRetirementDialog component**
   - Modal with pilot details
   - Retirement countdown display
   - Years of service calculation
   - Responsive design
   - Test accessibility
   - Create Storybook story

### Phase 3: Integration (Days 9-12)

1. **Enhance RetirementForecastCard**
   - Add timeline visualization
   - Add crew impact analysis
   - Add export controls
   - Maintain existing summary cards
   - Add loading skeletons

2. **Create export API routes**
   - `/api/retirement/export/pdf`
   - `/api/retirement/export/csv`
   - Rate limiting (5 requests/minute)
   - Authentication checks
   - Error handling

3. **Add interactive features**
   - Month click to show detailed view
   - Pilot name click to open dialog
   - Filtering controls
   - Date range selection

### Phase 4: Testing & Polish (Days 13-15)

1. **E2E Testing with Playwright**
   - Test timeline visualization rendering
   - Test PDF export download
   - Test CSV export download
   - Test dialog interactions
   - Test accessibility (keyboard, screen readers)

2. **Performance Testing**
   - Measure chart rendering performance
   - Test PDF generation time (target < 5s)
   - Test CSV export (target < 1s)
   - Optimize if needed

3. **Documentation**
   - Update README with new features
   - Document export formats
   - Create user guide for dashboard

---

## Performance Considerations

### Database Optimization

**Add Index for Retirement Calculations**:
```sql
CREATE INDEX idx_pilots_dob_active
ON pilots(date_of_birth, is_active)
WHERE is_active = true;
```

### Caching Strategy

```typescript
// Cache timeline data (1 hour TTL)
const cacheKey = 'retirement:timeline'
const cached = await getCachedData(cacheKey)
if (cached) return cached

const data = await getMonthlyRetirementTimeline()
await setCachedData(cacheKey, data, 3600) // 1 hour
```

### PDF Generation Performance

- **Target**: < 5 seconds for PDF generation
- **Strategy**: Server-side async generation
- **Optimization**: Pre-render HTML, minimize styles, compress images

### Chart Performance

- **Target**: 60 FPS rendering
- **Strategy**: Use Tremor's optimized AreaChart
- **Fallback**: Virtualization if >100 data points

---

## Security Considerations

### Export Rate Limiting

```typescript
// Max 5 exports per minute per user
import { Ratelimit } from '@upstash/ratelimit'

const ratelimit = new Ratelimit({
  redis: /* Redis instance */,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
})

export async function GET(req: Request) {
  const { success } = await ratelimit.limit(userId)
  if (!success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    )
  }
  // ... export logic
}
```

### Data Sanitization

```typescript
// Sanitize pilot data before export
function sanitizePilotData(pilot: Pilot) {
  return {
    name: pilot.first_name + ' ' + pilot.last_name,
    rank: pilot.role,
    // Omit sensitive fields like SSN, salary, etc.
  }
}
```

---

## Accessibility Requirements

### WCAG 2.1 AA Compliance

1. **Chart Accessibility**:
   - Tremor charts are WCAG 2.1 AA compliant by default
   - Provide keyboard navigation for data points
   - Add ARIA labels for screen readers

2. **Export Buttons**:
   - Clear button labels ("Export PDF" not just icon)
   - Loading state announcements
   - Error messages read by screen readers

3. **Dialog Accessibility**:
   - Focus trap when open
   - ESC to close
   - Focus return to trigger element on close

---

## Rollout Plan

### Phase 1: Internal Testing (Week 1)
- Deploy to staging
- Test all export formats
- Verify chart rendering
- Performance testing

### Phase 2: Beta Testing (Week 2)
- Deploy to production with feature flag
- Enable for Admin users only
- Collect feedback on export formats
- Monitor performance metrics

### Phase 3: Full Rollout (Week 3)
- Enable for all users
- Update documentation
- Training for fleet managers
- Monitor usage and performance

---

## Success Criteria

✅ **Must Have**:
- [ ] Timeline visualization displays correctly
- [ ] PDF export completes in < 5 seconds
- [ ] CSV export is instant (< 1 second)
- [ ] Crew impact warnings are accurate
- [ ] All features keyboard accessible
- [ ] Zero accessibility violations (axe-core)

✅ **Nice to Have**:
- [ ] Historical trend comparison
- [ ] Email scheduled reports
- [ ] Customizable export templates
- [ ] Mobile-optimized charts

---

## Dependencies

### NPM Packages

```json
{
  "@tremor/react": "^3.17.0",    // Timeline visualization
  "puppeteer": "^23.0.0",        // PDF generation
  "papaparse": "^5.4.1",         // CSV export
  "@types/papaparse": "^5.3.14"  // TypeScript types
}
```

### Internal Dependencies
- ✅ `retirement-forecast-service.ts` (existing)
- ✅ `retirement-utils.ts` (existing)
- ✅ `admin-service.ts` (for pilot requirements)
- ✅ Supabase pilots table

---

## Post-Implementation

### Monitoring

Track these metrics:
- Export usage (PDF vs CSV)
- Chart load performance
- PDF generation time
- User engagement with timeline
- Error rates on exports

### Future Enhancements

1. **Advanced Analytics**: Multi-year trends, seasonal patterns
2. **Email Reports**: Scheduled monthly forecast emails
3. **Custom Templates**: Configurable PDF layouts
4. **Integration**: Sync with external HR systems
5. **Predictive Modeling**: ML-based retirement predictions

---

**Implementation Priority**: MEDIUM
**Business Value**: HIGH (Strategic Planning)
**Technical Complexity**: MEDIUM-HIGH
**Risk Level**: MEDIUM

**Recommendation**: Implement after #1 (Audit System) and #4 (Admin Profile).
