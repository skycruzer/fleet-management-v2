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
    if (utilization > 100) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
    if (utilization >= 80)
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
    if (utilization >= 50)
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
    return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
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
