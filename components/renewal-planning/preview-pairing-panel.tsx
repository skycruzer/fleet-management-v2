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

import type { CaptainRole, SeatPosition } from '@/lib/types/pairing'

// Types matching the enhanced preview API response
interface PairingPreviewItem {
  captain: {
    pilotId: string
    name: string
    employeeId: string
    expiryDate: string
    windowStart: string
    windowEnd: string
    captainRole?: CaptainRole
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
  captainRole?: CaptainRole
  seatPosition?: SeatPosition
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
                  'border-[var(--color-status-high-border)] bg-[var(--color-status-high-bg)]/50',
                hasWarning &&
                  !isOverCapacity &&
                  'border-[var(--color-status-medium-border)] bg-[var(--color-status-medium-bg)]/50'
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
                          <Badge
                            variant="outline"
                            className="text-xs text-[var(--color-status-medium)]"
                          >
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
                          <Users className="mr-2 h-4 w-4 text-[var(--color-status-low)]" />
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
                          <UserX className="mr-2 h-4 w-4 text-[var(--color-status-medium)]" />
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
                          <GraduationCap className="mr-2 h-4 w-4 text-[var(--color-category-ground)]" />
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
    if (percent > 100) return 'bg-[var(--color-status-high)]'
    if (percent >= 80) return 'bg-[var(--color-status-medium)]'
    if (percent >= 50) return 'bg-[var(--color-status-medium)]/70'
    return 'bg-[var(--color-status-low)]'
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

function CaptainRoleBadge({ role }: { role?: CaptainRole }) {
  if (!role || role === 'line_captain') return null

  const config = {
    training_captain: {
      label: 'TRI',
      className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    },
    examiner: {
      label: 'TRE',
      className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    },
    rhs_captain: {
      label: 'RHS',
      className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    },
  }

  const cfg = config[role]
  if (!cfg) return null

  return (
    <Badge variant="outline" className={cn('text-[10px] font-semibold', cfg.className)}>
      {cfg.label}
    </Badge>
  )
}

function PairCard({ pair }: { pair: PairingPreviewItem }) {
  const getCategoryIcon = () => {
    if (pair.category === 'Flight Checks') return <Plane className="h-3 w-3" />
    if (pair.category === 'Simulator Checks') return <Monitor className="h-3 w-3" />
    return null
  }

  const isRhsCheck = pair.captain.captainRole && pair.captain.captainRole !== 'line_captain'

  return (
    <div className="bg-background flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center sm:flex-row sm:gap-3">
          <div className="text-center sm:text-left">
            <div className="flex items-center gap-1.5">
              <p className="text-foreground text-sm font-medium">{pair.captain.name}</p>
              <CaptainRoleBadge role={pair.captain.captainRole} />
            </div>
            <p className="text-muted-foreground text-xs">
              Captain • {pair.captain.employeeId}
              {isRhsCheck && ' • Right Seat'}
            </p>
          </div>
          <span className="text-muted-foreground text-lg">↔</span>
          <div className="text-center sm:text-left">
            <p className="text-foreground text-sm font-medium">{pair.firstOfficer.name}</p>
            <p className="text-muted-foreground text-xs">
              FO • {pair.firstOfficer.employeeId}
              {isRhsCheck && ' • Left Seat'}
            </p>
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
        return 'text-[var(--color-status-high)] bg-[var(--color-status-high-bg)]'
      case 'high':
        return 'text-[var(--color-status-medium)] bg-[var(--color-status-medium-bg)]'
      default:
        return 'text-muted-foreground bg-secondary'
    }
  }

  return (
    <div className="bg-background flex items-center justify-between rounded-lg border border-[var(--color-status-medium-border)] p-3">
      <div>
        <div className="flex items-center gap-1.5">
          <p className="text-foreground text-sm font-medium">{pilot.name}</p>
          <CaptainRoleBadge role={pilot.captainRole} />
        </div>
        <p className="text-muted-foreground text-xs">
          {pilot.role} • {pilot.employeeId} • Expires: {pilot.expiryDate}
          {pilot.seatPosition === 'right_seat' && ' • Right Seat'}
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
