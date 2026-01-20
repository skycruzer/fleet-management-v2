'use client'

/**
 * Audit Log Timeline Component
 *
 * Displays audit logs in a chronological timeline view.
 * Useful for visualizing the history of changes to a specific record.
 *
 * @spec 001-missing-core-features (US4, T077)
 */

import Link from 'next/link'

interface AuditLog {
  id: string
  user_id: string | null
  user_email: string | null
  action: string
  table_name: string
  record_id: string | null
  old_values: any
  new_values: any
  description: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

interface AuditLogTimelineProps {
  logs: AuditLog[]
  highlightRecordId?: string
}

export default function AuditLogTimeline({ logs, highlightRecordId }: AuditLogTimelineProps) {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'INSERT':
        return (
          <svg
            className="h-6 w-6 text-[var(--color-status-low)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        )
      case 'UPDATE':
        return (
          <svg
            className="h-6 w-6 text-[var(--color-info)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        )
      case 'DELETE':
        return (
          <svg
            className="h-6 w-6 text-[var(--color-status-high)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        )
      case 'LOGIN':
        return (
          <svg
            className="text-primary dark:text-primary h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
            />
          </svg>
        )
      case 'LOGOUT':
        return (
          <svg
            className="text-muted-foreground h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        )
      case 'APPROVE':
        return (
          <svg
            className="h-6 w-6 text-[var(--color-status-low)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )
      case 'DENY':
        return (
          <svg
            className="h-6 w-6 text-[var(--color-status-high)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )
      default:
        return (
          <svg
            className="text-muted-foreground h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )
    }
  }

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'INSERT':
        return 'bg-[var(--color-status-low-bg)] text-[var(--color-status-low)]'
      case 'UPDATE':
        return 'bg-[var(--color-info-bg)] text-[var(--color-info)]'
      case 'DELETE':
        return 'bg-[var(--color-status-high-bg)] text-[var(--color-status-high)]'
      case 'LOGIN':
        return 'bg-[var(--color-category-simulator-bg)] text-[var(--color-category-simulator)]'
      case 'LOGOUT':
        return 'bg-muted text-muted-foreground'
      case 'APPROVE':
        return 'bg-[var(--color-status-low-bg)] text-[var(--color-status-low)]'
      case 'DENY':
        return 'bg-[var(--color-status-high-bg)] text-[var(--color-status-high)]'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    }
  }

  const groupLogsByDate = () => {
    const groups: { [key: string]: AuditLog[] } = {}

    logs.forEach((log) => {
      const dateKey = new Date(log.created_at).toDateString()
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(log)
    })

    return Object.entries(groups).sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
  }

  const groupedLogs = groupLogsByDate()

  if (logs.length === 0) {
    return (
      <div className="border-border bg-card rounded-lg border p-8 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="text-foreground mt-2 text-lg font-medium">No activity</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          No audit logs to display in timeline view.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {groupedLogs.map(([dateKey, logs]) => (
        <div key={dateKey}>
          {/* Date Header */}
          <div className="mb-4 flex items-center gap-3">
            <div className="bg-border h-px flex-1" />
            <h3 className="text-muted-foreground text-sm font-semibold">
              {formatDate(logs[0].created_at).date}
            </h3>
            <div className="bg-border h-px flex-1" />
          </div>

          {/* Timeline Items */}
          <div className="border-border relative ml-6 space-y-6 border-l-2 pl-8">
            {logs.map((log) => {
              const { time } = formatDate(log.created_at)
              const isHighlighted = highlightRecordId && log.record_id === highlightRecordId

              return (
                <div
                  key={log.id}
                  className={`relative ${isHighlighted ? 'rounded-lg border-2 border-[var(--color-info-border)] bg-[var(--color-info-bg)] p-4' : ''}`}
                >
                  {/* Timeline Icon */}
                  <div className="border-background bg-muted absolute -left-11 flex h-10 w-10 items-center justify-center rounded-full border-4">
                    {getActionIcon(log.action)}
                  </div>

                  {/* Timeline Content */}
                  <div className="border-border bg-card rounded-lg border p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getActionBadgeColor(log.action)}`}
                          >
                            {log.action}
                          </span>
                          <span className="text-muted-foreground text-sm">{time}</span>
                        </div>

                        <p className="text-foreground text-sm">
                          <strong>{log.user_email || 'System'}</strong>
                          {log.description
                            ? ` ${log.description}`
                            : ` performed ${log.action.toLowerCase()} on ${log.table_name}`}
                        </p>

                        <div className="text-muted-foreground mt-2 flex items-center gap-4 text-xs">
                          <span>
                            Table:{' '}
                            <code className="bg-muted rounded px-1 py-0.5">{log.table_name}</code>
                          </span>
                          {log.record_id && (
                            <span>
                              Record:{' '}
                              <code className="bg-muted rounded px-1 py-0.5">
                                {log.record_id.slice(0, 8)}...
                              </code>
                            </span>
                          )}
                        </div>
                      </div>

                      <Link
                        href={`/dashboard/audit/${log.id}`}
                        className="flex-shrink-0 text-sm font-medium text-[var(--color-info)] hover:text-[var(--color-info)]/80"
                      >
                        Details →
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
