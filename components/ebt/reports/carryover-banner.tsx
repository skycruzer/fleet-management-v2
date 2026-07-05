'use client'
import { useState, useTransition } from 'react'
import { acknowledgeCarryover } from '@/app/dashboard/ebt/reports/report-actions'

export interface CarryoverItem {
  competency_code: string
  previous_grade: number
  previous_module_no: number | null
  acknowledged_at: string | null
}

export function CarryoverBanner({
  reportId,
  items,
  pilotName,
  locked,
}: {
  reportId: string
  items: CarryoverItem[]
  pilotName: string | null
  locked: boolean // report already submitted/finalized -> read-only
}) {
  const [pending, startTransition] = useTransition()
  const [ackd, setAckd] = useState(
    items.length > 0 && items.every((i) => i.acknowledged_at != null)
  )
  const [error, setError] = useState<string | null>(null)
  if (items.length === 0) return null
  const moduleNo = items.find((i) => i.previous_module_no != null)?.previous_module_no

  return (
    <div
      style={{
        display: 'flex',
        gap: 13,
        background: '#f7efde',
        border: '1px solid #ecd9b6',
        borderLeft: '4px solid #b3862f',
        borderRadius: 14,
        padding: '15px 18px',
        color: '#7a5a1e',
        fontSize: 13,
        lineHeight: 1.65,
        marginBottom: 18,
      }}
    >
      <div
        style={{
          flex: '0 0 auto',
          width: 22,
          height: 22,
          borderRadius: 7,
          background: '#b3862f',
          color: '#fff',
          display: 'grid',
          placeItems: 'center',
          fontWeight: 800,
          fontSize: 13,
        }}
      >
        !
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>
          {ackd
            ? 'Carryover acknowledged'
            : `Carryover${moduleNo ? ` from Module ${moduleNo}` : ''} — review before grading`}
        </div>
        <p style={{ margin: '0 0 8px' }}>
          {pilotName ?? 'This pilot'} was graded <b>below standard</b> on the previous evaluation. A
          second consecutive ≤2 in the same competency will <b>auto-fail</b> this check and raise
          mandatory remedial training.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {items.map((i) => (
            <span
              key={i.competency_code}
              style={{
                background: '#fff',
                border: '1px solid #ecd9b6',
                borderRadius: 8,
                padding: '3px 10px',
                fontSize: 11.5,
                fontWeight: 600,
                color: '#7a5a1e',
              }}
            >
              {i.competency_code} · prev grade <b>{i.previous_grade}</b>
            </span>
          ))}
        </div>
        {!ackd && !locked && (
          <button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await acknowledgeCarryover(reportId)
                  setAckd(true)
                  setError(null)
                } catch {
                  // acknowledgeCarryover throws on a guard/DB failure; surface it instead of letting the
                  // rejected transition bubble to the error boundary and blank the page.
                  setError('Could not acknowledge the carryover. Please try again.')
                }
              })
            }
            className="rf-btn"
          >
            {pending ? 'Acknowledging…' : 'Acknowledge'}
          </button>
        )}
        {error && (
          <p style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: '#c0392b' }}>{error}</p>
        )}
        {ackd && <p style={{ marginTop: 4, fontSize: 12, fontWeight: 600 }}>Acknowledged ✓</p>}
      </div>
    </div>
  )
}
