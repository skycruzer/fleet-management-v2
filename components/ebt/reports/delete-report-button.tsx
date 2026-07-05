'use client'
import { useState, useTransition } from 'react'
import { softDeleteReport } from '@/app/dashboard/ebt/reports/report-actions'

/** Two-step delete control for a report. Rendered only for admins/fleet managers on draft or
 *  submitted reports (the page decides visibility). The inline confirm — rather than a native
 *  confirm() dialog — keeps the destructive step explicit, testable, and automation-friendly.
 *  softDeleteReport redirects on success, so only a failure returns a message to show here. */
export function DeleteReportButton({ reportId }: { reportId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  if (!confirming) {
    return (
      <button type="button" className="rf-btn danger" onClick={() => setConfirming(true)}>
        Delete report
      </button>
    )
  }

  return (
    <span
      className="rf-del-confirm"
      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
    >
      <span>Delete this report?</span>
      <button
        type="button"
        className="rf-btn danger"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null)
            const res = await softDeleteReport(reportId)
            // On success the action redirects to /reports; control only returns here on failure.
            if (res && !res.ok) setError(res.message)
          })
        }
      >
        {pending ? 'Deleting…' : 'Confirm delete'}
      </button>
      <button
        type="button"
        className="rf-btn"
        disabled={pending}
        onClick={() => setConfirming(false)}
      >
        Cancel
      </button>
      {error && (
        <span role="alert" style={{ color: 'var(--ax-red)', fontSize: '13px' }}>
          {error}
        </span>
      )}
    </span>
  )
}
