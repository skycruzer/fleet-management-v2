/**
 * Paired Crew Card Component
 *
 * Displays a paired Captain + First Officer for Flight/Simulator checks.
 * Shows renewal window overlap, scheduled date, and pairing status.
 */

'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Calendar, CheckCircle, Unlink, Clock, Plane, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PairedCrew } from '@/lib/types/pairing'
import { format, parseISO } from 'date-fns'

interface PairedCrewCardProps {
  pair: PairedCrew
  onUnpair?: (pairId: string) => void
  showActions?: boolean
  compact?: boolean
}

export function PairedCrewCard({
  pair,
  onUnpair,
  showActions = false,
  compact = false,
}: PairedCrewCardProps) {
  const CategoryIcon = pair.category === 'Flight Checks' ? Plane : Monitor
  const categoryColor =
    pair.category === 'Flight Checks'
      ? 'text-[var(--color-category-flight)]'
      : 'text-[var(--color-category-simulator)]'

  const overlapDays = pair.renewalWindowOverlap.days

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all hover:shadow-md',
        compact ? 'p-3' : 'p-4'
      )}
    >
      {/* Category indicator stripe */}
      <div
        className={cn(
          'absolute top-0 left-0 h-full w-1',
          pair.category === 'Flight Checks'
            ? 'bg-[var(--color-category-flight)]'
            : 'bg-[var(--color-category-simulator)]'
        )}
      />

      <div className="ml-3 space-y-3">
        {/* Header with category and status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CategoryIcon className={cn('h-4 w-4', categoryColor)} />
            <span className="text-sm font-medium">{pair.category}</span>
          </div>
          <Badge
            variant="outline"
            className="border-[var(--color-status-low-border)] bg-[var(--color-status-low-bg)] text-[var(--color-status-low)]"
          >
            <CheckCircle className="mr-1 h-3 w-3" />
            Paired
          </Badge>
        </div>

        {/* Crew members */}
        <div className="space-y-2">
          {/* Captain */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700 dark:bg-amber-900 dark:text-amber-300">
              CPT
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{pair.captain.name}</p>
              <p className="text-muted-foreground text-xs">
                {pair.captain.employeeId} • Exp:{' '}
                {format(parseISO(pair.captain.expiryDate), 'MMM d, yyyy')}
              </p>
            </div>
          </div>

          {/* Connector line */}
          <div className="ml-4 flex items-center gap-2">
            <div className="border-muted h-4 w-px border-l-2 border-dashed" />
            <Users className="text-muted-foreground h-3 w-3" />
            <span className="text-muted-foreground text-xs">Paired for check</span>
          </div>

          {/* First Officer */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700 dark:bg-sky-900 dark:text-sky-300">
              FO
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{pair.firstOfficer.name}</p>
              <p className="text-muted-foreground text-xs">
                {pair.firstOfficer.employeeId} • Exp:{' '}
                {format(parseISO(pair.firstOfficer.expiryDate), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
        </div>

        {/* Schedule info */}
        <div className="bg-muted/50 flex items-center justify-between rounded-lg p-2">
          <div className="flex items-center gap-2">
            <Calendar className="text-muted-foreground h-4 w-4" />
            <div>
              <p className="text-xs font-medium">{pair.plannedRosterPeriod}</p>
              <p className="text-muted-foreground text-xs">
                {format(parseISO(pair.plannedDate), 'MMM d, yyyy')}
              </p>
            </div>
          </div>

          {/* Window overlap indicator */}
          <div className="flex items-center gap-1.5">
            <Clock className="text-muted-foreground h-3.5 w-3.5" />
            <span
              className={cn(
                'text-xs font-medium',
                overlapDays >= 30
                  ? 'text-[var(--color-status-low)]'
                  : overlapDays >= 14
                    ? 'text-[var(--color-status-medium)]'
                    : 'text-[var(--color-status-high)]'
              )}
            >
              {overlapDays}d overlap
            </span>
          </div>
        </div>

        {/* Window overlap visualization */}
        {!compact && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Renewal Window Overlap</span>
              <span className="text-muted-foreground">
                {format(parseISO(pair.renewalWindowOverlap.start), 'MMM d')} -{' '}
                {format(parseISO(pair.renewalWindowOverlap.end), 'MMM d')}
              </span>
            </div>
            <div className="bg-secondary h-2 w-full overflow-hidden rounded-full">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  overlapDays >= 30
                    ? 'bg-[var(--color-status-low)]'
                    : overlapDays >= 14
                      ? 'bg-[var(--color-status-medium)]'
                      : 'bg-[var(--color-status-high)]'
                )}
                style={{ width: `${Math.min((overlapDays / 90) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        {showActions && onUnpair && (
          <div className="flex justify-end pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive h-7 text-xs"
              onClick={() => onUnpair(pair.id)}
            >
              <Unlink className="mr-1 h-3 w-3" />
              Unpair
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
