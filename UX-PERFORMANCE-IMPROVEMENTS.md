# UX Performance Improvements Specification
**Fleet Management V2 - B767 Pilot Management System**

**Designer**: Sally (UX Expert)
**Date**: October 24, 2025
**Version**: 1.0
**Status**: Ready for Implementation

---

## Executive Summary

This specification details the user experience improvements for three performance-critical features identified in the BMad Orchestrator analysis. These improvements will transform good performance into **exceptional user experience** through thoughtful UI patterns, progressive disclosure, and perceived performance techniques.

### Target Features

| Feature | Current Performance | Target Performance | UX Impact |
|---------|-------------------|-------------------|-----------|
| **Renewal Planning** | 8 seconds | 1 second | 🔴 Critical - Users wait |
| **Dashboard** | 500ms | 50ms | 🟡 High - First impression |
| **Pilot List** | 200ms (janky scrolling) | 100ms (60fps smooth) | 🟡 High - Daily use |

---

## 1. Renewal Planning - Progress & Feedback UX

### Current User Experience Issues

```
❌ User clicks "Generate Renewal Plans"
   ↓
❌ 8-second freeze (no feedback)
   ↓
❌ Sudden appearance of results
   ↓
❌ User doesn't know: Is it working? How long? What's happening?
```

### Improved User Experience

```
✅ User clicks "Generate Renewal Plans"
   ↓
✅ Immediate visual feedback (button → spinner)
   ↓
✅ Progress bar with real-time updates
   ↓
✅ Step-by-step progress messages
   ↓
✅ Results stream in as they're ready
   ↓
✅ Success animation + summary
```

### UI Components Needed

#### 1.1 Progress Indicator Component

**File**: `components/renewal-planning/renewal-progress-indicator.tsx`

```typescript
'use client'

import { Progress } from '@/components/ui/progress'
import { CheckCircle2, Loader2, Clock } from 'lucide-react'

interface RenewalProgressStep {
  id: string
  label: string
  status: 'pending' | 'in_progress' | 'completed' | 'error'
  pilot?: string
  duration?: number
}

export function RenewalProgressIndicator({
  steps,
  currentStep,
  totalPilots,
  processedPilots,
  estimatedTimeRemaining,
}: {
  steps: RenewalProgressStep[]
  currentStep: number
  totalPilots: number
  processedPilots: number
  estimatedTimeRemaining: number
}) {
  const progress = (processedPilots / totalPilots) * 100

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow-md">
      {/* Overall Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Generating Renewal Plans</span>
          <span className="text-muted-foreground">
            {processedPilots} of {totalPilots} pilots
          </span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Est. {Math.ceil(estimatedTimeRemaining / 1000)}s remaining</span>
        </div>
      </div>

      {/* Step-by-Step Progress */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              'flex items-start gap-3 p-3 rounded-md transition-all',
              step.status === 'in_progress' && 'bg-blue-50 border border-blue-200',
              step.status === 'completed' && 'bg-green-50',
              step.status === 'error' && 'bg-red-50 border border-red-200'
            )}
          >
            {/* Icon */}
            {step.status === 'pending' && (
              <div className="h-5 w-5 rounded-full border-2 border-gray-300 mt-0.5" />
            )}
            {step.status === 'in_progress' && (
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin mt-0.5" />
            )}
            {step.status === 'completed' && (
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            )}
            {step.status === 'error' && (
              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{step.label}</p>
              {step.pilot && (
                <p className="text-xs text-muted-foreground mt-1">
                  Processing: {step.pilot}
                </p>
              )}
              {step.duration && step.status === 'completed' && (
                <p className="text-xs text-green-600 mt-1">
                  Completed in {step.duration}ms
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Cancel Button */}
      <button
        onClick={() => {/* Cancel generation */}}
        className="w-full py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
      >
        Cancel Generation
      </button>
    </div>
  )
}
```

#### 1.2 Streaming Results Display

**File**: `components/renewal-planning/renewal-results-stream.tsx`

```typescript
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

export function RenewalResultsStream({ results }: { results: RenewalPlan[] }) {
  return (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {results.map((result, index) => (
          <motion.div
            key={result.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-medium">
                    {result.pilot.first_name} {result.pilot.last_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {result.certifications_to_renew} certifications to renew
                  </p>
                </div>
                <Badge variant={result.priority === 'high' ? 'destructive' : 'default'}>
                  {result.priority}
                </Badge>
              </div>

              {/* Mini progress bar showing renewal timeline */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span>Next Renewal</span>
                  <span className="font-medium">{result.next_renewal_date}</span>
                </div>
                <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className={cn(
                      'h-full',
                      result.urgency === 'critical' && 'bg-red-500',
                      result.urgency === 'soon' && 'bg-yellow-500',
                      result.urgency === 'normal' && 'bg-green-500'
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${result.timeline_percentage}%` }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
```

#### 1.3 Success Summary Celebration

**File**: `components/renewal-planning/renewal-success-summary.tsx`

```typescript
'use client'

import { motion } from 'framer-motion'
import { CheckCircle, TrendingUp, AlertTriangle, Calendar } from 'lucide-react'
import confetti from 'canvas-confetti'
import { useEffect } from 'react'

export function RenewalSuccessSummary({
  totalPlans,
  highPriority,
  renewalsThisMonth,
  totalTime,
}: {
  totalPlans: number
  highPriority: number
  renewalsThisMonth: number
  totalTime: number
}) {
  useEffect(() => {
    // Celebrate completion with confetti 🎉
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    })
  }, [])

  const stats = [
    {
      icon: CheckCircle,
      label: 'Plans Generated',
      value: totalPlans,
      color: 'text-green-600',
    },
    {
      icon: AlertTriangle,
      label: 'High Priority',
      value: highPriority,
      color: 'text-red-600',
    },
    {
      icon: Calendar,
      label: 'This Month',
      value: renewalsThisMonth,
      color: 'text-blue-600',
    },
    {
      icon: TrendingUp,
      label: 'Processing Time',
      value: `${(totalTime / 1000).toFixed(1)}s`,
      color: 'text-purple-600',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200"
    >
      <div className="flex items-center gap-3 mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: 360 }}
          transition={{ type: 'spring', duration: 0.7 }}
        >
          <CheckCircle className="h-8 w-8 text-green-600" />
        </motion.div>
        <div>
          <h3 className="text-lg font-semibold text-green-900">
            Renewal Plans Generated Successfully!
          </h3>
          <p className="text-sm text-green-700">
            All pilot certification renewals have been planned
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 + 0.3 }}
            className="bg-white rounded-lg p-4 text-center"
          >
            <stat.icon className={cn('h-6 w-6 mx-auto mb-2', stat.color)} />
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-6">
        <button className="flex-1 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
          View All Plans
        </button>
        <button className="flex-1 py-2 bg-white text-green-700 border border-green-300 rounded-md hover:bg-green-50 transition-colors">
          Export PDF
        </button>
      </div>
    </motion.div>
  )
}
```

### User Flow

```
┌─────────────────────────────────────────────────────┐
│ 1. Initial State                                    │
│    [Generate Renewal Plans] button                  │
│    "Generate renewal plans for all pilots"          │
└─────────────────────────────────────────────────────┘
                    ↓ (User clicks)
┌─────────────────────────────────────────────────────┐
│ 2. Immediate Feedback (0ms)                         │
│    Button → Spinner                                  │
│    "Starting generation..."                          │
└─────────────────────────────────────────────────────┘
                    ↓ (100ms)
┌─────────────────────────────────────────────────────┐
│ 3. Progress Dialog Opens                            │
│    ┌─────────────────────────────────────────┐     │
│    │ Generating Renewal Plans                │     │
│    │ [████████░░░░░░] 12 of 27 pilots        │     │
│    │ Est. 0.8s remaining                     │     │
│    │                                         │     │
│    │ ✓ Loading pilot data                   │     │
│    │ ⟳ Processing: John Doe (Captain)       │     │
│    │ ○ Calculating renewal dates            │     │
│    │ ○ Generating priority scores           │     │
│    └─────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────┘
                    ↓ (As results complete)
┌─────────────────────────────────────────────────────┐
│ 4. Streaming Results Appear                         │
│    Results cards fade in one-by-one                 │
│    Each card animates smoothly into view            │
└─────────────────────────────────────────────────────┘
                    ↓ (On completion)
┌─────────────────────────────────────────────────────┐
│ 5. Success Celebration                              │
│    🎉 Confetti animation                            │
│    ✅ Success summary with stats                    │
│    [View All Plans] [Export PDF]                    │
└─────────────────────────────────────────────────────┘
```

---

## 2. Dashboard - Skeleton Loading & Progressive Hydration

### Current User Experience Issues

```
❌ User navigates to Dashboard
   ↓
❌ 500ms blank screen (loading...)
   ↓
❌ Sudden full page render
   ↓
❌ Jarring experience, feels slow
```

### Improved User Experience

```
✅ User navigates to Dashboard
   ↓
✅ Instant skeleton UI (0ms)
   ↓
✅ Progressive content hydration
   ↓
✅ Smooth transitions as data loads
   ↓
✅ Feels instant even at 100ms
```

### UI Components Needed

#### 2.1 Dashboard Skeleton Component

**File**: `components/dashboard/dashboard-skeleton.tsx`

```typescript
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>

      {/* Table Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

#### 2.2 Progressive Dashboard Component

**File**: `app/dashboard/page.tsx`

```typescript
import { Suspense } from 'react'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { DashboardCharts } from '@/components/dashboard/dashboard-charts'
import { RecentActivity } from '@/components/dashboard/recent-activity'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Fleet-wide pilot certification overview
        </p>
      </div>

      {/* Progressive Loading with Independent Suspense Boundaries */}
      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats />
      </Suspense>

      <div className="grid gap-4 md:grid-cols-2">
        <Suspense fallback={<ChartSkeleton />}>
          <DashboardCharts />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <ComplianceChart />
        </Suspense>
      </div>

      <Suspense fallback={<ActivitySkeleton />}>
        <RecentActivity />
      </Suspense>
    </div>
  )
}

// Async Server Components fetch data independently
async function DashboardStats() {
  const stats = await getDashboardStats() // Fetches from materialized view (50ms)
  return <StatsGrid stats={stats} />
}

async function DashboardCharts() {
  const data = await getChartData() // Parallel fetch
  return <ExpiryChart data={data} />
}
```

#### 2.3 Smooth Content Transition

**File**: `components/dashboard/stats-grid.tsx`

```typescript
'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export function StatsGrid({ stats }: { stats: DashboardStats }) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
    >
      {stats.map((stat) => (
        <motion.div key={stat.id} variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="text-2xl font-bold"
              >
                {stat.value}
              </motion.div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
              {stat.trend && (
                <div className={cn(
                  'flex items-center gap-1 text-xs mt-2',
                  stat.trend > 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {stat.trend > 0 ? '↑' : '↓'} {Math.abs(stat.trend)}%
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}
```

### User Flow

```
┌─────────────────────────────────────────────────────┐
│ 1. Navigation to Dashboard (0ms)                    │
│    Instant skeleton UI appears                       │
│    Layout is stable, no shifts                       │
└─────────────────────────────────────────────────────┘
                    ↓ (Progressive)
┌─────────────────────────────────────────────────────┐
│ 2. Stats Load First (50ms)                          │
│    Skeleton → Real stats                            │
│    Smooth fade-in animation                          │
│    Stagger effect (left to right)                    │
└─────────────────────────────────────────────────────┘
                    ↓ (Independent)
┌─────────────────────────────────────────────────────┐
│ 3. Charts Load (100ms)                              │
│    Skeleton → Real charts                           │
│    Independent loading (don't block stats)           │
└─────────────────────────────────────────────────────┘
                    ↓ (Final)
┌─────────────────────────────────────────────────────┐
│ 4. Activity Feed Loads (150ms)                      │
│    Skeleton → Real activity                         │
│    Page feels fast even at 150ms total              │
└─────────────────────────────────────────────────────┘
```

**Perceived Performance**: ⚡ Feels instant (skeleton at 0ms, stats at 50ms)

---

## 3. Pilot List - Virtual Scrolling with Smooth UX

### Current User Experience Issues

```
❌ Render 607 DOM nodes (all certifications)
   ↓
❌ Janky scrolling (30fps, stutters)
   ↓
❌ High memory usage
   ↓
❌ Slow initial render (200ms)
```

### Improved User Experience

```
✅ Render ~20 visible rows (90% fewer DOM nodes)
   ↓
✅ Buttery smooth 60fps scrolling
   ↓
✅ Low memory footprint
   ↓
✅ Fast initial render (<100ms)
```

### UI Components Needed

#### 3.1 Virtualized Pilot List

**File**: `components/pilots/pilot-list-virtualized.tsx`

```typescript
'use client'

import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'
import { PilotRow } from './pilot-row'

export function PilotListVirtualized({ pilots }: { pilots: Pilot[] }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: pilots.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Row height
    overscan: 10, // Render 10 extra rows for smooth scrolling
  })

  return (
    <div
      ref={parentRef}
      className="h-[600px] overflow-auto border rounded-lg"
      style={{
        // Smooth scrolling
        scrollBehavior: 'smooth',
        // Hardware acceleration
        willChange: 'transform',
      }}
    >
      {/* Virtual container with full height */}
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {/* Only render visible rows */}
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const pilot = pilots[virtualRow.index]

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="transition-transform duration-200"
            >
              <PilotRow pilot={pilot} />
            </div>
          )
        })}
      </div>

      {/* Scroll indicator */}
      <ScrollIndicator
        visible={virtualizer.getVirtualItems().length > 0}
        progress={(virtualizer.scrollOffset / virtualizer.getTotalSize()) * 100}
      />
    </div>
  )
}
```

#### 3.2 Smooth Scroll Indicator

**File**: `components/pilots/scroll-indicator.tsx`

```typescript
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

export function ScrollIndicator({
  visible,
  progress,
}: {
  visible: boolean
  progress: number
}) {
  return (
    <AnimatePresence>
      {visible && progress < 95 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="fixed bottom-4 right-4 flex items-center gap-2 bg-white shadow-lg rounded-full px-4 py-2 border"
        >
          <span className="text-xs font-medium">
            {Math.round(progress)}% scrolled
          </span>
          <ChevronDown className="h-3 w-3 animate-bounce text-muted-foreground" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

#### 3.3 Enhanced Pilot Row with Hover States

**File**: `components/pilots/pilot-row.tsx`

```typescript
'use client'

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ChevronRight } from 'lucide-react'

export function PilotRow({ pilot }: { pilot: Pilot }) {
  return (
    <motion.div
      whileHover={{ scale: 1.01, backgroundColor: 'hsl(var(--accent))' }}
      className="flex items-center gap-4 p-4 border-b cursor-pointer transition-colors"
    >
      {/* Avatar */}
      <Avatar>
        <AvatarFallback>
          {pilot.first_name[0]}{pilot.last_name[0]}
        </AvatarFallback>
      </Avatar>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium truncate">
            {pilot.first_name} {pilot.last_name}
          </h3>
          <Badge variant={pilot.role === 'Captain' ? 'default' : 'secondary'}>
            {pilot.role}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {pilot.certifications_count} certifications
          {pilot.expired_count > 0 && (
            <span className="text-red-600 ml-2">
              • {pilot.expired_count} expired
            </span>
          )}
        </p>
      </div>

      {/* Status Indicator */}
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'h-2 w-2 rounded-full',
            pilot.compliance_status === 'compliant' && 'bg-green-500',
            pilot.compliance_status === 'warning' && 'bg-yellow-500',
            pilot.compliance_status === 'critical' && 'bg-red-500'
          )}
        />
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </motion.div>
  )
}
```

#### 3.4 Search & Filter Overlay

**File**: `components/pilots/pilot-list-filters.tsx`

```typescript
'use client'

import { Search, Filter, SortAsc } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function PilotListFilters({
  onSearch,
  onFilter,
  onSort,
}: {
  onSearch: (query: string) => void
  onFilter: (filter: string) => void
  onSort: (sort: string) => void
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search pilots..."
          className="pl-10"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      {/* Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onFilter('all')}>
            All Pilots
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFilter('captains')}>
            Captains Only
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFilter('first-officers')}>
            First Officers Only
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFilter('expired')}>
            With Expired Certs
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Sort */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <SortAsc className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onSort('name')}>
            Name (A-Z)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSort('seniority')}>
            Seniority Number
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSort('certifications')}>
            Certification Count
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSort('compliance')}>
            Compliance Status
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
```

### User Flow

```
┌─────────────────────────────────────────────────────┐
│ 1. Initial Render (0ms)                             │
│    Skeleton for first 10 rows                       │
└─────────────────────────────────────────────────────┘
                    ↓ (100ms)
┌─────────────────────────────────────────────────────┐
│ 2. Virtual List Loads                               │
│    Only ~20 rows rendered (visible + overscan)      │
│    ┌─────────────────────────────────────────┐     │
│    │ [Search pilots...] [🔍] [📊] [↕️]      │     │
│    │                                         │     │
│    │ ┌─────────────────────────────────┐    │     │
│    │ │ 👤 John Doe      Captain    🟢 >│    │     │
│    │ │    27 certifications            │    │     │
│    │ ├─────────────────────────────────┤    │     │
│    │ │ 👤 Jane Smith    First Officer ●│    │     │
│    │ │    23 certifications            │    │     │
│    │ ├─────────────────────────────────┤    │     │
│    │ │ ... (18 more visible rows)      │    │     │
│    │ └─────────────────────────────────┘    │     │
│    │                                         │     │
│    │ [32% scrolled ↓]                        │     │
│    └─────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────┘
                    ↓ (User scrolls)
┌─────────────────────────────────────────────────────┐
│ 3. Smooth 60fps Scrolling                           │
│    Rows smoothly translate in/out of view           │
│    No janky stutters, buttery smooth                │
│    Scroll indicator shows progress                   │
└─────────────────────────────────────────────────────┘
```

**Performance**: 90% fewer DOM nodes, 60fps smooth scrolling

---

## 4. Micro-Interactions & Delight

### Loading State Transitions

All loading states should follow this pattern:

```typescript
// Skeleton → Content (Smooth fade)
<div className="animate-in fade-in-0 duration-500">
  {content}
</div>

// Button states
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Processing...
    </>
  ) : (
    'Submit'
  )}
</Button>
```

### Success Feedback

```typescript
// Toast notifications (non-intrusive)
toast.success('Renewal plan generated successfully', {
  description: '27 pilots processed in 1.2 seconds',
  action: {
    label: 'View',
    onClick: () => router.push('/renewal-plans'),
  },
})

// Inline success (for forms)
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  className="p-3 bg-green-50 border border-green-200 rounded-md"
>
  <div className="flex items-center gap-2">
    <CheckCircle className="h-4 w-4 text-green-600" />
    <p className="text-sm font-medium">Changes saved successfully</p>
  </div>
</motion.div>
```

### Error States

```typescript
// Friendly error messages
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Unable to generate renewal plans</AlertTitle>
  <AlertDescription>
    We encountered an issue processing pilot certifications.
    <br />
    <strong>What you can do:</strong>
    <ul className="list-disc list-inside mt-2">
      <li>Check your internet connection</li>
      <li>Try again in a few moments</li>
      <li>Contact support if the issue persists</li>
    </ul>
  </AlertDescription>
  <AlertAction onClick={retry}>Try Again</AlertAction>
</Alert>
```

---

## 5. Accessibility Enhancements

### Keyboard Navigation

```typescript
// All interactive elements keyboard accessible
<button
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }}
  aria-label="Generate renewal plans"
>
  Generate Plans
</button>
```

### Screen Reader Announcements

```typescript
'use client'

import { useEffect } from 'react'

export function LiveRegion({ message }: { message: string }) {
  useEffect(() => {
    const announcement = document.getElementById('live-region')
    if (announcement) {
      announcement.textContent = message
    }
  }, [message])

  return (
    <div
      id="live-region"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    />
  )
}

// Usage
<LiveRegion message="Renewal plans generated successfully for 27 pilots" />
```

### Focus Management

```typescript
// Trap focus in modal dialogs
import { useFocusTrap } from '@/hooks/use-focus-trap'

export function ProgressDialog({ open }: { open: boolean }) {
  const dialogRef = useFocusTrap(open)

  return (
    <Dialog open={open}>
      <DialogContent ref={dialogRef}>
        {/* Progress content */}
      </DialogContent>
    </Dialog>
  )
}
```

---

## 6. Performance Budget

### Target Metrics

| Metric | Target | Method |
|--------|--------|--------|
| **First Contentful Paint (FCP)** | <1s | Skeleton UI at 0ms |
| **Largest Contentful Paint (LCP)** | <2.5s | Progressive loading |
| **Time to Interactive (TTI)** | <3s | Minimal JS hydration |
| **Cumulative Layout Shift (CLS)** | <0.1 | Fixed skeleton heights |
| **Frame Rate (Scrolling)** | 60fps | Virtual scrolling |

### Monitoring

```typescript
// Performance monitoring hook
import { useEffect } from 'react'

export function usePerformanceMonitor(componentName: string) {
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log(`${componentName}:`, {
          name: entry.name,
          duration: entry.duration,
          startTime: entry.startTime,
        })
      }
    })

    observer.observe({ entryTypes: ['measure', 'navigation'] })

    return () => observer.disconnect()
  }, [componentName])
}

// Usage
usePerformanceMonitor('RenewalPlanGeneration')
```

---

## 7. Implementation Checklist

### Week 1: Renewal Planning UX (8 hours)

- [ ] Create `renewal-progress-indicator.tsx` (2h)
- [ ] Create `renewal-results-stream.tsx` (2h)
- [ ] Create `renewal-success-summary.tsx` (2h)
- [ ] Integrate with batch processing backend (1h)
- [ ] Test with real data and timing (1h)

### Week 2: Dashboard Skeleton UX (4 hours)

- [ ] Create `dashboard-skeleton.tsx` (1h)
- [ ] Update `dashboard/page.tsx` with Suspense (1h)
- [ ] Create `stats-grid.tsx` with animations (1h)
- [ ] Test progressive loading (1h)

### Week 3: Virtual Scrolling (8 hours)

- [ ] Install `@tanstack/react-virtual` (15min)
- [ ] Create `pilot-list-virtualized.tsx` (3h)
- [ ] Create `scroll-indicator.tsx` (1h)
- [ ] Update `pilot-row.tsx` with hover states (2h)
- [ ] Create `pilot-list-filters.tsx` (1.5h)
- [ ] Test with 607+ rows (30min)

### Week 4: Polish & Testing (4 hours)

- [ ] Add micro-interactions (1h)
- [ ] Implement accessibility enhancements (1h)
- [ ] Setup performance monitoring (1h)
- [ ] User acceptance testing (1h)

**Total Effort**: 24 hours over 4 weeks

---

## 8. Success Metrics

### Before vs After

| Feature | Before | After | Improvement |
|---------|--------|-------|-------------|
| **Renewal Planning Perceived Speed** | 8s freeze | 1s with feedback | ⚡ 8x better |
| **Dashboard First Paint** | 500ms blank | 0ms skeleton | ⚡ Instant |
| **Pilot List Scroll FPS** | 30fps janky | 60fps smooth | ⚡ 2x better |
| **DOM Nodes (Pilot List)** | 607 nodes | ~20 nodes | ⚡ 97% reduction |
| **User Satisfaction (predicted)** | 7/10 | 9.5/10 | ⚡ +35% |

### User Feedback Goals

- ✅ "The renewal planning feels instant now"
- ✅ "I love the progress updates, I know what's happening"
- ✅ "Scrolling through pilots is so smooth"
- ✅ "The dashboard loads immediately"

---

## 9. Design System Integration

### Animation Tokens

```typescript
// lib/design-tokens.ts
export const animations = {
  durations: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  easings: {
    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
}
```

### Color Tokens (Status)

```typescript
export const statusColors = {
  success: {
    background: 'hsl(142, 76%, 96%)',
    border: 'hsl(142, 76%, 86%)',
    text: 'hsl(142, 76%, 36%)',
  },
  warning: {
    background: 'hsl(48, 96%, 96%)',
    border: 'hsl(48, 96%, 86%)',
    text: 'hsl(48, 96%, 36%)',
  },
  error: {
    background: 'hsl(0, 76%, 96%)',
    border: 'hsl(0, 76%, 86%)',
    text: 'hsl(0, 76%, 36%)',
  },
}
```

---

## 10. Next Steps

1. **Review this specification** with the development team
2. **Prioritize features** based on user impact
3. **Begin Week 1 implementation** (Renewal Planning UX)
4. **User test prototypes** with 3-5 fleet managers
5. **Iterate based on feedback**

---

**Designed by**: Sally (UX Expert) 🎨
**For**: Fleet Management V2 - B767 Pilot Management System
**Goal**: Transform good performance into exceptional user experience

*"Users don't care about your milliseconds. They care about how it feels."*