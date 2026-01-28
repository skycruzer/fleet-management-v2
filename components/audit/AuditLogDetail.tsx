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
  old_values: any
  new_values: any
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
  const oldValues = auditLog.old_values || {}
  const newValues = auditLog.new_values || {}

  // Get all unique keys from both objects
  const allKeys = Array.from(new Set([...Object.keys(oldValues), ...Object.keys(newValues)])).sort()

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
        <div className="rounded-lg bg-white/[0.03] p-6 text-center">
          <p className="text-muted-foreground">
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
            <div key={key} className="border-border bg-card rounded-lg border p-4">
              <h3 className="text-foreground mb-3 font-semibold">
                <code className="bg-muted rounded px-2 py-1 text-sm">{key}</code>
              </h3>

              {isMultiline ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase">
                      Old Value
                    </p>
                    <pre className="overflow-x-auto rounded-md bg-[var(--color-status-high-bg)] p-3 text-sm text-[var(--color-status-high)]">
                      {oldVal || '(empty)'}
                    </pre>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase">
                      New Value
                    </p>
                    <pre className="overflow-x-auto rounded-md bg-[var(--color-status-low-bg)] p-3 text-sm text-[var(--color-status-low)]">
                      {newVal || '(empty)'}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex-1 overflow-hidden">
                    <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wider uppercase">
                      Old
                    </p>
                    <code className="block truncate rounded-md bg-[var(--color-status-high-bg)] px-3 py-2 text-sm text-[var(--color-status-high)]">
                      {oldVal || '(empty)'}
                    </code>
                  </div>
                  <svg
                    className="text-muted-foreground h-6 w-6 flex-shrink-0"
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
                    <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wider uppercase">
                      New
                    </p>
                    <code className="block truncate rounded-md bg-[var(--color-status-low-bg)] px-3 py-2 text-sm text-[var(--color-status-low)]">
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
        <div className="border-border bg-card rounded-lg border p-4">
          <h3 className="text-foreground mb-3 font-semibold">Old Values</h3>
          {Object.keys(oldValues).length === 0 ? (
            <p className="text-muted-foreground text-sm">No previous values</p>
          ) : (
            <pre className="bg-muted overflow-x-auto rounded-md p-3 text-xs">
              {JSON.stringify(oldValues, null, 2)}
            </pre>
          )}
        </div>

        {/* New Values */}
        <div className="border-border bg-card rounded-lg border p-4">
          <h3 className="text-foreground mb-3 font-semibold">New Values</h3>
          {Object.keys(newValues).length === 0 ? (
            <p className="text-muted-foreground text-sm">No new values</p>
          ) : (
            <pre className="bg-muted overflow-x-auto rounded-md p-3 text-xs">
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
        <div className="border-border bg-card rounded-lg border p-4">
          <h3 className="text-foreground mb-3 font-semibold">Old Values (Raw JSON)</h3>
          <pre className="bg-muted overflow-x-auto rounded-md p-4 text-xs">
            {JSON.stringify(oldValues, null, 2)}
          </pre>
        </div>
        <div className="border-border bg-card rounded-lg border p-4">
          <h3 className="text-foreground mb-3 font-semibold">New Values (Raw JSON)</h3>
          <pre className="bg-muted overflow-x-auto rounded-md p-4 text-xs">
            {JSON.stringify(newValues, null, 2)}
          </pre>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* View Mode Selector */}
      <div className="border-border bg-card flex items-center justify-between rounded-lg border px-6 py-4">
        <h2 className="text-foreground text-lg font-semibold">Data Changes</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('diff')}
            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              viewMode === 'diff'
                ? 'bg-[var(--color-info)] text-white'
                : 'bg-muted text-foreground hover:bg-muted/80'
            }`}
          >
            Diff View
          </button>
          <button
            onClick={() => setViewMode('side-by-side')}
            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              viewMode === 'side-by-side'
                ? 'bg-[var(--color-info)] text-white'
                : 'bg-muted text-foreground hover:bg-muted/80'
            }`}
          >
            Side by Side
          </button>
          <button
            onClick={() => setViewMode('raw')}
            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              viewMode === 'raw'
                ? 'bg-[var(--color-info)] text-white'
                : 'bg-muted text-foreground hover:bg-muted/80'
            }`}
          >
            Raw JSON
          </button>
        </div>
      </div>

      {/* Summary Badge */}
      {hasChanges && viewMode === 'diff' && (
        <div className="rounded-lg border border-[var(--color-info-border)] bg-[var(--color-info-bg)] px-4 py-3">
          <p className="text-sm text-[var(--color-info)]">
            <strong>{changedFields.length}</strong> field{changedFields.length !== 1 ? 's' : ''}{' '}
            changed
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
