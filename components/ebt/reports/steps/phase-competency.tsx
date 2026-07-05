'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAutosave } from '@/lib/ebt/reports/use-autosave'
import { useFlowSave } from '@/components/ebt/reports/capture-flow'
import { setPhaseCompetencies } from '@/app/dashboard/ebt/reports/report-actions'
import { cn } from '@/lib/ebt/cn'

interface Competency {
  code: string
  display_name: string
}

interface Props {
  reportId: string
  phase: 'MV' | 'SBT'
  competencies: Competency[]
  initialCodes: string[]
  locked: boolean
}

export function PhaseCompetency({ reportId, phase, competencies, initialCodes, locked }: Props) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initialCodes))

  const flowSave = useFlowSave()

  const saveFn = useCallback(
    (codes: string[]) => setPhaseCompetencies(reportId, phase, codes),
    [reportId, phase]
  )

  const autosave = useAutosave<string[]>(saveFn, { debounceMs: 600 })

  useEffect(() => {
    flowSave(autosave.state, autosave.message)
  }, [autosave.state, autosave.message, flowSave])

  function handleToggle(code: string) {
    if (locked) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(code)) {
        next.delete(code)
      } else {
        next.add(code)
      }
      const nextCodes = Array.from(next)
      void autosave.saveNow(nextCodes)
      return next
    })
  }

  return (
    <div>
      <label className="rf-lbl">
        Competency <span className="rf-picker-hint">— choose any of the 9</span>
      </label>
      <div className="rf-checks">
        {competencies.map((c) => (
          <label
            key={c.code}
            className={cn('rf-chk', selected.has(c.code) && 'on')}
            style={locked ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={selected.has(c.code)}
              disabled={locked}
              onChange={() => handleToggle(c.code)}
            />
            <span className="rf-cb" aria-hidden="true" />
            <span className="rf-cc">{c.code}</span> {c.display_name}
          </label>
        ))}
      </div>
    </div>
  )
}
