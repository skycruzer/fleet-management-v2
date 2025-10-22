'use client'

/**
 * Disciplinary Timeline Component
 *
 * Display chronological timeline of disciplinary actions.
 *
 * @spec 001-missing-core-features (US6, T100)
 */

import type { DisciplinaryActionWithRelations } from '@/lib/services/disciplinary-service'

interface DisciplinaryTimelineProps {
  actions: DisciplinaryActionWithRelations[]
}

export default function DisciplinaryTimeline({ actions }: DisciplinaryTimelineProps) {
  // Group actions by date
  const groupedActions = actions.reduce((groups, action) => {
    const date = action.action_date
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(action)
    return groups
  }, {} as Record<string, DisciplinaryActionWithRelations[]>)

  // Sort dates in descending order (most recent first)
  const sortedDates = Object.keys(groupedActions).sort((a, b) => b.localeCompare(a))

  const getActionTypeIcon = (actionType: string) => {
    switch (actionType) {
      case 'VERBAL_WARNING':
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        )
      case 'WRITTEN_WARNING':
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      case 'SUSPENSION':
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        )
      case 'DEMOTION':
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )
      case 'TERMINATION':
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
      case 'REMEDIAL_TRAINING':
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        )
      case 'COUNSELING':
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
          </svg>
        )
      case 'MONITORING':
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )
      default:
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        )
    }
  }

  const getActionTypeColor = (actionType: string) => {
    switch (actionType) {
      case 'VERBAL_WARNING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'WRITTEN_WARNING':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      case 'SUSPENSION':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'DEMOTION':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'TERMINATION':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'REMEDIAL_TRAINING':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'COUNSELING':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      case 'MONITORING':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  if (actions.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500 dark:text-gray-400">
        No actions recorded yet
      </div>
    )
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {sortedDates.map((date, dateIdx) => {
          const dateActions = groupedActions[date]
          return (
            <li key={date}>
              {/* Date Header */}
              <div className="mb-4 flex items-center gap-2">
                <div className="flex-shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                    <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {new Date(date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h3>
              </div>

              {/* Actions for this date */}
              <ul className="ml-4 space-y-6 border-l-2 border-gray-200 pl-6 dark:border-gray-700">
                {dateActions.map((action, actionIdx) => (
                  <li key={action.id} className="relative">
                    {/* Timeline dot */}
                    <div className="absolute -left-[33px] flex h-8 w-8 items-center justify-center rounded-full bg-white ring-4 ring-white dark:bg-gray-800 dark:ring-gray-800">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${getActionTypeColor(action.action_type)}`}
                      >
                        {getActionTypeIcon(action.action_type)}
                      </div>
                    </div>

                    {/* Action Content */}
                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                      <div className="mb-2 flex items-start justify-between">
                        <div className="flex-1">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getActionTypeColor(action.action_type)}`}>
                            {action.action_type.replace(/_/g, ' ')}
                          </span>
                          {action.status && (
                            <span className={`ml-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadgeColor(action.status)}`}>
                              {action.status}
                            </span>
                          )}
                        </div>
                        {action.action_time && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {action.action_time}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="mb-3 text-sm text-gray-900 dark:text-white">{action.description}</p>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 gap-2 text-xs md:grid-cols-2">
                        {action.issued_by_user && (
                          <div>
                            <span className="font-medium text-gray-600 dark:text-gray-400">Issued by:</span>{' '}
                            <span className="text-gray-900 dark:text-white">
                              {action.issued_by_user.full_name || action.issued_by_user.email}
                            </span>
                          </div>
                        )}
                        {action.location && (
                          <div>
                            <span className="font-medium text-gray-600 dark:text-gray-400">Location:</span>{' '}
                            <span className="text-gray-900 dark:text-white">{action.location}</span>
                          </div>
                        )}
                        {action.warning_level && (
                          <div>
                            <span className="font-medium text-gray-600 dark:text-gray-400">Warning Level:</span>{' '}
                            <span className="text-gray-900 dark:text-white">{action.warning_level}</span>
                          </div>
                        )}
                        {action.suspension_days && (
                          <div>
                            <span className="font-medium text-gray-600 dark:text-gray-400">Suspension Days:</span>{' '}
                            <span className="text-gray-900 dark:text-white">{action.suspension_days}</span>
                          </div>
                        )}
                        {action.effective_date && (
                          <div>
                            <span className="font-medium text-gray-600 dark:text-gray-400">Effective:</span>{' '}
                            <span className="text-gray-900 dark:text-white">
                              {new Date(action.effective_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {action.expiry_date && (
                          <div>
                            <span className="font-medium text-gray-600 dark:text-gray-400">Expiry:</span>{' '}
                            <span className="text-gray-900 dark:text-white">
                              {new Date(action.expiry_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {action.appeal_deadline && (
                          <div>
                            <span className="font-medium text-gray-600 dark:text-gray-400">Appeal Deadline:</span>{' '}
                            <span className="text-gray-900 dark:text-white">
                              {new Date(action.appeal_deadline).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {action.acknowledged_by_pilot !== null && (
                          <div>
                            <span className="font-medium text-gray-600 dark:text-gray-400">Pilot Acknowledged:</span>{' '}
                            <span className="text-gray-900 dark:text-white">
                              {action.acknowledged_by_pilot ? 'Yes' : 'No'}
                              {action.acknowledgment_date && ` (${new Date(action.acknowledgment_date).toLocaleDateString()})`}
                            </span>
                          </div>
                        )}
                        {action.follow_up_required && action.follow_up_date && (
                          <div>
                            <span className="font-medium text-gray-600 dark:text-gray-400">Follow-up Required:</span>{' '}
                            <span className="text-gray-900 dark:text-white">
                              {new Date(action.follow_up_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Notes */}
                      {action.action_notes && (
                        <div className="mt-3 rounded-md bg-gray-50 p-2 dark:bg-gray-900/50">
                          <p className="text-xs text-gray-700 dark:text-gray-300">{action.action_notes}</p>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
