'use client'

/**
 * Audit Log Detail Component
 *
 * Displays old/new value comparison with diff highlighting.
 *
 * @spec 001-missing-core-features (US4, T076)
 */

import { useState } from 'react'

interface AuditLog {
  id: string
  user_id: string | null
  user_email: string | null
  action: string
  table_name: string
  record_id: string | null
  old_data: any
  new_data: any
  description: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

interface AuditLogDetailProps {
  auditLog: AuditLog
}

export default function AuditLogDetail({ auditLog }: AuditLogDetailProps) {
  const [viewMode, setViewMode] = useState<'diff' | 'side-by-side' | 'raw'>('diff')

  // Parse JSON values safely
  const oldValues = auditLog.old_data || {}
  const newValues = auditLog.new_data || {}

  // Get all unique keys from both objects
  const allKeys = Array.from(
    new Set([...Object.keys(oldValues), ...Object.keys(newValues)])
  ).sort()

  // Determine which fields changed
  const changedFields = allKeys.filter((key) => {
    const oldVal = JSON.stringify(oldValues[key])
    const newVal = JSON.stringify(newValues[key])
    return oldVal !== newVal
  })

  const hasChanges = changedFields.length > 0

  // Format value for display
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) {
      return 'null'
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2)
    }
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false'
    }
    return String(value)
  }

  // Render diff view (changed fields only)
  const renderDiffView = () => {
    if (!hasChanges) {
      return (
        <div className="rounded-lg bg-gray-50 p-6 text-center dark:bg-gray-700/50">
          <p className="text-gray-600 dark:text-gray-400">
            {auditLog.action === 'INSERT'
              ? 'New record created - no previous values'
              : auditLog.action === 'DELETE'
                ? 'Record deleted - no new values'
                : 'No changes detected'}
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {changedFields.map((key) => {
          const oldVal = formatValue(oldValues[key])
          const newVal = formatValue(newValues[key])
          const isMultiline = oldVal.includes('\n') || newVal.includes('\n')

          return (
            <div key={key} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">
                <code className="rounded bg-gray-100 px-2 py-1 text-sm dark:bg-gray-900">
                  {key}
                </code>
              </h3>

              {isMultiline ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">
                      Old Value
                    </p>
                    <pre className="overflow-x-auto rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
                      {oldVal || '(empty)'}
                    </pre>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">
                      New Value
                    </p>
                    <pre className="overflow-x-auto rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-200">
                      {newVal || '(empty)'}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex-1 overflow-hidden">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">
                      Old
                    </p>
                    <code className="block truncate rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
                      {oldVal || '(empty)'}
                    </code>
                  </div>
                  <svg
                    className="h-6 w-6 flex-shrink-0 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                  <div className="flex-1 overflow-hidden">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">
                      New
                    </p>
                    <code className="block truncate rounded-md bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-200">
                      {newVal || '(empty)'}
                    </code>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // Render side-by-side view (all fields)
  const renderSideBySideView = () => {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Old Values */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">Old Values</h3>
          {Object.keys(oldValues).length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">No previous values</p>
          ) : (
            <pre className="overflow-x-auto rounded-md bg-gray-50 p-3 text-xs dark:bg-gray-900">
              {JSON.stringify(oldValues, null, 2)}
            </pre>
          )}
        </div>

        {/* New Values */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">New Values</h3>
          {Object.keys(newValues).length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">No new values</p>
          ) : (
            <pre className="overflow-x-auto rounded-md bg-gray-50 p-3 text-xs dark:bg-gray-900">
              {JSON.stringify(newValues, null, 2)}
            </pre>
          )}
        </div>
      </div>
    )
  }

  // Render raw JSON view
  const renderRawView = () => {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">Old Values (Raw JSON)</h3>
          <pre className="overflow-x-auto rounded-md bg-gray-50 p-4 text-xs dark:bg-gray-900">
            {JSON.stringify(oldValues, null, 2)}
          </pre>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">New Values (Raw JSON)</h3>
          <pre className="overflow-x-auto rounded-md bg-gray-50 p-4 text-xs dark:bg-gray-900">
            {JSON.stringify(newValues, null, 2)}
          </pre>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* View Mode Selector */}
      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Data Changes</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('diff')}
            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              viewMode === 'diff'
                ? 'bg-blue-600 text-white dark:bg-blue-500'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Diff View
          </button>
          <button
            onClick={() => setViewMode('side-by-side')}
            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              viewMode === 'side-by-side'
                ? 'bg-blue-600 text-white dark:bg-blue-500'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Side by Side
          </button>
          <button
            onClick={() => setViewMode('raw')}
            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              viewMode === 'raw'
                ? 'bg-blue-600 text-white dark:bg-blue-500'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Raw JSON
          </button>
        </div>
      </div>

      {/* Summary Badge */}
      {hasChanges && viewMode === 'diff' && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-900/50 dark:bg-blue-900/20">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>{changedFields.length}</strong> field{changedFields.length !== 1 ? 's' : ''} changed
          </p>
        </div>
      )}

      {/* Content Based on View Mode */}
      {viewMode === 'diff' && renderDiffView()}
      {viewMode === 'side-by-side' && renderSideBySideView()}
      {viewMode === 'raw' && renderRawView()}
    </div>
  )
}
