/**
 * Shared Status & Date Helpers
 * Developer: Maurice Rondeau
 *
 * Centralizes status/date logic that was duplicated across:
 * - Certification pages (admin + pilot)
 * - Request pages
 * - Dashboard components
 * - Pilot overview tab
 */

import { differenceInDays, format, formatDistanceToNow, parseISO } from 'date-fns'

// ============================================================================
// Certification Status
// ============================================================================

export type CertificationStatusType = 'expired' | 'critical' | 'warning' | 'current'

/**
 * Determine certification status based on expiry date.
 * Red: Expired (days < 0)
 * Yellow: Expiring (days ≤ 30)
 * Green: Current (days > 30)
 */
export function getCertificationStatus(expiryDate: string | null): CertificationStatusType {
  if (!expiryDate) return 'current'

  const days = getDaysRemaining(expiryDate)

  if (days < 0) return 'expired'
  if (days <= 7) return 'critical'
  if (days <= 30) return 'warning'
  return 'current'
}

export function getDaysRemaining(expiryDate: string): number {
  return differenceInDays(parseISO(expiryDate), new Date())
}

// ============================================================================
// Status Colors & Badge Variants
// ============================================================================

export function getStatusColor(status: string): string {
  const lower = status.toLowerCase()

  switch (lower) {
    case 'expired':
    case 'rejected':
    case 'cancelled':
    case 'critical':
      return 'text-[var(--color-status-high)]'
    case 'expiring':
    case 'warning':
    case 'pending':
      return 'text-[var(--color-status-medium)]'
    case 'current':
    case 'approved':
    case 'completed':
    case 'active':
      return 'text-[var(--color-status-low)]'
    default:
      return 'text-muted-foreground'
  }
}

export function getStatusBadgeVariant(
  status: string
): 'destructive' | 'warning' | 'success' | 'outline' {
  const lower = status.toLowerCase()

  switch (lower) {
    case 'expired':
    case 'rejected':
    case 'cancelled':
    case 'critical':
      return 'destructive'
    case 'expiring':
    case 'warning':
    case 'pending':
      return 'warning'
    case 'current':
    case 'approved':
    case 'completed':
    case 'active':
      return 'success'
    default:
      return 'outline'
  }
}

export function getStatusDotColor(status: string): string {
  const lower = status.toLowerCase()

  switch (lower) {
    case 'expired':
    case 'rejected':
    case 'cancelled':
    case 'critical':
      return 'bg-[var(--color-status-high)]'
    case 'expiring':
    case 'warning':
    case 'pending':
      return 'bg-[var(--color-status-medium)]'
    case 'current':
    case 'approved':
    case 'completed':
    case 'active':
      return 'bg-[var(--color-status-low)]'
    default:
      return 'bg-[var(--color-slate-400)]'
  }
}

// ============================================================================
// Date Formatting
// ============================================================================

/**
 * Format a date string to a readable format.
 * Returns "—" for null/undefined dates.
 */
export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  try {
    return format(parseISO(date), 'dd MMM yyyy')
  } catch {
    return '—'
  }
}

/**
 * Format a date string to a short format (e.g., "Jan 28").
 */
export function formatDateShort(date: string | null | undefined): string {
  if (!date) return '—'
  try {
    return format(parseISO(date), 'MMM d')
  } catch {
    return '—'
  }
}

/**
 * Format a date as relative (e.g., "3 days ago", "in 2 weeks").
 */
export function formatRelativeDate(date: string | null | undefined): string {
  if (!date) return '—'
  try {
    return formatDistanceToNow(parseISO(date), { addSuffix: true })
  } catch {
    return '—'
  }
}
