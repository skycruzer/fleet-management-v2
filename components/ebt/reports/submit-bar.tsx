'use client'
import { useState, useTransition } from 'react'
import { submitReport, returnToDraft } from '@/app/dashboard/ebt/reports/report-actions'
import { statusLabel } from '@/lib/ebt/reports/format'

export function SubmitBar({ reportId, status }: { reportId: string; status: string }) {
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)
  const isDraft = status === 'draft'
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        marginTop: 18,
        padding: '14px 16px',
        borderRadius: 14,
        border: '1px solid var(--rf-line, #ece7e0)',
        background: 'var(--rf-surface, #fff)',
        boxShadow: 'var(--rf-sh-1, 0 1px 2px rgba(27,20,32,.05))',
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--rf-muted, #6f6776)',
          background: 'var(--rf-bg-2, #f1ebe2)',
          border: '1px solid var(--rf-line, #ece7e0)',
          borderRadius: 999,
          padding: '4px 10px',
        }}
      >
        Status · {statusLabel(status)}
      </span>
      {msg && (
        <span role="alert" style={{ fontSize: 13, color: 'var(--rf-red, #c0392b)' }}>
          {msg}
        </span>
      )}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
        {isDraft ? (
          <button
            disabled={pending}
            className="rf-btn primary"
            onClick={() =>
              start(async () => {
                const r = await submitReport(reportId)
                setMsg(r.ok ? null : r.message)
              })
            }
          >
            {pending ? 'Submitting…' : 'Submit report'}
          </button>
        ) : status === 'submitted' ? (
          <button
            disabled={pending}
            className="rf-btn"
            onClick={() =>
              start(async () => {
                const r = await returnToDraft(reportId)
                setMsg(r.ok ? null : r.message)
              })
            }
          >
            {pending ? 'Reopening…' : 'Return to draft'}
          </button>
        ) : null}
      </div>
    </div>
  )
}
