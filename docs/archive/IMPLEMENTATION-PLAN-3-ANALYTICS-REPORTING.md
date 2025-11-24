# Implementation Plan #3: Advanced Analytics & Reporting

**Priority**: Medium-High (Complex, depends on #2)
**Estimated Timeline**: 3-4 weeks
**Dependencies**: #2 (retirement forecast enhancements)
**Status**: Planning Phase

---

## Overview

Build comprehensive analytics and reporting capabilities including multi-year retirement forecasts, crew shortage predictions, succession planning recommendations, and historical trend analysis.

### Current State

**Existing Implementation** (✅ Already Built):
- `/app/dashboard/analytics/page.tsx` - Basic analytics dashboard
- `analytics-service.ts` - Basic pilot/certification/leave analytics
- Retirement planning counts (2-year and 5-year)
- Certification compliance rates
- Leave request statistics

**What's Missing** (🔴 Needs Implementation):
- Multi-year retirement forecasts (10+ years)
- Crew shortage predictions
- Succession planning pipeline analysis
- Historical retirement trend analysis
- Executive-level reports
- Customizable report generation
- Advanced filtering and drill-down

---

## Objectives

### Primary Goals
1. ✅ Build multi-year retirement forecast (10-year outlook)
2. ✅ Create crew shortage prediction engine
3. ✅ Develop succession planning pipeline analysis
4. ✅ Add historical trend comparison
5. ✅ Generate executive summary reports
6. ✅ Enable advanced filtering and customization

### Success Metrics
- Accurate 10-year retirement forecasts
- Crew shortage predictions with 95%+ accuracy
- Succession pipeline identifies qualified candidates
- Reports load in < 2 seconds
- All features fully accessible (WCAG 2.1 AA)

---

## Technical Design

### Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Analytics Page (Server Component)                          │
│  /dashboard/analytics                                        │
│                                                              │
│  ├── Executive Summary Cards                                │
│  │   ├── Total Retirements (Multi-Year)                    │
│  │   ├── Predicted Shortages                               │
│  │   ├── Succession Readiness Score                        │
│  │   └── Critical Action Items                             │
│  │                                                          │
│  ├── Multi-Year Retirement Forecast (NEW)                  │
│  │   ├── 10-Year Timeline Chart                            │
│  │   ├── Year-by-Year Breakdown                            │
│  │   └── Peak Retirement Periods                           │
│  │                                                          │
│  ├── Crew Shortage Predictions (NEW)                       │
│  │   ├── Monthly Capacity Analysis                         │
│  │   ├── Shortage Warning Timeline                         │
│  │   └── Recruitment Recommendations                       │
│  │                                                          │
│  ├── Succession Planning Pipeline (NEW)                    │
│  │   ├── Captain Promotion Candidates                      │
│  │   ├── Qualification Gaps Analysis                       │
│  │   └── Training Pipeline Status                          │
│  │                                                          │
│  └── Historical Trends (NEW)                               │
│      ├── Retirement vs Hiring Trends                       │
│      ├── Certification Compliance Trends                   │
│      └── Leave Request Patterns                            │
└──────────────────────────────────────────────────────────────┘
         ↓
    analytics-service.ts (EXTENDED +400-500 lines)
    succession-planning-service.ts (NEW)
         ↓
    Materialized Views (NEW):
    - mv_pilot_succession_pipeline
    - mv_historical_retirement_trends
         ↓
    Supabase pilots table
```

### Database Schema Changes

#### New Materialized View: Pilot Succession Pipeline

**Purpose**: Identify First Officers ready for Captain promotion

```sql
CREATE MATERIALIZED VIEW mv_pilot_succession_pipeline AS
SELECT
  p.id,
  p.first_name,
  p.last_name,
  p.role,
  p.commencement_date,
  p.seniority_number,
  p.qualifications,
  -- Years of service
  EXTRACT(YEAR FROM AGE(NOW(), p.commencement_date::timestamp)) AS years_of_service,
  -- Retirement age calculation
  EXTRACT(YEAR FROM AGE(NOW(), p.date_of_birth::timestamp)) AS current_age,
  65 - EXTRACT(YEAR FROM AGE(NOW(), p.date_of_birth::timestamp)) AS years_until_retirement,
  -- Certification compliance
  (
    SELECT COUNT(*)
    FROM pilot_checks pc
    WHERE pc.pilot_id = p.id
    AND pc.expiry_date > NOW()
  ) AS current_certifications,
  -- Qualification scores
  CASE
    WHEN p.role = 'First Officer'
      AND EXTRACT(YEAR FROM AGE(NOW(), p.commencement_date::timestamp)) >= 5
      AND (p.qualifications->>'line_captain')::boolean = true
    THEN 'Ready for Promotion'
    WHEN p.role = 'First Officer'
      AND EXTRACT(YEAR FROM AGE(NOW(), p.commencement_date::timestamp)) >= 3
    THEN 'Potential Candidate'
    ELSE 'Not Ready'
  END AS promotion_readiness
FROM pilots p
WHERE p.is_active = true
ORDER BY p.seniority_number ASC;

-- Refresh daily at 2 AM
CREATE INDEX idx_succession_pipeline_readiness
ON mv_pilot_succession_pipeline(promotion_readiness);
```

#### New Materialized View: Historical Retirement Trends

**Purpose**: Track retirement patterns over time for trend analysis

```sql
CREATE MATERIALIZED VIEW mv_historical_retirement_trends AS
SELECT
  DATE_TRUNC('month', retirement_date) AS month,
  COUNT(*) AS retirements,
  COUNT(*) FILTER (WHERE role = 'Captain') AS captain_retirements,
  COUNT(*) FILTER (WHERE role = 'First Officer') AS fo_retirements
FROM (
  SELECT
    id,
    role,
    date_of_birth,
    DATE(date_of_birth + INTERVAL '65 years') AS retirement_date
  FROM pilots
  WHERE date_of_birth IS NOT NULL
) AS pilot_retirements
WHERE retirement_date BETWEEN '2020-01-01' AND '2035-12-31'
GROUP BY DATE_TRUNC('month', retirement_date)
ORDER BY month;

-- Refresh monthly
CREATE INDEX idx_retirement_trends_month
ON mv_historical_retirement_trends(month);
```

#### New Indexes for Performance

```sql
-- Optimize analytics queries
CREATE INDEX idx_pilots_commencement_active
ON pilots(commencement_date, is_active)
WHERE is_active = true;

CREATE INDEX idx_pilot_checks_expiry_pilot
ON pilot_checks(pilot_id, expiry_date)
WHERE expiry_date > NOW();
```

---

## Service Layer Extensions

### File: `/lib/services/analytics-service.ts`

#### New Functions to Add

```typescript
/**
 * Get multi-year retirement forecast (10+ years)
 * Returns yearly breakdown of retirements
 */
export async function getMultiYearRetirementForecast(
  years: number = 10,
  retirementAge: number = 65
): Promise<{
  yearly: Array<{
    year: number
    captains: number
    firstOfficers: number
    total: number
    peakMonth: { month: string; count: number }
  }>
  summary: {
    totalRetirements: number
    peakYear: { year: number; count: number }
    averagePerYear: number
  }
}> {
  // Implementation:
  // 1. Query pilots table
  // 2. Calculate retirement year for each pilot
  // 3. Group by year
  // 4. Calculate peak months within each year
  // 5. Generate summary statistics
}

/**
 * Predict crew shortages based on retirement and requirements
 * Returns monthly shortage forecasts
 */
export async function predictCrewShortages(
  years: number = 5,
  retirementAge: number = 65
): Promise<{
  monthly: Array<{
    month: string
    requiredCaptains: number
    availableCaptains: number
    captainShortage: number
    requiredFirstOfficers: number
    availableFirstOfficers: number
    foShortage: number
    severityLevel: 'none' | 'low' | 'medium' | 'high' | 'critical'
    recommendations: string[]
  }>
  criticalPeriods: Array<{
    startMonth: string
    endMonth: string
    severity: 'high' | 'critical'
    impactDescription: string
  }>
}> {
  // Implementation:
  // 1. Get multi-year retirement forecast
  // 2. Fetch pilot requirements from system settings
  // 3. Calculate cumulative available pilots per month
  // 4. Identify shortage periods
  // 5. Generate recommendations (recruit, promote, etc.)
}

/**
 * Get historical retirement trends for comparison
 * Returns actual retirements over past years
 */
export async function getHistoricalRetirementTrends(
  startYear: number,
  endYear: number
): Promise<{
  yearly: Array<{
    year: number
    retirements: number
    hires: number  // If tracking hires
    netChange: number
  }>
  trends: {
    averageRetirementsPerYear: number
    growthRate: number  // Percentage change
    projectedRetirements: number  // Based on trend
  }
}> {
  // Implementation:
  // 1. Query mv_historical_retirement_trends
  // 2. Group by year
  // 3. Calculate trends and growth rates
  // 4. Project future based on historical patterns
}
```

### New File: `/lib/services/succession-planning-service.ts`

```typescript
/**
 * Succession Planning Service
 * Identifies promotion candidates and tracks succession readiness
 */

export interface SuccessionCandidate {
  id: string
  name: string
  currentRank: string
  yearsOfService: number
  yearsUntilRetirement: number
  promotionReadiness: 'Ready for Promotion' | 'Potential Candidate' | 'Not Ready'
  qualificationGaps: string[]
  recommendedTraining: string[]
}

/**
 * Get list of First Officers ready for Captain promotion
 * Uses materialized view for performance
 */
export async function getCaptainPromotionCandidates(): Promise<{
  readyForPromotion: SuccessionCandidate[]
  potentialCandidates: SuccessionCandidate[]
  trainingPipeline: Array<{
    candidateId: string
    requiredTraining: string[]
    estimatedCompletionMonths: number
  }>
}> {
  const supabase = await createClient()

  // Query materialized view
  const { data, error } = await supabase
    .from('mv_pilot_succession_pipeline')
    .select('*')
    .eq('role', 'First Officer')
    .order('years_of_service', { ascending: false })

  if (error) {
    throw new Error('Failed to fetch succession candidates')
  }

  // Process and categorize candidates
  // Identify qualification gaps
  // Generate training recommendations
}

/**
 * Calculate succession readiness score for the fleet
 * Returns percentage of retiring captains with identified successors
 */
export async function getSuccessionReadinessScore(
  years: number = 5
): Promise<{
  score: number  // 0-100
  retiringCaptains: number
  identifiedSuccessors: number
  gapAnalysis: {
    captainsNeeded: number
    readyCandidates: number
    shortfall: number
  }
}> {
  // Implementation:
  // 1. Get captains retiring in next N years
  // 2. Count ready FO candidates
  // 3. Calculate readiness score
  // 4. Identify gaps
}
```

---

## Component Design

### 1. MultiYearForecastChart Component

**File**: `/components/analytics/MultiYearForecastChart.tsx`

**Purpose**: 10-year retirement forecast visualization

```typescript
'use client'

import { BarChart } from '@tremor/react'

interface MultiYearForecastChartProps {
  data: Array<{
    year: number
    captains: number
    firstOfficers: number
    total: number
  }>
}

export function MultiYearForecastChart({
  data
}: MultiYearForecastChartProps) {
  return (
    <Card>
      <h3 className="text-tremor-title font-semibold">
        10-Year Retirement Forecast
      </h3>
      <BarChart
        className="mt-4 h-96"
        data={data}
        index="year"
        categories={['captains', 'firstOfficers']}
        colors={['blue', 'emerald']}
        valueFormatter={(value) => `${value} pilots`}
        stack
        showLegend
        showGridLines
        showXAxis
        showYAxis
      />
    </Card>
  )
}
```

### 2. SuccessionPipelineTable Component

**File**: `/components/analytics/SuccessionPipelineTable.tsx`

**Purpose**: Display captain promotion candidates

```typescript
interface SuccessionPipelineTableProps {
  candidates: SuccessionCandidate[]
  showSensitiveData: boolean  // Admin/Manager only
}

export async function SuccessionPipelineTable({
  candidates,
  showSensitiveData
}: SuccessionPipelineTableProps) {
  // Server Component
  // Table with columns:
  // - Name
  // - Years of Service
  // - Promotion Readiness
  // - Qualification Gaps
  // - Recommended Actions

  // Sort by readiness, then seniority
  // Color-code readiness levels
  // Hide sensitive data if not admin/manager
}
```

### 3. CrewShortageWarnings Component

**File**: `/components/analytics/CrewShortageWarnings.tsx`

**Purpose**: Display critical shortage predictions

```typescript
interface CrewShortageWarningsProps {
  criticalPeriods: Array<{
    startMonth: string
    endMonth: string
    severity: 'high' | 'critical'
    impactDescription: string
  }>
}

export function CrewShortageWarnings({
  criticalPeriods
}: CrewShortageWarningsProps) {
  // Display urgent warnings
  // Timeline visualization
  // Actionable recommendations
}
```

---

## Implementation Steps

### Phase 1: Database Setup (Days 1-3)

1. **Create Materialized Views**
   - `mv_pilot_succession_pipeline`
   - `mv_historical_retirement_trends`
   - Add refresh schedules

2. **Add Performance Indexes**
   - Retirement calculation indexes
   - Analytics query optimization indexes

3. **Set up RLS Policies**
   - Succession pipeline (Admin/Manager only)
   - Historical trends (all authenticated users)

### Phase 2: Service Layer (Days 4-10)

1. **Extend analytics-service.ts**
   - `getMultiYearRetirementForecast()`
   - `predictCrewShortages()`
   - `getHistoricalRetirementTrends()`
   - Unit tests for all functions

2. **Create succession-planning-service.ts**
   - `getCaptainPromotionCandidates()`
   - `getSuccessionReadinessScore()`
   - Unit tests

### Phase 3: UI Components (Days 11-17)

1. **Build Chart Components**
   - MultiYearForecastChart
   - HistoricalTrendComparison
   - CrewCapacityTimeline

2. **Build Table Components**
   - SuccessionPipelineTable
   - ShortageAnalysisTable

3. **Build Warning Components**
   - CrewShortageWarnings
   - SuccessionGapAlerts

### Phase 4: Integration & Testing (Days 18-21)

1. **Integrate into Analytics Page**
   - Add all new components
   - Create tabbed layout
   - Add export controls

2. **E2E Testing**
   - Test all forecasts
   - Test RLS policies
   - Test accessibility

3. **Performance Optimization**
   - Cache materialized view queries
   - Optimize chart rendering

---

## Security Considerations

### Row-Level Security (RLS)

**CRITICAL**: Succession planning is highly sensitive

```sql
-- Only Admin/Manager can view succession pipeline
CREATE POLICY succession_pipeline_view_policy
ON mv_pilot_succession_pipeline
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM an_users
    WHERE id = auth.uid()
    AND role IN ('Admin', 'Manager')
  )
);
```

### Audit Logging

```typescript
// Log all succession planning queries
await createAuditLog({
  table_name: 'mv_pilot_succession_pipeline',
  operation: 'BUSINESS_EVENT',
  action: 'view_succession_pipeline',
  description: 'Viewed captain promotion candidates',
  metadata: { candidateCount: candidates.length }
})
```

---

## Performance Considerations

### Materialized View Refresh Schedule

```sql
-- Refresh succession pipeline daily at 2 AM
SELECT cron.schedule(
  'refresh-succession-pipeline',
  '0 2 * * *',
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY mv_pilot_succession_pipeline$$
);

-- Refresh historical trends monthly
SELECT cron.schedule(
  'refresh-retirement-trends',
  '0 3 1 * *',
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY mv_historical_retirement_trends$$
);
```

### Caching Strategy

```typescript
// Cache analytics data (12 hour TTL)
const cacheKey = 'analytics:multi-year-forecast'
const cached = await getCachedData(cacheKey)
if (cached) return cached

const data = await getMultiYearRetirementForecast()
await setCachedData(cacheKey, data, 43200) // 12 hours
```

---

## Success Criteria

✅ **Must Have**:
- [ ] 10-year retirement forecast displays accurately
- [ ] Crew shortage predictions identify all critical periods
- [ ] Succession pipeline identifies qualified candidates
- [ ] RLS policies enforce Admin/Manager access
- [ ] All queries complete in < 2 seconds
- [ ] Zero accessibility violations

✅ **Nice to Have**:
- [ ] Machine learning predictions
- [ ] Custom report builder
- [ ] Email scheduled reports
- [ ] Integration with external HR systems

---

## Dependencies

### NPM Packages
- ✅ `@tremor/react` (already installed from #2)
- No additional packages required

### Internal Dependencies
- ✅ `retirement-forecast-service.ts` (from #2)
- ✅ `admin-service.ts` (for requirements)
- ✅ Materialized views (new)

---

**Implementation Priority**: MEDIUM-HIGH
**Business Value**: VERY HIGH (Strategic Planning)
**Technical Complexity**: VERY HIGH
**Risk Level**: MEDIUM-HIGH

**Recommendation**: Implement after #2 (Interactive Dashboard) is complete.
