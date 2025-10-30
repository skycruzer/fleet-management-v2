# Implementation Plan #5: Pilot Portal Retirement Features

**Priority**: Low-Medium (Independent)
**Estimated Timeline**: 2 weeks
**Dependencies**: None
**Status**: Planning Phase

---

## Overview

Enhance the pilot portal to display personal retirement information, career progression tracking, pension estimates, and post-retirement planning resources.

### Current State

**Existing Implementation** (✅ Already Built):
- `/app/portal/(protected)/profile/page.tsx` - Pilot profile page
- `pilot-portal-service.ts` - Portal-specific operations
- Authentication and role-based access control
- Personal information display

**What's Missing** (🔴 Needs Implementation):
- Retirement countdown widget
- Pension estimate calculations
- Career progression timeline
- Post-retirement benefits information
- Retirement planning resources
- Years to captain eligibility (for FOs)

---

## Objectives

### Primary Goals
1. ✅ Display personal retirement countdown on dashboard
2. ✅ Show pension estimates (basic calculation)
3. ✅ Display career progression timeline
4. ✅ Provide retirement benefits information
5. ✅ Show path to captain promotion (for First Officers)
6. ✅ Add retirement planning resources

### Success Metrics
- Pilots can see their exact retirement date and countdown
- Pension estimates within 10% accuracy (rough estimate)
- Career progression clearly visualized
- Portal loads in < 500ms
- All features fully accessible (WCAG 2.1 AA)

---

## Technical Design

### Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Pilot Portal Dashboard                                      │
│  /portal/dashboard                                           │
│                                                              │
│  ├── Retirement Dashboard Widget (NEW)                      │
│  │   ├── Countdown Timer                                    │
│  │   ├── Retirement Date                                    │
│  │   ├── Pension Estimate                                   │
│  │   └── Quick Actions                                      │
│  │                                                          │
│  └── Existing Widgets (certifications, leave, etc.)         │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  Pilot Portal Profile                                        │
│  /portal/profile                                             │
│                                                              │
│  ├── Personal Information (existing)                         │
│  ├── Contact Information (existing)                          │
│  │                                                          │
│  ├── Retirement Information Card (NEW)                      │
│  │   ├── Countdown Display                                 │
│  │   ├── Timeline Progress Bar                             │
│  │   ├── Pension Estimate Details                          │
│  │   ├── Benefits Overview                                 │
│  │   └── Planning Resources                                │
│  │                                                          │
│  └── Career Progression Card (NEW)                          │
│      ├── Years of Service                                   │
│      ├── Promotion Timeline (FOs only)                      │
│      ├── Qualification Status                               │
│      └── Training Recommendations                           │
└──────────────────────────────────────────────────────────────┘
         ↓
    pilot-retirement-service.ts (NEW)
    retirement-utils.ts (EXISTING)
         ↓
    pilot_retirement_planning table (NEW - optional)
```

### Database Schema Changes (Optional)

#### New Table: pilot_retirement_planning

**Purpose**: Store pilot retirement preferences and planning notes

```sql
CREATE TABLE pilot_retirement_planning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pilot_id UUID NOT NULL REFERENCES pilots(id) ON DELETE CASCADE,
  retirement_date_preference DATE,  -- Pilot's preferred retirement date
  pension_option TEXT CHECK (pension_option IN ('full', 'partial', 'defer')),
  post_retirement_interest TEXT[],  -- Consulting, Training Captain, etc.
  planning_notes TEXT,
  benefits_acknowledged BOOLEAN DEFAULT false,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pilot_id)
);

-- RLS: Pilots can only view/update their own data
CREATE POLICY pilot_retirement_planning_policy ON pilot_retirement_planning
FOR ALL
USING (pilot_id = auth.uid());

CREATE INDEX idx_retirement_planning_pilot
ON pilot_retirement_planning(pilot_id);
```

---

## Service Layer

### New File: `/lib/services/pilot-retirement-service.ts`

```typescript
/**
 * Pilot Retirement Service
 * Handles retirement planning, pension estimates, and career progression
 */

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

type Pilot = Database['public']['Tables']['pilots']['Row']

export interface PensionEstimate {
  monthlyAmount: number
  annualAmount: number
  lumpSumOption: number
  calculationBasis: {
    yearsOfService: number
    averageSalary: number  // Placeholder - would come from payroll system
    contributionRate: number
  }
  disclaimer: string
}

export interface CareerProgression {
  currentRank: string
  yearsOfService: number
  yearsUntilCaptainEligible: number | null  // For FOs only
  promotionPath: Array<{
    milestone: string
    yearsRequired: number
    status: 'completed' | 'in_progress' | 'not_started'
  }>
  nextMilestone: {
    title: string
    description: string
    estimatedDate: Date | null
  } | null
}

export interface RetirementPlanningData {
  pilotId: string
  retirementDatePreference: Date | null
  pensionOption: 'full' | 'partial' | 'defer' | null
  postRetirementInterests: string[]
  planningNotes: string | null
  benefitsAcknowledged: boolean
}

/**
 * Calculate pension estimate for a pilot
 * DISCLAIMER: This is a simplified calculation for planning purposes only
 */
export async function calculatePensionEstimate(
  pilotId: string
): Promise<PensionEstimate> {
  const supabase = await createClient()

  const { data: pilot, error } = await supabase
    .from('pilots')
    .select('commencement_date, role')
    .eq('id', pilotId)
    .single()

  if (error || !pilot || !pilot.commencement_date) {
    throw new Error('Failed to fetch pilot data for pension calculation')
  }

  // Calculate years of service
  const commencementDate = new Date(pilot.commencement_date)
  const now = new Date()
  const yearsOfService =
    (now.getTime() - commencementDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)

  // PLACEHOLDER: In reality, this would integrate with payroll system
  // For now, use rank-based estimates
  const estimatedAnnualSalary = pilot.role === 'Captain' ? 150000 : 100000

  // Simplified pension formula: 2% per year of service * average salary
  const pensionPercentage = yearsOfService * 0.02
  const annualPension = estimatedAnnualSalary * pensionPercentage
  const monthlyPension = annualPension / 12
  const lumpSum = annualPension * 10 // Simplified lump sum calculation

  return {
    monthlyAmount: Math.round(monthlyPension),
    annualAmount: Math.round(annualPension),
    lumpSumOption: Math.round(lumpSum),
    calculationBasis: {
      yearsOfService: Math.round(yearsOfService * 10) / 10,
      averageSalary: estimatedAnnualSalary,
      contributionRate: 0.02
    },
    disclaimer: 'This is an estimate only. Actual pension amounts may vary based on final salary, service credits, and plan rules. Consult HR for official pension calculations.'
  }
}

/**
 * Get career progression timeline for a pilot
 */
export async function getCareerProgression(
  pilotId: string
): Promise<CareerProgression> {
  const supabase = await createClient()

  const { data: pilot, error } = await supabase
    .from('pilots')
    .select('role, commencement_date, qualifications')
    .eq('id', pilotId)
    .single()

  if (error || !pilot) {
    throw new Error('Failed to fetch pilot data')
  }

  const commencementDate = new Date(pilot.commencement_date || new Date())
  const yearsOfService =
    (new Date().getTime() - commencementDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)

  // Define promotion milestones
  const milestones = [
    { milestone: 'First Officer', yearsRequired: 0, description: 'Entry level position' },
    { milestone: '3 Years Experience', yearsRequired: 3, description: 'Eligible for additional ratings' },
    { milestone: '5 Years Experience', yearsRequired: 5, description: 'Captain promotion consideration' },
    { milestone: 'Line Captain', yearsRequired: 5, description: 'Full Captain qualification' },
    { milestone: 'Training Captain', yearsRequired: 10, description: 'Authorized to conduct training' },
    { milestone: 'Examiner', yearsRequired: 15, description: 'Authorized to conduct check rides' },
  ]

  const progressPath = milestones.map(m => ({
    milestone: m.milestone,
    yearsRequired: m.yearsRequired,
    status: yearsOfService >= m.yearsRequired ? 'completed' as const
      : yearsOfService >= m.yearsRequired - 1 ? 'in_progress' as const
      : 'not_started' as const
  }))

  // Find next milestone
  const nextMilestone = milestones.find(m => yearsOfService < m.yearsRequired)
  const nextMilestoneData = nextMilestone ? {
    title: nextMilestone.milestone,
    description: nextMilestone.description,
    estimatedDate: new Date(
      commencementDate.getTime() +
      nextMilestone.yearsRequired * 365.25 * 24 * 60 * 60 * 1000
    )
  } : null

  return {
    currentRank: pilot.role || 'Unknown',
    yearsOfService: Math.round(yearsOfService * 10) / 10,
    yearsUntilCaptainEligible: pilot.role === 'First Officer' && yearsOfService < 5
      ? 5 - yearsOfService
      : null,
    promotionPath: progressPath,
    nextMilestone: nextMilestoneData
  }
}

/**
 * Get or create retirement planning data for a pilot
 */
export async function getRetirementPlanningData(
  pilotId: string
): Promise<RetirementPlanningData | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('pilot_retirement_planning')
    .select('*')
    .eq('pilot_id', pilotId)
    .single()

  if (error && error.code !== 'PGRST116') {  // Not found is OK
    console.error('Error fetching retirement planning data:', error)
    return null
  }

  if (!data) {
    return {
      pilotId,
      retirementDatePreference: null,
      pensionOption: null,
      postRetirementInterests: [],
      planningNotes: null,
      benefitsAcknowledged: false
    }
  }

  return {
    pilotId: data.pilot_id,
    retirementDatePreference: data.retirement_date_preference
      ? new Date(data.retirement_date_preference)
      : null,
    pensionOption: data.pension_option as 'full' | 'partial' | 'defer' | null,
    postRetirementInterests: data.post_retirement_interest || [],
    planningNotes: data.planning_notes,
    benefitsAcknowledged: data.benefits_acknowledged || false
  }
}

/**
 * Update retirement planning preferences
 */
export async function updateRetirementPlanningData(
  pilotId: string,
  data: Partial<RetirementPlanningData>
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('pilot_retirement_planning')
    .upsert({
      pilot_id: pilotId,
      retirement_date_preference: data.retirementDatePreference?.toISOString().split('T')[0],
      pension_option: data.pensionOption,
      post_retirement_interest: data.postRetirementInterests,
      planning_notes: data.planningNotes,
      benefits_acknowledged: data.benefitsAcknowledged,
      last_updated: new Date().toISOString()
    })

  if (error) {
    throw new Error('Failed to update retirement planning data')
  }
}
```

---

## Component Design

### 1. RetirementDashboardWidget Component

**File**: `/components/portal/RetirementDashboardWidget.tsx`

**Purpose**: Compact retirement widget for pilot dashboard

```typescript
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Calendar, DollarSign } from 'lucide-react'
import Link from 'next/link'
import {
  calculateRetirementCountdown,
  formatRetirementCountdown,
  formatRetirementDate
} from '@/lib/utils/retirement-utils'
import { calculatePensionEstimate } from '@/lib/services/pilot-retirement-service'

interface RetirementDashboardWidgetProps {
  pilotId: string
  dateOfBirth: string | null
  retirementAge: number
}

export async function RetirementDashboardWidget({
  pilotId,
  dateOfBirth,
  retirementAge
}: RetirementDashboardWidgetProps) {
  if (!dateOfBirth) return null

  const countdown = calculateRetirementCountdown(dateOfBirth, retirementAge)
  if (!countdown || countdown.isRetired) return null

  const pension = await calculatePensionEstimate(pilotId)

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-600" />
            My Retirement
          </h3>
          <Badge variant="outline">
            Age {retirementAge}
          </Badge>
        </div>

        <div className="space-y-4">
          {/* Countdown */}
          <div className="rounded-lg bg-purple-50 p-4">
            <div className="text-sm text-purple-700 mb-1">Time Remaining</div>
            <div className="text-2xl font-bold text-purple-900">
              {formatRetirementCountdown(countdown)}
            </div>
            <div className="text-xs text-purple-600 mt-2 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatRetirementDate(countdown.retirementDate)}
            </div>
          </div>

          {/* Pension Estimate */}
          <div className="rounded-lg bg-green-50 p-4">
            <div className="text-sm text-green-700 mb-1 flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Estimated Monthly Pension
            </div>
            <div className="text-2xl font-bold text-green-900">
              ${pension.monthlyAmount.toLocaleString()}
            </div>
            <div className="text-xs text-green-600 mt-1">
              *Estimate only - see profile for details
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Link href="/portal/profile" className="flex-1">
              <Button variant="outline" className="w-full text-xs">
                View Full Details
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

**UI Design**:
```
┌────────────────────────────────────────────┐
│ ⏰ My Retirement           Age 65          │
├────────────────────────────────────────────┤
│                                            │
│ Time Remaining                             │
│ 11 months, 20 days                         │
│ 📅 November 15, 2025                      │
│                                            │
│ 💵 Estimated Monthly Pension               │
│ $5,250                                     │
│ *Estimate only - see profile for details  │
│                                            │
│ [ View Full Details ]                      │
└────────────────────────────────────────────┘
```

### 2. CareerProgressionCard Component

**File**: `/components/portal/CareerProgressionCard.tsx`

**Purpose**: Display career milestones and promotion timeline

```typescript
interface CareerProgressionCardProps {
  pilotId: string
}

export async function CareerProgressionCard({
  pilotId
}: CareerProgressionCardProps) {
  const progression = await getCareerProgression(pilotId)

  return (
    <Card>
      <CardHeader>
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Career Progression
        </h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Years of Service */}
          <div className="rounded-lg bg-blue-50 p-4">
            <div className="text-sm text-blue-700">Years of Service</div>
            <div className="text-3xl font-bold text-blue-900">
              {progression.yearsOfService} years
            </div>
          </div>

          {/* Captain Eligibility (FOs only) */}
          {progression.yearsUntilCaptainEligible !== null && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
              <div className="text-sm font-medium text-orange-900">
                Captain Eligibility
              </div>
              <div className="text-lg text-orange-700 mt-1">
                {progression.yearsUntilCaptainEligible > 0
                  ? `${progression.yearsUntilCaptainEligible.toFixed(1)} years remaining`
                  : 'Eligible for promotion!'}
              </div>
            </div>
          )}

          {/* Milestone Timeline */}
          <div className="space-y-3">
            <div className="text-sm font-medium">Career Milestones</div>
            {progression.promotionPath.map((milestone, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  milestone.status === 'completed'
                    ? 'bg-green-50 border-green-200'
                    : milestone.status === 'in_progress'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                {milestone.status === 'completed' && (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
                {milestone.status === 'in_progress' && (
                  <Clock className="h-5 w-5 text-yellow-600" />
                )}
                {milestone.status === 'not_started' && (
                  <Circle className="h-5 w-5 text-gray-400" />
                )}
                <div className="flex-1">
                  <div className="font-medium text-sm">{milestone.milestone}</div>
                  <div className="text-xs text-muted-foreground">
                    {milestone.yearsRequired} years
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Next Milestone */}
          {progression.nextMilestone && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="text-sm font-medium text-blue-900 mb-2">
                Next Milestone
              </div>
              <div className="font-semibold text-blue-800">
                {progression.nextMilestone.title}
              </div>
              <div className="text-sm text-blue-700 mt-1">
                {progression.nextMilestone.description}
              </div>
              {progression.nextMilestone.estimatedDate && (
                <div className="text-xs text-blue-600 mt-2">
                  Estimated: {format(progression.nextMilestone.estimatedDate, 'MMMM yyyy')}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

---

## Implementation Steps

### Phase 1: Service Layer (Days 1-4)

1. **Create pilot-retirement-service.ts**
   - `calculatePensionEstimate()`
   - `getCareerProgression()`
   - `getRetirementPlanningData()`
   - `updateRetirementPlanningData()`
   - Unit tests

2. **Create database migration** (optional)
   - `pilot_retirement_planning` table
   - RLS policies
   - Indexes

### Phase 2: UI Components (Days 5-9)

1. **Build RetirementDashboardWidget**
   - Server Component
   - Compact design
   - Pension estimate display
   - Storybook story

2. **Build CareerProgressionCard**
   - Milestone timeline
   - Captain eligibility indicator
   - Next milestone display
   - Storybook story

3. **Build PensionEstimateCard**
   - Detailed breakdown
   - Disclaimer
   - Options comparison
   - Storybook story

### Phase 3: Integration (Days 10-12)

1. **Add to Portal Dashboard**
   - Integrate RetirementDashboardWidget
   - Test loading states
   - Error handling

2. **Enhance Portal Profile**
   - Add retirement information section
   - Add career progression section
   - Mobile responsiveness

### Phase 4: Testing & Polish (Days 13-14)

1. **E2E Testing**
   - Test pension calculations
   - Test career progression display
   - Test RLS policies
   - Test accessibility

2. **Documentation**
   - Update portal user guide
   - Document pension calculation
   - Create retirement planning guide

---

## Success Criteria

✅ **Must Have**:
- [ ] Retirement countdown displays correctly
- [ ] Pension estimates within reasonable range
- [ ] Career progression shows accurate milestones
- [ ] RLS enforces pilot-only access
- [ ] All features keyboard accessible
- [ ] Zero accessibility violations

✅ **Nice to Have**:
- [ ] Retirement planning preferences saved
- [ ] Post-retirement interest tracking
- [ ] Benefits portal integration
- [ ] Retirement planning resources library

---

**Implementation Priority**: LOW-MEDIUM
**Business Value**: MEDIUM (Pilot Satisfaction)
**Technical Complexity**: MEDIUM
**Risk Level**: LOW

**Recommendation**: Implement alongside #4 (Admin Profile).
