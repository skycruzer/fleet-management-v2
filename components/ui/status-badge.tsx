import * as React from 'react'
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  Ban,
  Eye,
  FileText,
  type LucideIcon,
} from 'lucide-react'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// ============================================================================
// Status Configuration
// ============================================================================

type StatusColorLevel = 'low' | 'medium' | 'high' | 'info' | 'neutral'

interface StatusConfig {
  label: string
  icon: LucideIcon
  colorLevel: StatusColorLevel
}

/**
 * Canonical status → presentation map for BOTH portals.
 *
 * Color convention (mirrors the unified pilot_requests workflow):
 *   low (green)    = positive terminal state (approved, resolved)
 *   medium (amber) = awaiting action (submitted, pending)
 *   high (red)     = negative terminal state (denied, rejected)
 *   info (blue)    = active process (in review, processing)
 *   neutral (gray) = inert state (draft, withdrawn, cancelled, dismissed)
 */
const STATUS_MAP: Record<string, StatusConfig> = {
  // Unified request workflow (pilot_requests.workflow_status)
  DRAFT: { label: 'Draft', icon: FileText, colorLevel: 'neutral' },
  SUBMITTED: { label: 'Submitted', icon: Clock, colorLevel: 'medium' },
  IN_REVIEW: { label: 'In Review', icon: Eye, colorLevel: 'info' },
  APPROVED: { label: 'Approved', icon: CheckCircle, colorLevel: 'low' },
  DENIED: { label: 'Denied', icon: XCircle, colorLevel: 'high' },
  WITHDRAWN: { label: 'Withdrawn', icon: Ban, colorLevel: 'neutral' },

  // Leave bids / legacy statuses
  PENDING: { label: 'Pending', icon: Clock, colorLevel: 'medium' },
  REJECTED: { label: 'Not Approved', icon: XCircle, colorLevel: 'high' },
  CANCELLED: { label: 'Cancelled', icon: Ban, colorLevel: 'neutral' },

  // Feedback / generic workflow
  PROCESSING: { label: 'Processing', icon: Loader2, colorLevel: 'info' },
  REVIEWED: { label: 'Reviewed', icon: AlertCircle, colorLevel: 'info' },
  RESOLVED: { label: 'Resolved', icon: CheckCircle, colorLevel: 'low' },
  DISMISSED: { label: 'Dismissed', icon: XCircle, colorLevel: 'neutral' },
}

/**
 * Static color-level → class map.
 *
 * IMPORTANT: these must remain full literal strings. Building them via
 * template interpolation breaks Tailwind's static class scanning — the CSS
 * silently disappears once no other file contains the literal.
 */
const COLOR_CLASSES: Record<StatusColorLevel, string> = {
  low: 'border-[var(--color-status-low-border)] bg-[var(--color-status-low-bg)] text-[var(--color-status-low)]',
  medium:
    'border-[var(--color-status-medium-border)] bg-[var(--color-status-medium-bg)] text-[var(--color-status-medium)]',
  high: 'border-[var(--color-status-high-border)] bg-[var(--color-status-high-bg)] text-[var(--color-status-high)]',
  info: 'border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info)]',
  neutral: 'border-transparent bg-muted text-muted-foreground',
}

/**
 * Humanized label for a raw status string (e.g. 'IN_REVIEW' → 'In Review').
 * Falls back to title-casing unknown statuses so raw enums never reach the UI.
 */
export function getStatusLabel(status: string): string {
  const config = STATUS_MAP[status.toUpperCase()]
  if (config) return config.label
  return status
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

// ============================================================================
// StatusBadge Component
// ============================================================================

export interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  /** The status string (e.g. 'SUBMITTED', 'APPROVED', 'DENIED'). Case-insensitive. */
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
 * The canonical status badge for both portals.
 *
 * Maps every workflow status to one humanized label, icon, and token-based
 * color treatment (dark-mode safe). Unknown statuses render as a neutral
 * badge with a title-cased label — raw enums never leak to the UI.
 *
 * @example
 * ```tsx
 * <StatusBadge status="APPROVED" />
 * <StatusBadge status="IN_REVIEW" size="sm" />
 * <StatusBadge status="PROCESSING" animate />
 * <StatusBadge status="DENIED" label="Declined" />
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

  // Unknown status: neutral badge with a humanized label (never raw enums)
  if (!config) {
    return (
      <Badge variant="outline" size={size} className={className} {...props}>
        {label ?? getStatusLabel(status)}
      </Badge>
    )
  }

  const Icon = config.icon
  const displayLabel = label ?? config.label
  const colorClasses = COLOR_CLASSES[config.colorLevel]
  const shouldSpin = animate && normalizedStatus === 'PROCESSING'

  const iconSize = size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'

  return (
    <Badge variant="outline" size={size} className={cn(colorClasses, className)} {...props}>
      {!hideIcon && (
        <Icon className={cn('mr-1', iconSize, shouldSpin && 'animate-spin')} aria-hidden="true" />
      )}
      {displayLabel}
    </Badge>
  )
}

export { StatusBadge, STATUS_MAP }
