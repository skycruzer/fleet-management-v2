/**
 * Roster Assignment Badge
 *
 * Badge component showing the assigned roster period for a renewal plan.
 * Displays period code with optional capacity indicator.
 */

'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Calendar } from 'lucide-react'

interface RosterAssignmentBadgeProps {
  rosterPeriod: string
  utilization?: number
  variant?: 'default' | 'compact'
  className?: string
}

export function RosterAssignmentBadge({
  rosterPeriod,
  utilization,
  variant = 'default',
  className,
}: RosterAssignmentBadgeProps) {
  // Determine color based on utilization
  const getUtilizationColor = () => {
    if (utilization === undefined) return 'bg-secondary text-secondary-foreground'
    if (utilization > 100) return 'bg-[var(--color-status-high-bg)] text-[var(--color-status-high)]'
    if (utilization >= 80)
      return 'bg-[var(--color-status-medium-bg)] text-[var(--color-status-medium)]'
    if (utilization >= 50)
      return 'bg-[var(--color-status-medium-bg)]/70 text-[var(--color-status-medium)]/80'
    return 'bg-[var(--color-status-low-bg)] text-[var(--color-status-low)]'
  }

  if (variant === 'compact') {
    return (
      <Badge variant="outline" className={cn('text-xs', className)}>
        {rosterPeriod}
      </Badge>
    )
  }

  return (
    <Badge className={cn('flex items-center gap-1', getUtilizationColor(), className)}>
      <Calendar className="h-3 w-3" />
      <span>{rosterPeriod}</span>
      {utilization !== undefined && (
        <span className="ml-1 text-[10px] opacity-75">({utilization}%)</span>
      )}
    </Badge>
  )
}
