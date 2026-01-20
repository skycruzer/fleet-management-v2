'use client'

/**
 * Leave Eligibility Indicator Component
 *
 * Displays color-coded eligibility status for leave requests.
 * Shows Red/Yellow/Green status based on availability and conflicts.
 *
 * @spec 001-missing-core-features (US2, T052)
 */

interface LeaveEligibilityIndicatorProps {
  status: 'available' | 'limited' | 'unavailable'
  availablePilots?: number
  minimumRequired?: number
  message?: string
}

export default function LeaveEligibilityIndicator({
  status,
  availablePilots,
  minimumRequired = 10,
  message,
}: LeaveEligibilityIndicatorProps) {
  const statusConfig = {
    available: {
      color: 'bg-[var(--color-status-low-bg)] border-[var(--color-status-low-border)]',
      textColor: 'text-[var(--color-status-low)]',
      icon: '✓',
      label: 'Available',
      defaultMessage: 'Leave request can be approved',
    },
    limited: {
      color: 'bg-[var(--color-status-medium-bg)] border-[var(--color-status-medium-border)]',
      textColor: 'text-[var(--color-status-medium)]',
      icon: '!',
      label: 'Limited Availability',
      defaultMessage: 'Approaching minimum crew requirements',
    },
    unavailable: {
      color: 'bg-[var(--color-status-high-bg)] border-[var(--color-status-high-border)]',
      textColor: 'text-[var(--color-status-high)]',
      icon: '✕',
      label: 'Unavailable',
      defaultMessage: 'Would violate minimum crew requirements',
    },
  }

  const config = statusConfig[status]
  const displayMessage = message || config.defaultMessage

  return (
    <div className={`rounded-lg border-l-4 p-4 ${config.color}`} role="alert" aria-live="polite">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className={`text-2xl ${config.textColor}`}>{config.icon}</span>
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${config.textColor}`}>{config.label}</h3>
          <p className={`mt-1 text-sm ${config.textColor}`}>{displayMessage}</p>
          {typeof availablePilots === 'number' && (
            <p className={`mt-2 text-xs ${config.textColor}`}>
              Available pilots: <strong>{availablePilots}</strong> (Minimum required:{' '}
              <strong>{minimumRequired}</strong>)
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Compact version for inline display
 */
export function LeaveEligibilityBadge({
  status,
}: {
  status: 'available' | 'limited' | 'unavailable'
}) {
  const badgeConfig = {
    available: {
      color: 'bg-[var(--color-status-low-bg)] text-[var(--color-status-low)]',
      icon: '●',
      label: 'Available',
    },
    limited: {
      color: 'bg-[var(--color-status-medium-bg)] text-[var(--color-status-medium)]',
      icon: '●',
      label: 'Limited',
    },
    unavailable: {
      color: 'bg-[var(--color-status-high-bg)] text-[var(--color-status-high)]',
      icon: '●',
      label: 'Unavailable',
    },
  }

  const config = badgeConfig[status]

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}
    >
      <span className="text-sm">{config.icon}</span>
      {config.label}
    </span>
  )
}
