'use client'
import { useState, useTransition } from 'react'
import { setReportLists } from '@/app/dashboard/ebt/reports/report-actions'
import { cn } from '@/lib/ebt/cn'

interface Item {
  id: string
  code: string
  name: string
}

export function ReportLists({
  reportId,
  kind,
  title,
  options,
  initialSelected,
  locked,
}: {
  reportId: string
  kind: 'qualifications' | 'specialised'
  title: string
  options: Item[]
  initialSelected: string[]
  locked: boolean
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected))
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function toggle(id: string) {
    if (locked) return
    const prev = selected // capture for rollback if the save is rejected
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
    setError(null)
    startTransition(async () => {
      try {
        await setReportLists(reportId, kind, [...next])
      } catch {
        // setReportLists throws on a guard/DB failure; undo the optimistic toggle and surface it
        // rather than letting the rejected transition bubble to the error boundary.
        setSelected(prev)
        setError('Could not save — please try again.')
      }
    })
  }

  return (
    <div>
      <label className="rf-lbl">
        {title}
        {pending && (
          <span
            style={{
              marginLeft: 8,
              fontWeight: 400,
              opacity: 0.6,
              textTransform: 'none',
              letterSpacing: 0,
            }}
          >
            saving…
          </span>
        )}
      </label>
      <div>
        {options.map((o) => {
          const on = selected.has(o.id)
          return (
            <label
              key={o.id}
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
              {o.name}
            </label>
          )
        })}
      </div>
      {error && (
        <p
          role="alert"
          style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: 'var(--rf-red, #c0392b)' }}
        >
          {error}
        </p>
      )}
    </div>
  )
}
