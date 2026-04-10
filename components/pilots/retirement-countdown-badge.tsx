/**
 * Retirement Countdown Badge Component
 * Compact badge showing retirement countdown for pilot profile header
 * Color-coded by urgency with pulsing animation for critical timelines
 *
 * @version 1.0.0
 * @since 2025-10-25
 */

import { Badge } from '@/components/ui/badge'
import { Clock } from 'lucide-react'
import {
  calculateRetirementCountdown,
  formatRetirementCountdown,
  getRetirementStatus,
} from '@/lib/utils/retirement-utils'
import { cn } from '@/lib/utils'

interface RetirementCountdownBadgeProps {
  dateOfBirth: string | null
  retirementAge: number
  compact?: boolean
}

export function RetirementCountdownBadge({
  dateOfBirth,
  retirementAge,
  compact = false,
}: RetirementCountdownBadgeProps) {
  if (!dateOfBirth) return null

  const countdown = calculateRetirementCountdown(dateOfBirth, retirementAge)
  if (!countdown) return null

  // Already retired
  if (countdown.isRetired) {
    return (
      <Badge variant="secondary" className="gap-1">
        <Clock className="h-3 w-3" />
        Retired
      </Badge>
    )
  }

  const status = getRetirementStatus(countdown)

  // Urgency configuration with colors and animations
  const urgencyConfig = {
    green: {
      className:
        'bg-[var(--color-status-low-bg)] text-[var(--color-status-low)] border-[var(--color-status-low-border)]',
      icon: null,
    },
    yellow: {
      className:
        'bg-[var(--color-status-medium-bg)] text-[var(--color-status-medium)] border-[var(--color-status-medium-border)]',
      icon: null,
    },
    orange: {
      className:
        'bg-[var(--color-status-medium-bg)] text-[var(--color-status-medium)] border-[var(--color-status-medium-border)]',
      icon: '⚠️',
    },
    red: {
      className:
        'bg-[var(--color-status-high-bg)] text-[var(--color-status-high)] border-[var(--color-status-high-border)] animate-pulse',
      icon: '🔴',
    },
    gray: {
      className: 'bg-muted text-muted-foreground border-border',
      icon: null,
    },
  }

  const config = urgencyConfig[status.color]

  // Format countdown text
  const countdownText = compact
    ? `${countdown.years}y ${countdown.months}m`
    : formatRetirementCountdown(countdown)

  return (
    <Badge
      className={cn('gap-1 border', config.className)}
      aria-label={`Retirement in ${formatRetirementCountdown(countdown)} - ${status.label}`}
    >
      {config.icon && (
        <span role="img" aria-hidden="true">
          {config.icon}
        </span>
      )}
      <Clock className="h-3 w-3" aria-hidden="true" />
      <span>{countdownText}</span>
    </Badge>
  )
}
