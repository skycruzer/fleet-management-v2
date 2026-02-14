/**
 * Audit Log Detail Component
 * Displays old/new value comparison for a single audit log entry
 *
 * @author Maurice Rondeau
 * @version 1.0.0
 */

'use client'

import type { AuditLog } from '@/lib/services/audit-service'

interface AuditLogDetailProps {
  auditLog: AuditLog
}

export default function AuditLogDetail({ auditLog }: AuditLogDetailProps) {
  const hasOldValues = auditLog.old_values && Object.keys(auditLog.old_values).length > 0
  const hasNewValues = auditLog.new_values && Object.keys(auditLog.new_values).length > 0
  const changedFields = auditLog.changed_fields || []

  if (!hasOldValues && !hasNewValues) {
    return (
      <div className="bg-card border-border rounded-lg border p-6 shadow-sm">
        <h2 className="text-foreground mb-4 text-lg font-semibold">Data Changes</h2>
        <p className="text-muted-foreground text-sm">No value changes recorded for this entry.</p>
      </div>
    )
  }

  // Get all unique keys from both old and new values
  const allKeys = Array.from(
    new Set([...Object.keys(auditLog.old_values || {}), ...Object.keys(auditLog.new_values || {})])
  ).sort()

  return (
    <div className="bg-card border-border rounded-lg border p-6 shadow-sm">
      <h2 className="text-foreground mb-4 text-lg font-semibold">Data Changes</h2>

      {changedFields.length > 0 && (
        <div className="mb-4">
          <p className="text-muted-foreground mb-2 text-sm font-medium">Changed Fields:</p>
          <div className="flex flex-wrap gap-2">
            {changedFields.map((field) => (
              <span
                key={field}
                className="rounded-full bg-[var(--color-info-bg)] px-3 py-1 text-xs font-medium text-[var(--color-info)]"
              >
                {field}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-border border-b">
              <th className="text-muted-foreground px-4 py-3 text-left font-medium">Field</th>
              <th className="text-muted-foreground px-4 py-3 text-left font-medium">Old Value</th>
              <th className="text-muted-foreground px-4 py-3 text-left font-medium">New Value</th>
            </tr>
          </thead>
          <tbody>
            {allKeys.map((key) => {
              const oldVal = auditLog.old_values?.[key]
              const newVal = auditLog.new_values?.[key]
              const isChanged =
                changedFields.includes(key) || JSON.stringify(oldVal) !== JSON.stringify(newVal)

              return (
                <tr
                  key={key}
                  className={`border-border/50 border-b ${isChanged ? 'bg-[var(--color-warning-muted)]' : ''}`}
                >
                  <td className="text-foreground px-4 py-3 font-mono text-xs font-medium">{key}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-mono text-xs ${isChanged ? 'text-[var(--color-danger-500)]' : 'text-muted-foreground'}`}
                    >
                      {oldVal !== undefined ? JSON.stringify(oldVal, null, 2) : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-mono text-xs ${isChanged ? 'text-[var(--color-success-500)]' : 'text-muted-foreground'}`}
                    >
                      {newVal !== undefined ? JSON.stringify(newVal, null, 2) : '—'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
