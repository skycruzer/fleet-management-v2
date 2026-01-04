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
      className: 'bg-green-100 text-green-800 border-green-300',
      icon: null,
    },
    yellow: {
      className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      icon: null,
    },
    orange: {
      className: 'bg-orange-100 text-orange-800 border-orange-300',
      icon: '⚠️',
    },
    red: {
      className: 'bg-red-100 text-red-800 border-red-300 animate-pulse',
      icon: '🔴',
    },
    gray: {
      className: 'bg-gray-100 text-gray-800 border-gray-300',
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
