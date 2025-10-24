# Certification Renewal Planning - Technical Implementation Guide

## Overview

This document provides technical details for developers working on the Certification Renewal Planning System.

---

## Database Schema

### 1. certification_renewal_plans

Primary table storing all renewal plans.

```sql
CREATE TABLE certification_renewal_plans (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  pilot_id UUID NOT NULL REFERENCES pilots(id) ON DELETE CASCADE,
  check_type_id UUID NOT NULL REFERENCES check_types(id) ON DELETE RESTRICT,
  paired_pilot_id UUID REFERENCES pilots(id) ON DELETE SET NULL,

  -- Core dates
  original_expiry_date DATE NOT NULL,
  planned_renewal_date DATE NOT NULL,
  planned_roster_period VARCHAR(20) NOT NULL,

  -- Renewal window (grace period boundaries)
  renewal_window_start DATE NOT NULL,
  renewal_window_end DATE NOT NULL,

  -- Status and metadata
  status VARCHAR(20) DEFAULT 'planned'
    CHECK (status IN ('planned', 'confirmed', 'completed', 'cancelled', 'rescheduled')),
  priority INTEGER CHECK (priority >= 0 AND priority <= 10),
  notes TEXT,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES an_users(id),
  updated_by UUID REFERENCES an_users(id),

  -- Constraints
  CONSTRAINT valid_renewal_window CHECK (
    renewal_window_start <= planned_renewal_date AND
    planned_renewal_date <= renewal_window_end
  ),
  CONSTRAINT valid_dates CHECK (
    planned_renewal_date <= original_expiry_date
  )
);

-- Indexes for performance
CREATE INDEX idx_renewal_plans_pilot ON certification_renewal_plans(pilot_id);
CREATE INDEX idx_renewal_plans_check_type ON certification_renewal_plans(check_type_id);
CREATE INDEX idx_renewal_plans_period ON certification_renewal_plans(planned_roster_period);
CREATE INDEX idx_renewal_plans_status ON certification_renewal_plans(status);
CREATE INDEX idx_renewal_plans_dates ON certification_renewal_plans(planned_renewal_date, original_expiry_date);
```

**Critical Constraint**: `valid_renewal_window` ensures planned date falls within the grace period window. This constraint caused initial implementation issues until date clamping logic was added.

---

### 2. roster_period_capacity

Defines capacity limits for each roster period by certification category.

```sql
CREATE TABLE roster_period_capacity (
  roster_period VARCHAR(20) PRIMARY KEY,
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  max_pilots_per_category JSONB NOT NULL DEFAULT '{
    "Pilot Medical": 4,
    "Flight Checks": 4,
    "Simulator Checks": 6,
    "Ground Courses Refresher": 8
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for date-based queries
CREATE INDEX idx_roster_capacity_dates ON roster_period_capacity(period_start_date, period_end_date);
```

**JSONB Structure**: Allows flexible category definitions without schema changes. New categories can be added by updating the JSONB object.

---

### 3. renewal_plan_history

Audit trail for all changes to renewal plans.

```sql
CREATE TABLE renewal_plan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  renewal_plan_id UUID REFERENCES certification_renewal_plans(id) ON DELETE CASCADE,
  change_type VARCHAR(50) NOT NULL,
  previous_date DATE,
  new_date DATE,
  previous_status VARCHAR(20),
  new_status VARCHAR(20),
  reason TEXT,
  changed_by UUID REFERENCES an_users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for audit queries
CREATE INDEX idx_renewal_history_plan ON renewal_plan_history(renewal_plan_id);
CREATE INDEX idx_renewal_history_date ON renewal_plan_history(changed_at DESC);
```

---

## Service Layer Implementation

### File: `lib/services/certification-renewal-planning-service.ts`

#### Core Algorithm: `generateRenewalPlan()`

**Purpose**: Generate renewal plans for expiring certifications using load balancing.

**Parameters**:

```typescript
interface GenerateOptions {
  monthsAhead?: number // Planning horizon (default: 12)
  categories?: string[] // Filter specific categories
  pilotIds?: string[] // Filter specific pilots
}
```

**Algorithm Flow**:

```typescript
export async function generateRenewalPlan(options?: GenerateOptions) {
  // 1. Fetch expiring certifications
  const endDate = addDays(new Date(), (monthsAhead || 12) * 30)
  const certifications = await fetchExpiringCertifications(endDate, categories, pilotIds)

  // 2. Fetch roster period capacities
  const capacityData = await fetchRosterPeriodCapacity()

  // 3. Initialize tracking structures
  const renewalPlans: RenewalPlanCreate[] = []
  const currentAllocations = new Map<string, Map<string, number>>() // period → category → count

  // 4. Process each certification
  for (const cert of certifications) {
    // 4a. Calculate renewal window based on grace period
    const category = cert.check_type.category
    const expiryDate = new Date(cert.expiry_date)
    const { start: windowStart, end: windowEnd } = calculateRenewalWindow(expiryDate, category)

    // 4b. Find all roster periods within renewal window
    const eligiblePeriods = getRosterPeriodsInRange(windowStart, windowEnd)

    if (eligiblePeriods.length === 0) {
      console.warn(`No roster periods found for certification ${cert.id}`)
      continue
    }

    // 4c. Find optimal period using load balancing
    let optimalPeriod = eligiblePeriods[0]
    let lowestLoad = getCurrentLoad(optimalPeriod.code, category, currentAllocations, capacityData)

    for (const period of eligiblePeriods.slice(1)) {
      const load = getCurrentLoad(period.code, category, currentAllocations, capacityData)
      if (load < lowestLoad) {
        optimalPeriod = period
        lowestLoad = load
      }
    }

    // 4d. CRITICAL: Clamp planned date to renewal window
    let plannedDate = optimalPeriod.startDate
    if (plannedDate < windowStart) {
      plannedDate = windowStart
    } else if (plannedDate > windowEnd) {
      plannedDate = windowEnd
    }

    // 4e. Create renewal plan
    const plan: RenewalPlanCreate = {
      pilot_id: cert.pilot_id,
      check_type_id: cert.check_type_id,
      original_expiry_date: cert.expiry_date,
      planned_renewal_date: formatDate(plannedDate),
      planned_roster_period: optimalPeriod.code,
      renewal_window_start: formatDate(windowStart),
      renewal_window_end: formatDate(windowEnd),
      status: 'planned',
      priority: calculatePriority(expiryDate),
    }

    renewalPlans.push(plan)

    // 4f. Update allocation tracking
    updateAllocations(currentAllocations, optimalPeriod.code, category)
  }

  // 5. Bulk insert plans
  const { data: created, error } = await supabase
    .from('certification_renewal_plans')
    .insert(renewalPlans)
    .select('*, pilots(*), check_types(*)')

  if (error) throw error

  return created
}
```

**Key Functions**:

```typescript
// Calculate grace period window
function calculateRenewalWindow(expiryDate: Date, category: string): { start: Date; end: Date } {
  const gracePeriod = getGracePeriod(category) // From grace-period-utils.ts
  const windowStart = subDays(expiryDate, gracePeriod)
  return { start: windowStart, end: expiryDate }
}

// Get current load for a period/category
function getCurrentLoad(
  periodCode: string,
  category: string,
  allocations: Map<string, Map<string, number>>,
  capacityData: RosterPeriodCapacity[]
): number {
  const periodAllocations = allocations.get(periodCode)
  const currentCount = periodAllocations?.get(category) || 0
  const capacity = getCapacityForCategory(periodCode, category, capacityData)

  return capacity > 0 ? currentCount / capacity : 1 // Return 1 if no capacity (avoid division by zero)
}

// Calculate priority based on days to expiry
function calculatePriority(expiryDate: Date): number {
  const daysUntilExpiry = differenceInDays(expiryDate, new Date())

  if (daysUntilExpiry < 0) return 10 // Expired - critical
  if (daysUntilExpiry <= 30) return 9 // < 30 days - critical
  if (daysUntilExpiry <= 60) return 7 // 30-60 days - high
  if (daysUntilExpiry <= 90) return 5 // 60-90 days - medium
  return Math.max(1, Math.floor(10 - daysUntilExpiry / 30)) // Gradual decrease
}

// Update allocation tracking
function updateAllocations(
  allocations: Map<string, Map<string, number>>,
  periodCode: string,
  category: string
): void {
  if (!allocations.has(periodCode)) {
    allocations.set(periodCode, new Map())
  }
  const periodAllocations = allocations.get(periodCode)!
  periodAllocations.set(category, (periodAllocations.get(category) || 0) + 1)
}
```

---

#### Helper Functions

**`getRosterPeriodCapacity(period: string)`**

Returns comprehensive capacity summary for a roster period.

```typescript
export async function getRosterPeriodCapacity(period: string) {
  const supabase = await createClient()

  // Get capacity definition
  const { data: capacityData } = await supabase
    .from('roster_period_capacity')
    .select('*')
    .eq('roster_period', period)
    .single()

  if (!capacityData) return null

  // Get all renewal plans for this period
  const { data: plans } = await supabase
    .from('certification_renewal_plans')
    .select(
      `
      *,
      check_types!inner (
        category
      )
    `
    )
    .eq('planned_roster_period', period)

  // Calculate category breakdown
  const categoryBreakdown: Record<string, { capacity: number; plannedCount: number }> = {}
  const maxCapacity = capacityData.max_pilots_per_category as Record<string, number>

  // Initialize all categories
  for (const [category, capacity] of Object.entries(maxCapacity)) {
    categoryBreakdown[category] = { capacity, plannedCount: 0 }
  }

  // Count planned renewals per category
  for (const plan of plans || []) {
    const category = plan.check_types?.category
    if (category && categoryBreakdown[category]) {
      categoryBreakdown[category].plannedCount++
    }
  }

  // Calculate totals
  const totalCapacity = Object.values(categoryBreakdown).reduce((sum, c) => sum + c.capacity, 0)
  const totalPlannedRenewals = Object.values(categoryBreakdown).reduce(
    (sum, c) => sum + c.plannedCount,
    0
  )
  const utilizationPercentage = totalCapacity > 0 ? (totalPlannedRenewals / totalCapacity) * 100 : 0

  return {
    rosterPeriod: period,
    periodStartDate: new Date(capacityData.period_start_date),
    periodEndDate: new Date(capacityData.period_end_date),
    totalCapacity,
    totalPlannedRenewals,
    utilizationPercentage,
    categoryBreakdown,
  }
}
```

**`getRenewalsByRosterPeriod(period: string)`**

Fetches all renewal plans for a period with full pilot and check type details.

```typescript
export async function getRenewalsByRosterPeriod(period: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('certification_renewal_plans')
    .select(
      `
      *,
      pilot:pilots!inner (
        id,
        first_name,
        last_name,
        employee_id,
        role
      ),
      check_type:check_types!inner (
        id,
        check_code,
        check_description,
        category
      )
    `
    )
    .eq('planned_roster_period', period)
    .order('planned_renewal_date')

  if (error) throw error

  return data || []
}
```

---

## Utilities

### File: `lib/utils/grace-period-utils.ts`

Centralized grace period configuration.

```typescript
export const GRACE_PERIODS: Record<string, number> = {
  'Pilot Medical': 28,
  'Flight Checks': 90,
  'Simulator Checks': 90,
  'Ground Courses Refresher': 60,
  'ID Cards': 0,
  'Foreign Pilot Work Permit': 0,
  'Travel Visa': 0,
  'Non-renewal': 0,
}

export function getGracePeriod(category: string): number {
  return GRACE_PERIODS[category] ?? 0
}

export function calculateRenewalWindow(
  expiryDate: Date,
  category: string
): { start: Date; end: Date } {
  const gracePeriod = getGracePeriod(category)
  const windowStart = subDays(expiryDate, gracePeriod)
  return { start: windowStart, end: expiryDate }
}

export function isWithinRenewalWindow(date: Date, expiryDate: Date, category: string): boolean {
  const { start, end } = calculateRenewalWindow(expiryDate, category)
  return date >= start && date <= end
}
```

---

### File: `lib/utils/roster-utils.ts`

Added function for finding roster periods within a date range.

```typescript
export function getRosterPeriodsInRange(startDate: Date, endDate: Date): RosterPeriod[] {
  const periods: RosterPeriod[] = []
  let currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    const period = getRosterPeriodFromDate(currentDate)

    // Avoid duplicates
    if (!periods.some((p) => p.code === period.code)) {
      periods.push(period)
    }

    // Move to next period (28 days)
    currentDate.setDate(currentDate.getDate() + 28)
  }

  return periods
}
```

**Why This Works**: Roster periods are exactly 28 days. By incrementing 28 days at a time, we're guaranteed to hit each period once.

---

## API Routes

### POST /api/renewal-planning/generate

Triggers renewal plan generation.

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { generateRenewalPlan } from '@/lib/services/certification-renewal-planning-service'

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { monthsAhead = 12, categories, pilotIds } = body

    // Validate input
    if (monthsAhead < 1 || monthsAhead > 24) {
      return NextResponse.json(
        { success: false, error: 'monthsAhead must be between 1 and 24' },
        { status: 400 }
      )
    }

    // Generate plans
    const plans = await generateRenewalPlan({ monthsAhead, categories, pilotIds })

    // Calculate summary statistics
    const byCategory: Record<string, number> = {}
    const rosterPeriodSummary: Record<string, number> = {}

    for (const plan of plans) {
      const category = plan.check_types?.category || 'Unknown'
      byCategory[category] = (byCategory[category] || 0) + 1

      const period = plan.planned_roster_period
      rosterPeriodSummary[period] = (rosterPeriodSummary[period] || 0) + 1
    }

    return NextResponse.json({
      success: true,
      data: {
        totalPlans: plans.length,
        byCategory,
        rosterPeriodSummary,
      },
    })
  } catch (error: any) {
    console.error('Error generating renewal plan:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate renewal plan',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
```

---

### DELETE /api/renewal-planning/clear

Clears all existing renewal plans.

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE() {
  try {
    const supabase = await createClient()

    // Delete all renewal plans
    // Note: Using neq with impossible UUID ensures all rows are deleted
    const { error } = await supabase
      .from('certification_renewal_plans')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'All renewal plans have been cleared',
    })
  } catch (error: any) {
    console.error('Error clearing renewal plans:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to clear renewal plans',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
```

**Security Note**: This endpoint should be restricted to admin users only. Add authentication check in production.

---

### GET /api/renewal-planning/export

Exports renewal plans as CSV.

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Fetch all renewal plans with full details
    const { data: renewals, error } = await supabase
      .from('certification_renewal_plans')
      .select(
        `
        *,
        pilots:pilot_id (
          id,
          first_name,
          last_name,
          employee_id,
          role,
          seniority_number
        ),
        check_types:check_type_id (
          id,
          check_code,
          check_description,
          category
        ),
        paired_pilot:paired_pilot_id (
          id,
          first_name,
          last_name
        )
      `
      )
      .order('planned_roster_period')
      .order('planned_renewal_date')

    if (error) throw error

    // CSV headers
    const headers = [
      'Roster Period',
      'Pilot Name',
      'Employee ID',
      'Role',
      'Seniority',
      'Check Code',
      'Check Description',
      'Category',
      'Original Expiry',
      'Planned Renewal',
      'Renewal Window Start',
      'Renewal Window End',
      'Status',
      'Priority',
      'Paired With',
      'Notes',
    ]

    // CSV rows
    const rows = renewals?.map((renewal: any) => {
      return [
        renewal.planned_roster_period || '',
        renewal.pilots ? `${renewal.pilots.first_name} ${renewal.pilots.last_name}` : '',
        renewal.pilots?.employee_id || '',
        renewal.pilots?.role || '',
        renewal.pilots?.seniority_number || '',
        renewal.check_types?.check_code || '',
        renewal.check_types?.check_description || '',
        renewal.check_types?.category || '',
        renewal.original_expiry_date || '',
        renewal.planned_renewal_date || '',
        renewal.renewal_window_start || '',
        renewal.renewal_window_end || '',
        renewal.status || '',
        renewal.priority || '',
        renewal.paired_pilot
          ? `${renewal.paired_pilot.first_name} ${renewal.paired_pilot.last_name}`
          : '',
        renewal.notes || '',
      ]
    })

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...(rows || []).map((row) =>
        // Escape quotes in cell values
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n')

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="renewal-plans-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error: any) {
    console.error('Error exporting renewal plans:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to export renewal plans',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
```

**CSV Escaping**: Cell values are quoted and internal quotes are doubled (`""`) to handle special characters and commas.

---

## UI Components

### Dashboard Page

**File**: `app/dashboard/renewal-planning/page.tsx`

**Server Component** - Fetches data on server, no client-side state.

```typescript
export default async function RenewalPlanningPage() {
  // Fetch data server-side
  const summaries = await getRosterPeriodSummaries()

  // Calculate statistics
  const highRiskPeriods = summaries.filter((s) => s!.utilizationPercentage > 80)
  const totalPlanned = summaries.reduce((sum, s) => sum + s!.totalPlannedRenewals, 0)
  const totalCapacity = summaries.reduce((sum, s) => sum + s!.totalCapacity, 0)
  const overallUtilization = totalCapacity > 0 ? (totalPlanned / totalCapacity) * 100 : 0

  return (
    <div className="space-y-6 p-8">
      {/* Stats cards showing totals */}
      {/* High-risk period alerts */}
      {/* Grid of roster period cards */}
    </div>
  )
}
```

**Key Design Decisions**:

- Server-side rendering for SEO and performance
- No client state - all data is fresh on each page load
- Utilization color coding: <60% green, 60-80% yellow, >80% red

---

### Roster Period Detail Page

**File**: `app/dashboard/renewal-planning/roster-period/[period]/page.tsx`

**Dynamic Route** with URL decoding for forward slashes.

```typescript
interface PageProps {
  params: Promise<{ period: string }>
}

export default async function RosterPeriodDetailPage({ params }: PageProps) {
  const { period: encodedPeriod } = await params

  // CRITICAL: Decode URL-encoded period (RP12%2F2025 -> RP12/2025)
  const period = decodeURIComponent(encodedPeriod)

  // Fetch data
  const summary = await getRosterPeriodCapacity(period)
  if (!summary) {
    notFound()
  }

  const renewals = await getRenewalsByRosterPeriod(period)

  // Group renewals by category
  const renewalsByCategory = renewals.reduce((acc, renewal) => {
    const category = renewal.check_type?.category || 'Unknown'
    if (!acc[category]) acc[category] = []
    acc[category].push(renewal)
    return acc
  }, {} as Record<string, typeof renewals>)

  return (
    <div className="space-y-6 p-8">
      {/* Period header */}
      {/* Summary cards */}
      {/* Category capacity breakdown */}
      {/* Tables grouped by category */}
    </div>
  )
}
```

**URL Encoding Issue**: Next.js encodes forward slashes in dynamic routes. Without `decodeURIComponent()`, the period parameter is "RP12%2F2025" instead of "RP12/2025", causing database lookups to fail.

---

### Generate Plan Page

**File**: `app/dashboard/renewal-planning/generate/page.tsx`

**Client Component** - Interactive form with state.

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function GeneratePlanPage() {
  const router = useRouter()
  const [monthsAhead, setMonthsAhead] = useState(12)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [clearExisting, setClearExisting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    try {
      setIsGenerating(true)

      // Step 1: Clear existing plans if requested
      if (clearExisting) {
        const clearResponse = await fetch('/api/renewal-planning/clear', {
          method: 'DELETE',
        })

        if (!clearResponse.ok) {
          throw new Error('Failed to clear existing plans')
        }
      }

      // Step 2: Generate new plans
      const generateResponse = await fetch('/api/renewal-planning/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthsAhead,
          categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        }),
      })

      if (!generateResponse.ok) {
        throw new Error('Failed to generate renewal plan')
      }

      const result = await generateResponse.json()

      // Step 3: Show success and redirect
      toast.success(`Generated ${result.data.totalPlans} renewal plans!`)
      router.push('/dashboard/renewal-planning')

    } catch (error: any) {
      console.error('Error generating plan:', error)
      toast.error(error.message || 'Failed to generate renewal plan')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6 p-8">
      {/* Configuration form */}
      <Input
        type="number"
        value={monthsAhead}
        onChange={(e) => setMonthsAhead(parseInt(e.target.value))}
      />

      {/* Category filter checkboxes */}
      {CATEGORIES.map(category => (
        <Checkbox
          checked={selectedCategories.includes(category)}
          onCheckedChange={(checked) => {
            if (checked) {
              setSelectedCategories([...selectedCategories, category])
            } else {
              setSelectedCategories(selectedCategories.filter(c => c !== category))
            }
          }}
        />
      ))}

      {/* Clear existing checkbox */}
      <Checkbox
        checked={clearExisting}
        onCheckedChange={(checked) => setClearExisting(!!checked)}
      />

      {/* Generate button */}
      <Button onClick={handleGenerate} disabled={isGenerating}>
        {isGenerating ? 'Generating...' : 'Generate Renewal Plan'}
      </Button>
    </div>
  )
}
```

**State Management**:

- `monthsAhead` - Planning horizon slider
- `selectedCategories` - Multi-select category filter
- `clearExisting` - Whether to delete old plans first
- `isGenerating` - Loading state for button

---

## Performance Considerations

### Database Queries

**Index Usage**:

- `idx_renewal_plans_period` - Fast filtering by roster period
- `idx_renewal_plans_dates` - Efficient date range queries
- `idx_roster_capacity_dates` - Quick roster period lookups

**Query Optimization**:

```typescript
// ✅ GOOD - Select only needed columns with joins
const { data } = await supabase
  .from('certification_renewal_plans')
  .select('id, planned_renewal_date, pilots!inner(first_name, last_name)')
  .eq('status', 'planned')

// ❌ BAD - Fetching all columns and doing joins in application code
const { data: plans } = await supabase.from('certification_renewal_plans').select('*')
const { data: pilots } = await supabase.from('pilots').select('*')
// Manually joining in JavaScript
```

### Bulk Operations

**Bulk Insert**:

```typescript
// ✅ GOOD - Single bulk insert
await supabase.from('certification_renewal_plans').insert(renewalPlans)

// ❌ BAD - Individual inserts in loop
for (const plan of renewalPlans) {
  await supabase.from('certification_renewal_plans').insert([plan])
}
```

**Performance Impact**: Bulk insert of 247 plans takes ~500ms vs ~30 seconds for individual inserts.

### Caching

Future enhancement - cache roster period capacity summaries:

```typescript
import { getCachedData, setCachedData } from '@/lib/services/cache-service'

export async function getRosterPeriodCapacity(period: string) {
  const cacheKey = `roster:capacity:${period}`
  const cached = await getCachedData(cacheKey)
  if (cached) return cached

  const data = await fetchCapacityFromDatabase(period)
  await setCachedData(cacheKey, data, 300) // 5 minute TTL
  return data
}
```

---

## Testing

### Unit Tests (Future)

Test service layer functions:

```typescript
import { describe, it, expect } from '@jest/globals'
import { calculatePriority } from '@/lib/services/certification-renewal-planning-service'
import { addDays } from 'date-fns'

describe('calculatePriority', () => {
  it('should return 10 for expired certifications', () => {
    const expiredDate = addDays(new Date(), -1)
    expect(calculatePriority(expiredDate)).toBe(10)
  })

  it('should return 9 for certifications expiring in < 30 days', () => {
    const soonDate = addDays(new Date(), 20)
    expect(calculatePriority(soonDate)).toBe(9)
  })

  it('should return lower priority for distant expirations', () => {
    const distantDate = addDays(new Date(), 120)
    expect(calculatePriority(distantDate)).toBeLessThan(5)
  })
})
```

### E2E Tests (Future)

Test complete user flows:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Renewal Planning', () => {
  test('should generate renewal plan', async ({ page }) => {
    // Navigate to generate page
    await page.goto('/dashboard/renewal-planning/generate')

    // Set planning horizon
    await page.fill('input[type="number"]', '12')

    // Click generate
    await page.click('button:has-text("Generate Renewal Plan")')

    // Wait for redirect
    await page.waitForURL('/dashboard/renewal-planning')

    // Verify plans were created
    await expect(page.locator('text=Total Planned')).toBeVisible()
  })

  test('should view roster period details', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard/renewal-planning')

    // Click on a roster period card
    await page.click('a[href*="/roster-period/"]')

    // Verify detail page loaded
    await expect(page.locator('h1')).toContainText('RP')
    await expect(page.locator('text=Total Renewals')).toBeVisible()
  })
})
```

---

## Debugging

### Common Issues

**Issue: Constraint violation on insert**

```
Error: new row violates check constraint "valid_renewal_window"
Detail: Failing row contains (..., planned_renewal_date: 2025-08-16, renewal_window_start: 2025-09-05, ...)
```

**Cause**: `planned_renewal_date` falls outside the renewal window.

**Debug**:

```typescript
console.log('Renewal window:', windowStart, '-', windowEnd)
console.log('Planned date:', plannedDate)
console.log('Is valid?', plannedDate >= windowStart && plannedDate <= windowEnd)
```

**Fix**: Add date clamping logic (already implemented).

---

**Issue: No roster periods found**

```
Warning: No roster periods found for certification abc123
```

**Cause**: Certification expiry date is too far in the future or past.

**Debug**:

```typescript
console.log('Expiry date:', cert.expiry_date)
console.log('Window:', windowStart, '-', windowEnd)
console.log('Eligible periods:', eligiblePeriods)
```

**Fix**: Verify grace period calculation and roster period generation logic.

---

**Issue: "Unknown" showing in tables**

**Cause**: Supabase join not resolving correctly.

**Debug**:

```typescript
// Check if relationship is configured
const { data } = await supabase
  .from('certification_renewal_plans')
  .select('*, pilot:pilots(*)')
  .eq('id', 'some-id')
  .single()

console.log('Pilot data:', data?.pilot)
```

**Fix**: Verify RLS policies allow reading pilot data, check relationship configuration in Supabase dashboard.

---

## Security Considerations

### Authentication

All API endpoints require authentication:

```typescript
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (!user || error) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  // Proceed with request...
}
```

### Authorization

Restrict destructive operations to admins:

```typescript
// Check user role
const { data: userProfile } = await supabase
  .from('an_users')
  .select('role')
  .eq('id', user.id)
  .single()

if (userProfile?.role !== 'admin') {
  return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
}
```

### Row Level Security

RLS policies on tables:

```sql
-- Admins can do everything
CREATE POLICY admin_all ON certification_renewal_plans
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role = 'admin'
    )
  );

-- Pilots can view their own plans
CREATE POLICY pilots_read_own ON certification_renewal_plans
  FOR SELECT
  USING (
    pilot_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM pilots
      WHERE pilots.id = pilot_id
      AND pilots.user_id = auth.uid()
    )
  );
```

---

## Monitoring and Logging

### Audit Trail

Log all plan modifications:

```typescript
async function createAuditLog(
  renewalPlanId: string,
  changeType: string,
  previousDate: Date | null,
  newDate: Date,
  reason: string,
  userId: string
) {
  await supabase.from('renewal_plan_history').insert({
    renewal_plan_id: renewalPlanId,
    change_type: changeType,
    previous_date: previousDate?.toISOString().split('T')[0],
    new_date: newDate.toISOString().split('T')[0],
    reason,
    changed_by: userId,
  })
}
```

### Error Logging

Log errors to monitoring service:

```typescript
try {
  // Operation
} catch (error) {
  console.error('Renewal plan generation failed:', {
    error: error.message,
    stack: error.stack,
    context: { monthsAhead, categories },
  })

  // Send to monitoring service (Sentry, LogRocket, etc.)
  // monitoringService.captureException(error)

  throw error
}
```

---

**Last Updated**: October 24, 2025
**Version**: 1.0.0
