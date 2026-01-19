/**
 * Unpaired Pilot Card Component
 * Author: Maurice Rondeau
 *
 * Displays a warning card for pilots who couldn't be paired for Flight/Simulator checks.
 * Shows urgency level, reason for being unpaired, and scheduling status.
 */

'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  Calendar,
  Clock,
  UserX,
  Plane,
  Monitor,
  Search,
  AlertCircle,
  Timer,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UnpairedPilot, UnpairedReason } from '@/lib/types/pairing'
import { format, parseISO } from 'date-fns'

interface UnpairedPilotCardProps {
  pilot: UnpairedPilot
  onFindPair?: (pilotId: string) => void
  onScheduleSolo?: (pilotId: string) => void
  showActions?: boolean
  compact?: boolean
}

const UNPAIRED_REASON_LABELS: Record<UnpairedReason, string> = {
  no_matching_role: 'No available crew member with matching role',
  window_mismatch: "Renewal windows don't overlap sufficiently",
  capacity_full: 'All eligible roster periods at capacity',
  urgent_solo: 'Expiring soon - scheduled solo for safety',
  manual_override: 'Manually assigned for solo check',
}

const URGENCY_CONFIG = {
  critical: {
    label: 'Critical',
    color:
      'bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-700',
    icon: AlertCircle,
    borderColor: 'border-l-red-500',
  },
  high: {
    label: 'High',
    color:
      'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-700',
    icon: AlertTriangle,
    borderColor: 'border-l-orange-500',
  },
  normal: {
    label: 'Normal',
    color:
      'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-700',
    icon: Timer,
    borderColor: 'border-l-yellow-500',
  },
}

export function UnpairedPilotCard({
  pilot,
  onFindPair,
  onScheduleSolo,
  showActions = false,
  compact = false,
}: UnpairedPilotCardProps) {
  const CategoryIcon = pilot.category === 'Flight Checks' ? Plane : Monitor
  const categoryColor = pilot.category === 'Flight Checks' ? 'text-blue-500' : 'text-purple-500'

  const urgencyConfig = URGENCY_CONFIG[pilot.urgency]
  const UrgencyIcon = urgencyConfig.icon

  const roleLabel = pilot.role === 'Captain' ? 'CPT' : 'FO'
  const roleColor =
    pilot.role === 'Captain'
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
      : 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300'

  return (
    <Card
      className={cn(
        'relative overflow-hidden border-l-4 transition-all hover:shadow-md',
        urgencyConfig.borderColor,
        compact ? 'p-3' : 'p-4'
      )}
    >
      <div className="space-y-3">
        {/* Header with category and urgency */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CategoryIcon className={cn('h-4 w-4', categoryColor)} />
            <span className="text-sm font-medium">{pilot.category}</span>
          </div>
          <Badge variant="outline" className={urgencyConfig.color}>
            <UrgencyIcon className="mr-1 h-3 w-3" />
            {urgencyConfig.label}
          </Badge>
        </div>

        {/* Pilot info */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold',
              roleColor
            )}
          >
            {roleLabel}
          </div>
          <div className="flex-1">
            <p className="font-medium">{pilot.name}</p>
            <p className="text-muted-foreground text-sm">
              {pilot.employeeId} • {pilot.role}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">
              {pilot.daysUntilExpiry < 0 ? 'Expired' : `${pilot.daysUntilExpiry}d`}
            </p>
            <p className="text-muted-foreground text-xs">until expiry</p>
          </div>
        </div>

        {/* Unpaired status warning */}
        <div className="bg-muted/50 flex items-start gap-2 rounded-lg p-3">
          <UserX className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-500" />
          <div className="flex-1">
            <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
              Scheduled Solo
            </p>
            <p className="text-muted-foreground text-xs">{UNPAIRED_REASON_LABELS[pilot.reason]}</p>
          </div>
        </div>

        {/* Schedule info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="text-muted-foreground h-4 w-4" />
            <div>
              <p className="text-xs font-medium">{pilot.plannedRosterPeriod}</p>
              <p className="text-muted-foreground text-xs">
                {format(parseISO(pilot.plannedDate), 'MMM d, yyyy')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Clock className="text-muted-foreground h-3.5 w-3.5" />
            <span className="text-muted-foreground text-xs">
              Exp: {format(parseISO(pilot.expiryDate), 'MMM d, yyyy')}
            </span>
          </div>
        </div>

        {/* Expiry countdown bar */}
        {!compact && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Time Until Expiry</span>
              <span
                className={cn(
                  'font-medium',
                  pilot.daysUntilExpiry <= 14
                    ? 'text-red-600 dark:text-red-400'
                    : pilot.daysUntilExpiry <= 30
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-yellow-600 dark:text-yellow-400'
                )}
              >
                {pilot.daysUntilExpiry < 0
                  ? `${Math.abs(pilot.daysUntilExpiry)}d overdue`
                  : `${pilot.daysUntilExpiry}d remaining`}
              </span>
            </div>
            <div className="bg-secondary h-2 w-full overflow-hidden rounded-full">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  pilot.daysUntilExpiry <= 14
                    ? 'bg-red-500'
                    : pilot.daysUntilExpiry <= 30
                      ? 'bg-orange-500'
                      : 'bg-yellow-500'
                )}
                style={{
                  width: `${Math.max(Math.min((pilot.daysUntilExpiry / 90) * 100, 100), 5)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex justify-end gap-2 pt-2">
            {onFindPair && pilot.urgency !== 'critical' && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => onFindPair(pilot.pilotId)}
              >
                <Search className="mr-1 h-3 w-3" />
                Find Pair
              </Button>
            )}
            {onScheduleSolo && (
              <Button
                variant="default"
                size="sm"
                className="h-7 text-xs"
                onClick={() => onScheduleSolo(pilot.pilotId)}
              >
                <Calendar className="mr-1 h-3 w-3" />
                Confirm Solo
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
