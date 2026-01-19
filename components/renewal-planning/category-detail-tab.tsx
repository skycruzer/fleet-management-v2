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
import { Progress } from '@/components/ui/progress'
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
import { requiresPairing } from '@/lib/types/pairing'

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
  'Pilot Medical': 'text-red-500',
  'Flight Checks': 'text-blue-500',
  'Simulator Checks': 'text-purple-500',
  'Ground Courses Refresher': 'text-green-500',
}

function getUtilizationColor(utilization: number): string {
  if (utilization > 80) return 'text-red-600'
  if (utilization > 60) return 'text-yellow-600'
  return 'text-green-600'
}

function getProgressColor(utilization: number): string {
  if (utilization > 80) return 'bg-red-500'
  if (utilization > 60) return 'bg-yellow-500'
  return 'bg-green-500'
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
              <Users className="h-5 w-5 text-blue-500" />
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
              <Calendar className="h-5 w-5 text-purple-500" />
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
              'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950'
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'rounded-lg p-2',
                highRiskPeriods.length > 0 ? 'bg-yellow-100 dark:bg-yellow-900' : 'bg-muted'
              )}
            >
              <AlertTriangle
                className={cn(
                  'h-5 w-5',
                  highRiskPeriods.length > 0 ? 'text-yellow-600' : 'text-green-500'
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
                        period.utilization > 80 && 'border-red-300 text-red-600',
                        period.utilization > 60 &&
                          period.utilization <= 80 &&
                          'border-yellow-300 text-yellow-600',
                        period.utilization <= 60 && 'border-green-300 text-green-600'
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
                <th className="text-muted-foreground px-4 py-2 text-left font-medium">Emp ID</th>
                {showPairingColumn && (
                  <th className="text-muted-foreground px-4 py-2 text-left font-medium">
                    Paired With
                  </th>
                )}
                <th className="text-muted-foreground px-4 py-2 text-left font-medium">
                  Roster Period
                </th>
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
                  <td className="text-muted-foreground px-4 py-2">{pilot.employeeId}</td>
                  {showPairingColumn && (
                    <td className="px-4 py-2">
                      {pilot.pairingStatus === 'paired' && pilot.pairedWith ? (
                        <div className="flex items-center gap-1.5">
                          <Link className="h-3.5 w-3.5 text-green-500" />
                          <div>
                            <div className="text-sm font-medium">{pilot.pairedWith.name}</div>
                            <div className="text-muted-foreground text-xs">
                              {pilot.pairedWith.employeeId} • {pilot.pairedWith.role}
                            </div>
                          </div>
                        </div>
                      ) : pilot.pairingStatus === 'unpaired_solo' ? (
                        <div className="flex items-center gap-1.5">
                          <UserX className="h-3.5 w-3.5 text-orange-500" />
                          <Badge
                            variant="outline"
                            className="border-orange-300 text-xs text-orange-600 dark:border-orange-700 dark:text-orange-400"
                          >
                            Solo
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                  )}
                  <td className="px-4 py-2">
                    <Badge variant="outline" className="text-xs">
                      {pilot.rosterPeriod}
                    </Badge>
                  </td>
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
        <Card className="border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
            <div>
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Capacity Warning</h4>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                {highRiskPeriods.length} period{highRiskPeriods.length > 1 ? 's' : ''} exceed
                {highRiskPeriods.length === 1 ? 's' : ''} 80% capacity:{' '}
                {highRiskPeriods.map((p) => p.rosterPeriod).join(', ')}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        totalRenewals > 0 && (
          <Card className="border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                All periods within healthy capacity limits
              </span>
            </div>
          </Card>
        )
      )}
    </div>
  )
}
