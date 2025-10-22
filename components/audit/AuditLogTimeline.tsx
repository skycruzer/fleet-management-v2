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
          <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        )
      case 'UPDATE':
        return (
          <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        )
      case 'DELETE':
        return (
          <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        )
      case 'LOGIN':
        return (
          <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
        )
      case 'LOGOUT':
        return (
          <svg className="h-6 w-6 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        )
      case 'APPROVE':
        return (
          <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'DENY':
        return (
          <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return (
          <svg className="h-6 w-6 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'INSERT':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'DELETE':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'LOGIN':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      case 'LOGOUT':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
      case 'APPROVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'DENY':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
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
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No activity</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">No audit logs to display in timeline view.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {groupedLogs.map(([dateKey, logs]) => (
        <div key={dateKey}>
          {/* Date Header */}
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              {formatDate(logs[0].created_at).date}
            </h3>
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
          </div>

          {/* Timeline Items */}
          <div className="relative ml-6 space-y-6 border-l-2 border-gray-200 pl-8 dark:border-gray-700">
            {logs.map((log, index) => {
              const { time } = formatDate(log.created_at)
              const isHighlighted = highlightRecordId && log.record_id === highlightRecordId

              return (
                <div
                  key={log.id}
                  className={`relative ${isHighlighted ? 'rounded-lg border-2 border-blue-500 bg-blue-50/50 p-4 dark:bg-blue-900/10' : ''}`}
                >
                  {/* Timeline Icon */}
                  <div className="absolute -left-11 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-gray-100 dark:border-gray-900 dark:bg-gray-800">
                    {getActionIcon(log.action)}
                  </div>

                  {/* Timeline Content */}
                  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getActionBadgeColor(log.action)}`}
                          >
                            {log.action}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">{time}</span>
                        </div>

                        <p className="text-sm text-gray-900 dark:text-white">
                          <strong>{log.user_email || 'System'}</strong>
                          {log.description ? ` ${log.description}` : ` performed ${log.action.toLowerCase()} on ${log.table_name}`}
                        </p>

                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                          <span>
                            Table: <code className="rounded bg-gray-100 px-1 py-0.5 dark:bg-gray-900">{log.table_name}</code>
                          </span>
                          {log.record_id && (
                            <span>
                              Record: <code className="rounded bg-gray-100 px-1 py-0.5 dark:bg-gray-900">{log.record_id.slice(0, 8)}...</code>
                            </span>
                          )}
                        </div>
                      </div>

                      <Link
                        href={`/dashboard/audit/${log.id}`}
                        className="flex-shrink-0 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
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
