'use client'
import { useState, useTransition } from 'react'
import { toggleObservedBehaviour } from '@/app/dashboard/ebt/reports/report-actions'
import { cn } from '@/lib/ebt/cn'

export interface ObOption {
  id: string
  competency_code: string
  code: string
  description: string
}

/** Multi-select of the Observable Behaviours observed for one EVAL competency (§15.3). Shown only
 *  when the competency's grade is 1, 2 or 5 (the parent decides). Optimistic toggle with rollback,
 *  matching ReportLists. */
export function ObSelector({
  reportId,
  code,
  options,
  initialSelected,
  locked,
}: {
  reportId: string
  code: string
  options: ObOption[]
  initialSelected: string[]
  locked: boolean
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected))
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function toggle(obId: string) {
    if (locked) return
    const prev = selected
    const next = new Set(selected)
    if (next.has(obId)) next.delete(obId)
    else next.add(obId)
    setSelected(next)
    setError(null)
    startTransition(async () => {
      const res = await toggleObservedBehaviour(reportId, code, obId)
      if (!res.ok) {
        setSelected(prev)
        setError(res.message || 'Could not save.')
      }
    })
  }

  return (
    <div className="rf-ob" role="group" aria-label={`Observable behaviours for ${code}`}>
      <div className="rf-ob-hd">
        Observable behaviours observed
        {pending && <span style={{ marginLeft: 8, opacity: 0.6 }}>saving…</span>}
      </div>
      {options.map((o) => {
        const on = selected.has(o.id)
        return (
          <label
            key={o.id}
            data-testid={`ob-${code}-${o.code}`}
            data-on={on}
            className={cn('rf-chk', on && 'on')}
            style={locked ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={on}
              disabled={locked}
              onChange={() => toggle(o.id)}
            />
            <span className="rf-cb" aria-hidden="true" />
            <b>{o.code}</b> {o.description}
          </label>
        )
      })}
      {error && (
        <p
          role="alert"
          style={{ marginTop: 6, fontSize: 12, fontWeight: 600, color: 'var(--rf-red, #c0392b)' }}
        >
          {error}
        </p>
      )}
    </div>
  )
}
