# Implementation Plan #4: Admin Pilot Profile Enhancement

**Priority**: Very Low Risk (Independent)
**Estimated Timeline**: 1 week
**Dependencies**: None
**Status**: Planning Phase

---

## Overview

Enhance the admin pilot profile page to display comprehensive retirement information including countdown timer, eligibility status, timeline warnings, and succession planning indicators.

### Current State

**Existing Implementation** (✅ Already Built):
- `/app/dashboard/pilots/[id]/page.tsx` - Pilot detail page
- `retirement-utils.ts` - Complete retirement calculation utilities
- System settings for retirement age (65 default)
- Profile displays: name, rank, employee ID, contact info, certifications

**What's Missing** (🔴 Needs Implementation):
- Retirement countdown display
- Retirement date prominently shown
- Timeline warning badges
- Years until retirement indicator
- Succession planning readiness score
- Retirement eligibility status

---

## Objectives

### Primary Goals
1. ✅ Display retirement countdown prominently in profile header
2. ✅ Show retirement date with visual timeline
3. ✅ Add warning badges for pilots retiring soon (<2 years)
4. ✅ Display years of service alongside retirement info
5. ✅ Show succession planning status (if admin/manager)
6. ✅ Add retirement eligibility indicator

### Success Metrics
- Users can immediately see retirement timeline on profile load
- Warning badges catch attention for urgent retirements (<1 year)
- Profile loads in < 300ms (no performance degradation)
- All features fully accessible (WCAG 2.1 AA)

---

## Technical Design

### Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Pilot Profile Page (Server Component)                      │
│  /dashboard/pilots/[id]                                      │
│                                                              │
│  ├── Profile Header (ENHANCED)                              │
│  │   ├── Name, Rank, Photo                                 │
│  │   ├── RetirementCountdownBadge (NEW)                    │
│  │   └── SuccessionStatusBadge (NEW)                       │
│  │                                                          │
│  ├── Retirement Information Card (NEW)                      │
│  │   ├── Retirement Date Display                           │
│  │   ├── Countdown Timer                                   │
│  │   ├── Timeline Progress Bar                             │
│  │   ├── Years of Service                                  │
│  │   └── Warning Alerts                                    │
│  │                                                          │
│  ├── Personal Information (existing)                        │
│  ├── Contact Information (existing)                         │
│  ├── Certifications (existing)                              │
│  └── Qualifications (existing)                              │
└──────────────────────────────────────────────────────────────┘
         ↓
    retirement-utils.ts (EXISTING - no changes needed)
         ↓
    System settings (retirement age = 65)
```

### Service Layer (No Changes Needed)

**All utilities already exist** in `/lib/utils/retirement-utils.ts`:

```typescript
// ✅ Already implemented
export interface RetirementCountdown {
  years: number
  months: number
  days: number
  totalDays: number
  retirementDate: Date
  isRetired: boolean
}

// ✅ Already implemented
export function calculateRetirementCountdown(
  dateOfBirth: string,
  retirementAge: number = 65
): RetirementCountdown | null

// ✅ Already implemented
export function formatRetirementCountdown(
  countdown: RetirementCountdown | null
): string

// ✅ Already implemented
export function formatRetirementDate(date: Date): string

// ✅ Already implemented
export function getRetirementStatus(
  countdown: RetirementCountdown | null
): 'green' | 'yellow' | 'orange' | 'red'
```

**No service layer changes required** - all functionality exists!

---

## Component Design

### 1. RetirementCountdownBadge Component

**File**: `/components/pilots/RetirementCountdownBadge.tsx`

**Purpose**: Compact badge showing retirement countdown in profile header

```typescript
interface RetirementCountdownBadgeProps {
  dateOfBirth: string | null
  retirementAge: number
  compact?: boolean
}

export function RetirementCountdownBadge({
  dateOfBirth,
  retirementAge,
  compact = false
}: RetirementCountdownBadgeProps) {
  if (!dateOfBirth) return null

  const countdown = calculateRetirementCountdown(dateOfBirth, retirementAge)
  if (!countdown) return null

  const status = getRetirementStatus(countdown)

  if (countdown.isRetired) {
    return (
      <Badge variant="secondary" className="gap-1">
        <Clock className="h-3 w-3" />
        Retired
      </Badge>
    )
  }

  const urgencyConfig = {
    green: { color: 'bg-green-100 text-green-800 border-green-300', icon: null },
    yellow: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: null },
    orange: { color: 'bg-orange-100 text-orange-800 border-orange-300', icon: '⚠️' },
    red: { color: 'bg-red-100 text-red-800 border-red-300 animate-pulse', icon: '🔴' },
  }

  const config = urgencyConfig[status]

  return (
    <Badge className={`gap-1 border ${config.color}`}>
      {config.icon && <span>{config.icon}</span>}
      <Clock className="h-3 w-3" />
      {compact
        ? `${countdown.years}y ${countdown.months}m`
        : formatRetirementCountdown(countdown)}
    </Badge>
  )
}
```

**UI Design** (Profile Header):
```
┌────────────────────────────────────────────────────────────┐
│ Captain John Smith                                         │
│ Employee ID: EMP001                                        │
│                                                            │
│ Badges:                                                    │
│ ✅ Active                                                  │
│ 🔴 Retires in 11 months (Blinking orange badge)          │
│ ⭐ Captain                                                │
└────────────────────────────────────────────────────────────┘
```

### 2. RetirementInformationCard Component

**File**: `/components/pilots/RetirementInformationCard.tsx`

**Purpose**: Comprehensive retirement details in dedicated card

```typescript
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Clock, Calendar, TrendingUp, AlertTriangle } from 'lucide-react'
import {
  calculateRetirementCountdown,
  formatRetirementCountdown,
  formatRetirementDate,
  getRetirementStatus,
} from '@/lib/utils/retirement-utils'
import { calculateYearsOfService } from '@/lib/utils/pilot-utils'

interface RetirementInformationCardProps {
  dateOfBirth: string | null
  commencementDate: string | null
  retirementAge: number
  pilotName: string
}

export function RetirementInformationCard({
  dateOfBirth,
  commencementDate,
  retirementAge,
  pilotName
}: RetirementInformationCardProps) {
  if (!dateOfBirth) {
    return (
      <Card>
        <CardHeader>
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Clock className="h-5 w-5 text-purple-600" />
            Retirement Information
          </h3>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic">
            Date of birth not available - retirement information cannot be calculated
          </p>
        </CardContent>
      </Card>
    )
  }

  const countdown = calculateRetirementCountdown(dateOfBirth, retirementAge)
  const yearsOfService = commencementDate
    ? calculateYearsOfService(commencementDate)
    : null
  const status = getRetirementStatus(countdown)

  if (!countdown) return null

  if (countdown.isRetired) {
    return (
      <Card className="border-gray-300 bg-gray-50">
        <CardHeader>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-700">
            <Clock className="h-5 w-5" />
            Retirement Status
          </h3>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            {pilotName} has reached the standard retirement age of {retirementAge} years.
          </p>
          {yearsOfService && (
            <p className="mt-2 text-sm font-medium text-gray-700">
              Years of Service: {yearsOfService.toFixed(1)} years
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

  // Calculate progress (0-100% based on career length)
  const totalCareerYears = retirementAge - new Date(dateOfBirth).getFullYear()
  const yearsCompleted = new Date().getFullYear() - new Date(dateOfBirth).getFullYear()
  const careerProgress = Math.min(100, (yearsCompleted / totalCareerYears) * 100)

  // Warning thresholds
  const isUrgent = countdown.totalDays <= 365 // Less than 1 year
  const isWarning = countdown.totalDays <= 730 // Less than 2 years

  return (
    <Card className={isUrgent ? 'border-red-300 bg-red-50' : isWarning ? 'border-orange-300 bg-orange-50' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Clock className="h-5 w-5 text-purple-600" />
            Retirement Information
          </h3>
          <Badge variant="outline" className="text-xs">
            Retirement Age: {retirementAge}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Countdown Display */}
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-6">
          <div className="mb-2 text-sm font-medium text-purple-700">
            Time Until Retirement
          </div>
          <div className="text-4xl font-bold text-purple-900">
            {formatRetirementCountdown(countdown)}
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm text-purple-600">
            <Calendar className="h-4 w-4" />
            Retirement Date:{' '}
            <span className="font-semibold">
              {formatRetirementDate(countdown.retirementDate)}
            </span>
          </div>
        </div>

        {/* Timeline Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Career Timeline</span>
            <span className="text-muted-foreground">
              {careerProgress.toFixed(0)}% complete
            </span>
          </div>
          <Progress value={careerProgress} className="h-3" />
        </div>

        {/* Years of Service */}
        {yearsOfService && (
          <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <div>
              <div className="text-sm font-medium text-blue-900">
                Years of Service
              </div>
              <div className="text-2xl font-bold text-blue-700">
                {yearsOfService.toFixed(1)} years
              </div>
            </div>
          </div>
        )}

        {/* Warning Alerts */}
        {isUrgent && (
          <div className="flex items-start gap-3 rounded-lg border border-red-300 bg-red-100 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
            <div>
              <div className="font-semibold text-red-900">
                Urgent: Retirement Within 1 Year
              </div>
              <p className="mt-1 text-sm text-red-700">
                {pilotName} will retire in less than 1 year. Begin succession planning and
                recruitment immediately to ensure smooth transition.
              </p>
            </div>
          </div>
        )}

        {isWarning && !isUrgent && (
          <div className="flex items-start gap-3 rounded-lg border border-orange-300 bg-orange-100 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-orange-600" />
            <div>
              <div className="font-semibold text-orange-900">
                Warning: Retirement Within 2 Years
              </div>
              <p className="mt-1 text-sm text-orange-700">
                {pilotName} will retire in less than 2 years. Consider succession planning
                and knowledge transfer initiatives.
              </p>
            </div>
          </div>
        )}

        {/* Planning Recommendation */}
        {!countdown.isRetired && countdown.totalDays > 730 && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm text-green-800">
              <span className="font-semibold">Status:</span> No immediate action required.
              {pilotName} has {countdown.years} years until retirement.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

**UI Design**:
```
┌────────────────────────────────────────────────────────────┐
│ ⏰ Retirement Information         Retirement Age: 65      │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ ┌────────────────────────────────────────────────────┐    │
│ │ Time Until Retirement                              │    │
│ │                                                    │    │
│ │         11 months, 20 days                         │    │
│ │                                                    │    │
│ │ 📅 Retirement Date: November 15, 2025             │    │
│ └────────────────────────────────────────────────────┘    │
│                                                            │
│ Career Timeline                                 98% ●──●  │
│ ████████████████████████████████████████████░░░░░         │
│                                                            │
│ ┌────────────────────────────────────────────────────┐    │
│ │ 📈 Years of Service                                │    │
│ │     35.2 years                                     │    │
│ └────────────────────────────────────────────────────┘    │
│                                                            │
│ ⚠️  URGENT: Retirement Within 1 Year                      │
│     John Smith will retire in less than 1 year. Begin    │
│     succession planning and recruitment immediately to    │
│     ensure smooth transition.                             │
└────────────────────────────────────────────────────────────┘
```

### 3. SuccessionStatusBadge Component (Optional - Admin/Manager Only)

**File**: `/components/pilots/SuccessionStatusBadge.tsx`

**Purpose**: Show succession planning readiness status

```typescript
interface SuccessionStatusBadgeProps {
  pilotId: string
  rank: string
  retirementCountdown: RetirementCountdown | null
}

export async function SuccessionStatusBadge({
  pilotId,
  rank,
  retirementCountdown
}: SuccessionStatusBadgeProps) {
  // Server Component - checks if succession plan exists
  // Only visible to Admin/Manager roles
  // Displays:
  // - 🟢 "Successor Identified" if replacement pilot assigned
  // - 🟡 "Planning Required" if retiring soon but no successor
  // - ⚪ "No Action Needed" if retirement >3 years away
}
```

---

## Implementation Steps

### Phase 1: Component Development (Days 1-3)

1. **Build RetirementCountdownBadge**
   - Compact version for header
   - Color-coded by urgency
   - Pulsing animation for <1 year
   - Accessibility labels
   - Storybook story

2. **Build RetirementInformationCard**
   - Full retirement details
   - Progress bar visualization
   - Warning alerts for urgent retirements
   - Recommendation messages
   - Accessibility labels
   - Storybook story

3. **Build SuccessionStatusBadge** (Optional)
   - Server Component
   - Role-based visibility
   - Succession plan lookup
   - Storybook story

### Phase 2: Integration (Days 4-5)

1. **Enhance Pilot Profile Page**
   - Add RetirementCountdownBadge to header
   - Add RetirementInformationCard to main content
   - Add SuccessionStatusBadge to header (if admin)
   - Maintain existing sections
   - Add loading skeletons

2. **Update Profile Layout**
   - Move retirement card prominently (after header, before personal info)
   - Ensure mobile responsiveness
   - Test with various data scenarios:
     - Pilots retiring in <1 year
     - Pilots retiring in 1-2 years
     - Pilots retiring in >5 years
     - Already retired pilots
     - Pilots with missing DOB

### Phase 3: Testing & Polish (Days 6-7)

1. **E2E Testing with Playwright**
   - Test retirement countdown display
   - Test warning alerts for urgent retirements
   - Test progress bar rendering
   - Test accessibility (keyboard, screen readers)

2. **Edge Case Testing**
   - Pilots without DOB
   - Already retired pilots
   - Pilots retiring today
   - Pilots with future DOB (data error)

3. **Documentation**
   - Update README with new profile features
   - Document retirement calculation logic
   - Create user guide for interpreting retirement info

---

## Database & Service Layer (No Changes)

**All utilities already exist** - no database or service changes required!

- ✅ `retirement-utils.ts` has all calculation functions
- ✅ System settings table has `pilot_retirement_age`
- ✅ Pilots table has `date_of_birth` and `commencement_date`

---

## Performance Considerations

### No Performance Impact

- All calculations are synchronous (no database queries)
- Uses existing utility functions
- Client-side rendering for badges
- No additional API calls

### Caching (Optional)

```typescript
// If succession status lookup is added:
const cacheKey = `succession:${pilotId}`
const cached = await getCachedData(cacheKey)
if (cached) return cached

const status = await getSuccessionStatus(pilotId)
await setCachedData(cacheKey, status, 3600) // 1 hour
```

---

## Accessibility Requirements

### WCAG 2.1 AA Compliance

1. **Color + Icon + Text**: Warning badges use all three
2. **Keyboard Navigation**: All interactive elements accessible
3. **Screen Reader Support**: ARIA labels for all badges
4. **Focus Indicators**: Visible focus states
5. **Contrast Ratios**: All text meets 4.5:1 minimum

### ARIA Labels Example

```tsx
<Badge
  aria-label={`Retirement warning: ${pilotName} retires in ${countdown.years} years, ${countdown.months} months`}
  className="border border-orange-300 bg-orange-100"
>
  <AlertTriangle className="h-3 w-3" />
  Retires in {countdown.years}y {countdown.months}m
</Badge>
```

---

## Security Considerations

### Row-Level Security (RLS)

- ✅ Pilot profiles already protected by RLS
- ✅ Only Admin/Manager can view all pilots
- ✅ Pilots can only view own profile (portal)

### Succession Planning Visibility

```typescript
// Only Admin/Manager roles can see succession status
const { data: { user } } = await supabase.auth.getUser()
const canViewSuccession = user && ['Admin', 'Manager'].includes(user.role)

if (canViewSuccession) {
  return <SuccessionStatusBadge ... />
}
return null
```

---

## Rollout Plan

### Phase 1: Internal Testing (Days 1-2)
- Deploy to staging
- Test with various pilot scenarios
- Verify calculations are accurate
- Check mobile responsiveness

### Phase 2: Production Deployment (Day 3)
- Deploy to production
- Monitor error logs
- Collect user feedback
- Iterate based on feedback

### Phase 3: Documentation (Day 4)
- Update user guides
- Create training materials
- Document retirement policy

---

## Success Criteria

✅ **Must Have**:
- [ ] Retirement countdown displays correctly in profile header
- [ ] Retirement Information Card shows accurate data
- [ ] Warning badges appear for pilots retiring <1 year
- [ ] Progress bar accurately reflects career timeline
- [ ] All features keyboard accessible
- [ ] Zero accessibility violations (axe-core)
- [ ] Page load time remains < 300ms

✅ **Nice to Have**:
- [ ] Succession planning status badge (Admin/Manager only)
- [ ] Historical retirement trend comparison
- [ ] Career milestones display
- [ ] Pension estimate preview

---

## Dependencies

### NPM Packages (None Required)
- All functionality can be built with existing components
- Uses existing `retirement-utils.ts`

### Internal Dependencies
- ✅ `retirement-utils.ts` (already exists)
- ✅ `admin-service.ts` (for retirement age)
- ✅ Pilots table with `date_of_birth` field
- ✅ System settings table

---

## Post-Implementation

### Monitoring

Track these metrics:
- Profile page load performance
- Calculation accuracy (manual verification)
- User engagement with retirement info
- Error rates (missing DOB, calculation errors)

### Future Enhancements

1. **Pension Estimates**: Calculate estimated pension amounts
2. **Career Milestones**: Show significant dates (10yr, 20yr, 30yr service)
3. **Retirement Planning**: Link to retirement benefits portal
4. **Historical Trends**: Show fleet retirement patterns over time
5. **Succession Planning**: Full succession planning module

---

**Implementation Priority**: VERY LOW RISK
**Business Value**: HIGH (Strategic Visibility)
**Technical Complexity**: VERY LOW
**Risk Level**: VERY LOW

**Recommendation**: Implement early in the project - quick win with high visibility.
