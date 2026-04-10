/**
 * Unpaired Pilot Card Component
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
      'bg-[var(--color-status-high-bg)] text-[var(--color-status-high)] border-[var(--color-status-high-border)]',
    icon: AlertCircle,
    borderColor: 'border-l-[var(--color-status-high)]',
  },
  high: {
    label: 'High',
    color:
      'bg-[var(--color-status-medium-bg)] text-[var(--color-status-medium)] border-[var(--color-status-medium-border)]',
    icon: AlertTriangle,
    borderColor: 'border-l-[var(--color-status-medium)]',
  },
  normal: {
    label: 'Normal',
    color:
      'bg-[var(--color-status-medium-bg)]/70 text-[var(--color-status-medium)]/80 border-[var(--color-status-medium-border)]/70',
    icon: Timer,
    borderColor: 'border-l-[var(--color-status-medium)]/70',
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
  const categoryColor =
    pilot.category === 'Flight Checks'
      ? 'text-[var(--color-category-flight)]'
      : 'text-[var(--color-category-simulator)]'

  const urgencyConfig = URGENCY_CONFIG[pilot.urgency]
  const UrgencyIcon = urgencyConfig.icon

  const roleLabel = pilot.role === 'Captain' ? 'CPT' : 'FO'
  const roleColor =
    pilot.role === 'Captain'
      ? 'bg-[var(--color-status-medium-bg)] text-[var(--color-status-medium-foreground)]'
      : 'bg-[var(--color-category-flight-bg)] text-[var(--color-category-flight)]'

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
          <UserX className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--color-status-medium)]" />
          <div className="flex-1">
            <p className="text-sm font-medium text-[var(--color-status-medium-foreground)]">
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
                    ? 'text-[var(--color-status-high)]'
                    : pilot.daysUntilExpiry <= 30
                      ? 'text-[var(--color-status-medium)]'
                      : 'text-[var(--color-status-medium)]/80'
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
                    ? 'bg-[var(--color-status-high)]'
                    : pilot.daysUntilExpiry <= 30
                      ? 'bg-[var(--color-status-medium)]'
                      : 'bg-[var(--color-status-medium)]/70'
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
