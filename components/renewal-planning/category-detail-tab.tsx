/**
 * Category Detail Tab
 *
 * Shows detailed renewal information for a single category.
 * Displays distribution across roster periods, capacity utilization, and pilot list.
 */

'use client'

import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Stethoscope,
  Plane,
  Monitor,
  GraduationCap,
  UserX,
  Link,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils/date-utils'
import { requiresPairing, type CaptainRole } from '@/lib/types/pairing'

const CAPTAIN_ROLE_LABELS: Record<CaptainRole, string> = {
  examiner: 'TRE',
  training_captain: 'TRI',
  line_captain: 'LCP',
  rhs_captain: 'RHS',
}

const CAPTAIN_ROLE_COLORS: Record<CaptainRole, string> = {
  examiner: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  training_captain: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  line_captain: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
  rhs_captain: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
}

interface PilotRenewal {
  id: string
  name: string
  employeeId: string
  checkType: string
  rosterPeriod: string
  plannedDate: Date
  expiryDate: Date
  rank?: string
  // Pairing fields for Flight/Simulator checks
  pairedWith?: {
    name: string
    employeeId: string
    role: 'Captain' | 'First Officer'
    captainRole?: CaptainRole
  }
  pairingStatus?: 'paired' | 'unpaired_solo' | 'not_applicable'
}

interface PeriodDistribution {
  rosterPeriod: string
  plannedCount: number
  capacity: number
  utilization: number
  pilots: PilotRenewal[]
}

interface CategoryDetailTabProps {
  category: string
  totalRenewals: number
  totalCapacity: number
  utilization: number
  periodDistribution: PeriodDistribution[]
  pilots: PilotRenewal[]
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'Pilot Medical': Stethoscope,
  'Flight Checks': Plane,
  'Simulator Checks': Monitor,
  'Ground Courses Refresher': GraduationCap,
}

const CATEGORY_COLORS: Record<string, string> = {
  'Pilot Medical': 'text-[var(--color-status-high)]',
  'Flight Checks': 'text-[var(--color-category-flight)]',
  'Simulator Checks': 'text-[var(--color-category-simulator)]',
  'Ground Courses Refresher': 'text-[var(--color-category-ground)]',
}

function getUtilizationColor(utilization: number): string {
  if (utilization > 80) return 'text-[var(--color-status-high)]'
  if (utilization > 60) return 'text-[var(--color-status-medium)]'
  return 'text-[var(--color-status-low)]'
}

function getProgressColor(utilization: number): string {
  if (utilization > 80) return 'bg-[var(--color-status-high)]'
  if (utilization > 60) return 'bg-[var(--color-status-medium)]'
  return 'bg-[var(--color-status-low)]'
}

export function CategoryDetailTab({
  category,
  totalRenewals,
  totalCapacity,
  utilization,
  periodDistribution,
  pilots,
}: CategoryDetailTabProps) {
  const Icon = CATEGORY_ICONS[category] || Calendar
  const iconColor = CATEGORY_COLORS[category] || 'text-primary'

  const highRiskPeriods = periodDistribution.filter((p) => p.utilization > 80)
  const showPairingColumn = requiresPairing(category)
  const sortedPilots = useMemo(
    () => [...pilots].sort((a, b) => a.name.localeCompare(b.name)),
    [pilots]
  )

  return (
    <div className="space-y-6">
      {/* Category Header Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-muted rounded-lg p-2">
              <Users className="h-5 w-5 text-[var(--color-category-flight)]" />
            </div>
            <div>
              <div className="text-foreground text-2xl font-bold">{totalRenewals}</div>
              <p className="text-muted-foreground text-xs">Total Renewals</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-muted rounded-lg p-2">
              <Calendar className="h-5 w-5 text-[var(--color-category-simulator)]" />
            </div>
            <div>
              <div className="text-foreground text-2xl font-bold">{totalCapacity}</div>
              <p className="text-muted-foreground text-xs">Total Capacity</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-muted rounded-lg p-2">
              <TrendingUp className={cn('h-5 w-5', getUtilizationColor(utilization))} />
            </div>
            <div>
              <div className={cn('text-2xl font-bold', getUtilizationColor(utilization))}>
                {Math.round(utilization)}%
              </div>
              <p className="text-muted-foreground text-xs">Utilization</p>
            </div>
          </div>
        </Card>

        <Card
          className={cn(
            'p-4',
            highRiskPeriods.length > 0 &&
              'border-[var(--color-status-medium-border)] bg-[var(--color-status-medium-bg)]'
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'rounded-lg p-2',
                highRiskPeriods.length > 0 ? 'bg-[var(--color-status-medium-bg)]' : 'bg-muted'
              )}
            >
              <AlertTriangle
                className={cn(
                  'h-5 w-5',
                  highRiskPeriods.length > 0
                    ? 'text-[var(--color-status-medium)]'
                    : 'text-[var(--color-status-low)]'
                )}
              />
            </div>
            <div>
              <div className="text-foreground text-2xl font-bold">{highRiskPeriods.length}</div>
              <p className="text-muted-foreground text-xs">High Risk Periods</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Distribution by Roster Period */}
      <Card className="p-4">
        <h4 className="text-foreground mb-4 flex items-center gap-2 font-semibold">
          <Icon className={cn('h-4 w-4', iconColor)} />
          Distribution Across Roster Periods
        </h4>

        <div className="space-y-3">
          {periodDistribution
            .filter((p) => p.plannedCount > 0 || p.capacity > 0)
            .map((period) => (
              <div key={period.rosterPeriod} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-medium">{period.rosterPeriod}</span>
                  <div className="flex items-center gap-2">
                    <span className={cn('font-semibold', getUtilizationColor(period.utilization))}>
                      {period.plannedCount} / {period.capacity}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs',
                        period.utilization > 80 &&
                          'border-[var(--color-status-high-border)] text-[var(--color-status-high)]',
                        period.utilization > 60 &&
                          period.utilization <= 80 &&
                          'border-[var(--color-status-medium-border)] text-[var(--color-status-medium)]',
                        period.utilization <= 60 &&
                          'border-[var(--color-status-low-border)] text-[var(--color-status-low)]'
                      )}
                    >
                      {Math.round(period.utilization)}%
                    </Badge>
                  </div>
                </div>
                <div className="bg-secondary h-2 w-full overflow-hidden rounded-full">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      getProgressColor(period.utilization)
                    )}
                    style={{ width: `${Math.min(period.utilization, 100)}%` }}
                  />
                </div>
              </div>
            ))}
        </div>
      </Card>

      {/* Pilot List */}
      <Card className="overflow-hidden">
        <div className="bg-muted/50 border-b p-4">
          <h4 className="text-foreground flex items-center gap-2 font-semibold">
            <Users className="h-4 w-4" />
            Pilots ({pilots.length})
          </h4>
        </div>

        <div className="max-h-[300px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 sticky top-0">
              <tr>
                <th className="text-muted-foreground px-4 py-2 text-left font-medium">Pilot</th>
                <th className="text-muted-foreground px-4 py-2 text-left font-medium">
                  Check Type
                </th>
                <th className="text-muted-foreground px-4 py-2 text-left font-medium">
                  Roster Period
                </th>
                {showPairingColumn && (
                  <th className="text-muted-foreground px-4 py-2 text-left font-medium">
                    Examiner / Paired With
                  </th>
                )}
                <th className="text-muted-foreground px-4 py-2 text-left font-medium">
                  Planned Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {sortedPilots.map((pilot) => (
                <tr key={pilot.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2">
                    <div className="font-medium">{pilot.name}</div>
                    {pilot.rank && (
                      <div className="text-muted-foreground text-xs">{pilot.rank}</div>
                    )}
                  </td>
                  <td className="text-muted-foreground px-4 py-2 text-sm">
                    {pilot.checkType}
                  </td>
                  <td className="px-4 py-2">
                    <Badge variant="outline" className="text-xs">
                      {pilot.rosterPeriod}
                    </Badge>
                  </td>
                  {showPairingColumn && (
                    <td className="px-4 py-2">
                      {pilot.pairingStatus === 'paired' && pilot.pairedWith ? (
                        <div className="flex items-center gap-1.5">
                          <Link className="h-3.5 w-3.5 text-[var(--color-status-low)]" />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-medium">
                                {pilot.pairedWith.name}
                              </span>
                              {pilot.pairedWith.captainRole && (
                                <Badge
                                  className={cn(
                                    'px-1.5 py-0 text-[10px] font-semibold',
                                    CAPTAIN_ROLE_COLORS[pilot.pairedWith.captainRole]
                                  )}
                                >
                                  {CAPTAIN_ROLE_LABELS[pilot.pairedWith.captainRole]}
                                </Badge>
                              )}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {pilot.pairedWith.employeeId} • {pilot.pairedWith.role}
                            </div>
                          </div>
                        </div>
                      ) : pilot.pairingStatus === 'unpaired_solo' ? (
                        <div className="flex items-center gap-1.5">
                          <UserX className="h-3.5 w-3.5 text-[var(--color-status-medium)]" />
                          <Badge
                            variant="outline"
                            className="border-[var(--color-status-medium-border)] text-xs text-[var(--color-status-medium)]"
                          >
                            Solo
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                  )}
                  <td className="text-muted-foreground px-4 py-2">
                    {formatDate(pilot.plannedDate)}
                  </td>
                </tr>
              ))}
              {sortedPilots.length === 0 && (
                <tr>
                  <td
                    colSpan={showPairingColumn ? 5 : 4}
                    className="text-muted-foreground px-4 py-8 text-center"
                  >
                    No pilots scheduled for this category
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Status Banner */}
      {highRiskPeriods.length > 0 ? (
        <Card className="border-[var(--color-status-medium-border)] bg-[var(--color-status-medium-bg)] p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--color-status-medium)]" />
            <div>
              <h4 className="font-medium text-[var(--color-status-medium-foreground)]">
                Capacity Warning
              </h4>
              <p className="mt-1 text-sm text-[var(--color-status-medium-foreground)]">
                {highRiskPeriods.length} period{highRiskPeriods.length > 1 ? 's' : ''} exceed
                {highRiskPeriods.length === 1 ? 's' : ''} 80% capacity:{' '}
                {highRiskPeriods.map((p) => p.rosterPeriod).join(', ')}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        totalRenewals > 0 && (
          <Card className="border-[var(--color-status-low-border)] bg-[var(--color-status-low-bg)] p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-[var(--color-status-low)]" />
              <span className="text-sm font-medium text-[var(--color-status-low-foreground)]">
                All periods within healthy capacity limits
              </span>
            </div>
          </Card>
        )
      )}
    </div>
  )
}
