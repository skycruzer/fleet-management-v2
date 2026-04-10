import * as React from 'react'
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  Ban,
  type LucideIcon,
} from 'lucide-react'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// ============================================================================
// Status Configuration
// ============================================================================

type StatusColorLevel = 'low' | 'medium' | 'high' | 'info'

interface StatusConfig {
  label: string
  icon: LucideIcon
  colorLevel: StatusColorLevel
}

const STATUS_MAP: Record<string, StatusConfig> = {
  APPROVED: {
    label: 'Approved',
    icon: CheckCircle,
    colorLevel: 'low',
  },
  RESOLVED: {
    label: 'Resolved',
    icon: CheckCircle,
    colorLevel: 'low',
  },
  PENDING: {
    label: 'Pending',
    icon: Clock,
    colorLevel: 'medium',
  },
  REJECTED: {
    label: 'Rejected',
    icon: XCircle,
    colorLevel: 'high',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: Ban,
    colorLevel: 'high',
  },
  PROCESSING: {
    label: 'Processing',
    icon: Loader2,
    colorLevel: 'info',
  },
  REVIEWED: {
    label: 'Reviewed',
    icon: AlertCircle,
    colorLevel: 'info',
  },
  DISMISSED: {
    label: 'Dismissed',
    icon: XCircle,
    colorLevel: 'high',
  },
}

/**
 * Maps a color level to the corresponding CSS variable class names.
 * Uses the project's existing `--color-status-*` and `--color-info-*` variables.
 */
function getColorClasses(colorLevel: StatusColorLevel): string {
  if (colorLevel === 'info') {
    return 'border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info)]'
  }
  return [
    `border-[var(--color-status-${colorLevel}-border)]`,
    `bg-[var(--color-status-${colorLevel}-bg)]`,
    `text-[var(--color-status-${colorLevel})]`,
  ].join(' ')
}

// ============================================================================
// StatusBadge Component
// ============================================================================

export interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  /** The status string (e.g. 'PENDING', 'APPROVED', 'REJECTED'). Case-insensitive. */
  status: string
  /** Badge size. Defaults to 'default'. */
  size?: 'sm' | 'default'
  /** Override the default label derived from the status. */
  label?: string
  /** Hide the status icon. */
  hideIcon?: boolean
  /** Animate the icon (spins for PROCESSING). */
  animate?: boolean
}

/**
 * A standardized status badge component that maps workflow statuses to
 * consistent color variables, icons, and labels.
 *
 * Supports: PENDING, APPROVED, REJECTED, PROCESSING, RESOLVED, DISMISSED,
 * CANCELLED, and REVIEWED. Unknown statuses render with a neutral outline style.
 *
 * @example
 * ```tsx
 * <StatusBadge status="APPROVED" />
 * <StatusBadge status="PENDING" size="sm" />
 * <StatusBadge status="PROCESSING" animate />
 * <StatusBadge status="REJECTED" label="Not Approved" />
 * ```
 */
function StatusBadge({
  status,
  size = 'default',
  label,
  hideIcon = false,
  animate = false,
  className,
  ...props
}: StatusBadgeProps) {
  const normalizedStatus = status.toUpperCase()
  const config = STATUS_MAP[normalizedStatus]

  // Unknown status: render a neutral outline badge
  if (!config) {
    return (
      <Badge variant="outline" size={size} className={className} {...props}>
        {label ?? status}
      </Badge>
    )
  }

  const Icon = config.icon
  const displayLabel = label ?? config.label
  const colorClasses = getColorClasses(config.colorLevel)
  const shouldSpin = animate && normalizedStatus === 'PROCESSING'

  const iconSize = size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'

  return (
    <Badge variant="outline" size={size} className={cn(colorClasses, className)} {...props}>
      {!hideIcon && <Icon className={cn('mr-1', iconSize, shouldSpin && 'animate-spin')} />}
      {displayLabel}
    </Badge>
  )
}

export { StatusBadge, STATUS_MAP }
