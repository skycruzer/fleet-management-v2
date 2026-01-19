/**
 * Preview Pairing Panel
 *
 * Enhanced preview panel showing pairing information per roster period.
 * Used in Step 2 of the generation wizard.
 *
 * Features:
 * - Roster period cards with capacity utilization
 * - Paired crews display (Captain ↔ FO)
 * - Unpaired pilots with reasons
 * - Individual renewals (Ground Courses)
 * - Warnings for over-capacity periods
 */

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  ChevronDown,
  ChevronUp,
  Users,
  UserX,
  User,
  AlertTriangle,
  Plane,
  Monitor,
  GraduationCap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { RosterAssignmentBadge } from './roster-assignment-badge'

// Types matching the enhanced preview API response
interface PairingPreviewItem {
  captain: {
    pilotId: string
    name: string
    employeeId: string
    expiryDate: string
    windowStart: string
    windowEnd: string
  }
  firstOfficer: {
    pilotId: string
    name: string
    employeeId: string
    expiryDate: string
    windowStart: string
    windowEnd: string
  }
  category: string
  overlapDays: number
}

interface UnpairedPreviewItem {
  pilotId: string
  name: string
  employeeId: string
  role: 'Captain' | 'First Officer'
  expiryDate: string
  category: string
  reason: string
  urgency: 'critical' | 'high' | 'normal'
}

interface IndividualPreviewItem {
  pilotId: string
  name: string
  employeeId: string
  role: string
  expiryDate: string
  category: string
  checkCode: string
}

interface CategoryUtilization {
  flight: { current: number; capacity: number; percent: number }
  simulator: { current: number; capacity: number; percent: number }
  ground: { current: number; capacity: number; percent: number }
}

interface RosterPeriodDistribution {
  rosterPeriod: string
  periodStart: string
  periodEnd: string
  plannedCount: number
  totalCapacity: number
  utilization: number
  byCategory: Record<string, number>
  pairs: PairingPreviewItem[]
  unpaired: UnpairedPreviewItem[]
  individual: IndividualPreviewItem[]
  categoryUtilization: CategoryUtilization
}

interface PreviewPairingPanelProps {
  distribution: RosterPeriodDistribution[]
  className?: string
}

export function PreviewPairingPanel({ distribution, className }: PreviewPairingPanelProps) {
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(new Set())

  const togglePeriod = (code: string) => {
    setExpandedPeriods((prev) => {
      const next = new Set(prev)
      if (next.has(code)) {
        next.delete(code)
      } else {
        next.add(code)
      }
      return next
    })
  }

  const expandAll = () => {
    setExpandedPeriods(new Set(distribution.map((p) => p.rosterPeriod)))
  }

  const collapseAll = () => {
    setExpandedPeriods(new Set())
  }

  if (distribution.length === 0) {
    return (
      <Card className={cn('p-6 text-center', className)}>
        <p className="text-muted-foreground">No renewals found for the selected parameters.</p>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-foreground font-semibold">
          {distribution.length} Roster Period{distribution.length !== 1 ? 's' : ''} with Renewals
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            Collapse All
          </Button>
        </div>
      </div>

      {/* Roster Period Cards */}
      <div className="space-y-3">
        {distribution.map((period) => {
          const isExpanded = expandedPeriods.has(period.rosterPeriod)
          const hasWarning = period.utilization > 80
          const isOverCapacity = period.utilization > 100

          return (
            <Card
              key={period.rosterPeriod}
              className={cn(
                'overflow-hidden transition-all',
                isOverCapacity &&
                  'border-red-300 bg-red-50/50 dark:border-red-800 dark:bg-red-900/20',
                hasWarning &&
                  !isOverCapacity &&
                  'border-orange-300 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-900/20'
              )}
            >
              <Collapsible open={isExpanded} onOpenChange={() => togglePeriod(period.rosterPeriod)}>
                <CollapsibleTrigger asChild>
                  <button className="hover:bg-accent/50 flex w-full items-center justify-between p-4 text-left">
                    <div className="flex items-center gap-3">
                      <RosterAssignmentBadge
                        rosterPeriod={period.rosterPeriod}
                        utilization={period.utilization}
                      />
                      <div>
                        <p className="text-foreground text-sm font-medium">
                          {period.plannedCount} renewal{period.plannedCount !== 1 ? 's' : ''}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {period.periodStart} – {period.periodEnd}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* Summary badges */}
                      <div className="hidden items-center gap-2 sm:flex">
                        {period.pairs.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            <Users className="mr-1 h-3 w-3" />
                            {period.pairs.length} pairs
                          </Badge>
                        )}
                        {period.unpaired.length > 0 && (
                          <Badge variant="outline" className="text-xs text-orange-600">
                            <UserX className="mr-1 h-3 w-3" />
                            {period.unpaired.length} unpaired
                          </Badge>
                        )}
                        {period.individual.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <User className="mr-1 h-3 w-3" />
                            {period.individual.length} individual
                          </Badge>
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="text-muted-foreground h-4 w-4" />
                      ) : (
                        <ChevronDown className="text-muted-foreground h-4 w-4" />
                      )}
                    </div>
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="border-t p-4 pt-3">
                    {/* Capacity bars */}
                    <div className="mb-4 grid gap-2 sm:grid-cols-3">
                      <CapacityBar
                        label="Flight"
                        icon={<Plane className="h-3 w-3" />}
                        current={period.categoryUtilization.flight.current}
                        capacity={period.categoryUtilization.flight.capacity}
                        percent={period.categoryUtilization.flight.percent}
                      />
                      <CapacityBar
                        label="Simulator"
                        icon={<Monitor className="h-3 w-3" />}
                        current={period.categoryUtilization.simulator.current}
                        capacity={period.categoryUtilization.simulator.capacity}
                        percent={period.categoryUtilization.simulator.percent}
                      />
                      <CapacityBar
                        label="Ground"
                        icon={<GraduationCap className="h-3 w-3" />}
                        current={period.categoryUtilization.ground.current}
                        capacity={period.categoryUtilization.ground.capacity}
                        percent={period.categoryUtilization.ground.percent}
                      />
                    </div>

                    {/* Paired crews */}
                    {period.pairs.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-foreground mb-2 flex items-center text-sm font-medium">
                          <Users className="mr-2 h-4 w-4 text-green-600" />
                          Paired Crews ({period.pairs.length})
                        </h4>
                        <div className="space-y-2">
                          {period.pairs.map((pair, idx) => (
                            <PairCard key={idx} pair={pair} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Unpaired pilots */}
                    {period.unpaired.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-foreground mb-2 flex items-center text-sm font-medium">
                          <UserX className="mr-2 h-4 w-4 text-orange-600" />
                          Unpaired Pilots ({period.unpaired.length})
                        </h4>
                        <div className="space-y-2">
                          {period.unpaired.map((pilot, idx) => (
                            <UnpairedCard key={idx} pilot={pilot} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Individual renewals */}
                    {period.individual.length > 0 && (
                      <div>
                        <h4 className="text-foreground mb-2 flex items-center text-sm font-medium">
                          <GraduationCap className="mr-2 h-4 w-4 text-blue-600" />
                          Individual Renewals ({period.individual.length})
                        </h4>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {period.individual.map((item, idx) => (
                            <IndividualCard key={idx} item={item} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================
// Sub-components
// ============================================================

function CapacityBar({
  label,
  icon,
  current,
  capacity,
  percent,
}: {
  label: string
  icon: React.ReactNode
  current: number
  capacity: number
  percent: number
}) {
  const getBarColor = () => {
    if (percent > 100) return 'bg-red-500'
    if (percent >= 80) return 'bg-orange-500'
    if (percent >= 50) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground flex items-center gap-1">
          {icon}
          {label}
        </span>
        <span className="text-foreground font-medium">
          {current}/{capacity}
        </span>
      </div>
      <div className="bg-secondary h-2 overflow-hidden rounded-full">
        <div
          className={cn('h-full transition-all', getBarColor())}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  )
}

function PairCard({ pair }: { pair: PairingPreviewItem }) {
  const getCategoryIcon = () => {
    if (pair.category === 'Flight Checks') return <Plane className="h-3 w-3" />
    if (pair.category === 'Simulator Checks') return <Monitor className="h-3 w-3" />
    return null
  }

  return (
    <div className="bg-background flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center sm:flex-row sm:gap-3">
          <div className="text-center sm:text-left">
            <p className="text-foreground text-sm font-medium">{pair.captain.name}</p>
            <p className="text-muted-foreground text-xs">Captain • {pair.captain.employeeId}</p>
          </div>
          <span className="text-muted-foreground text-lg">↔</span>
          <div className="text-center sm:text-left">
            <p className="text-foreground text-sm font-medium">{pair.firstOfficer.name}</p>
            <p className="text-muted-foreground text-xs">FO • {pair.firstOfficer.employeeId}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {getCategoryIcon()}
          <span className="ml-1">{pair.category.replace(' Checks', '')}</span>
        </Badge>
        <Badge variant="secondary" className="text-xs">
          {pair.overlapDays}d overlap
        </Badge>
      </div>
    </div>
  )
}

function UnpairedCard({ pilot }: { pilot: UnpairedPreviewItem }) {
  const getReasonText = () => {
    switch (pilot.reason) {
      case 'no_matching_role':
        return `No matching ${pilot.role === 'Captain' ? 'FO' : 'Captain'}`
      case 'window_mismatch':
        return 'Window mismatch'
      case 'capacity_full':
        return 'Capacity full'
      case 'urgent_solo':
        return 'Urgent - scheduled solo'
      default:
        return pilot.reason
    }
  }

  const getUrgencyColor = () => {
    switch (pilot.urgency) {
      case 'critical':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30'
      case 'high':
        return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30'
      default:
        return 'text-muted-foreground bg-secondary'
    }
  }

  return (
    <div className="bg-background flex items-center justify-between rounded-lg border border-orange-200 p-3 dark:border-orange-800">
      <div>
        <p className="text-foreground text-sm font-medium">{pilot.name}</p>
        <p className="text-muted-foreground text-xs">
          {pilot.role} • {pilot.employeeId} • Expires: {pilot.expiryDate}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          <AlertTriangle className="mr-1 h-3 w-3" />
          {getReasonText()}
        </Badge>
        <Badge className={cn('text-xs', getUrgencyColor())}>{pilot.urgency}</Badge>
      </div>
    </div>
  )
}

function IndividualCard({ item }: { item: IndividualPreviewItem }) {
  return (
    <div className="bg-background flex items-center justify-between rounded-lg border p-3">
      <div>
        <p className="text-foreground text-sm font-medium">{item.name}</p>
        <p className="text-muted-foreground text-xs">
          {item.role} • {item.employeeId}
        </p>
      </div>
      <Badge variant="secondary" className="text-xs">
        {item.checkCode}
      </Badge>
    </div>
  )
}
