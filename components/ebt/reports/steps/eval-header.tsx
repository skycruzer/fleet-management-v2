'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAutosave } from '@/lib/ebt/reports/use-autosave'
import { useFlowSave } from '@/components/ebt/reports/capture-flow'
import { saveReportSetup } from '@/app/dashboard/ebt/reports/report-actions'
import { cn } from '@/lib/ebt/cn'

interface Props {
  reportId: string
  initial: { is_resit: boolean; module_no: number | null }
  locked: boolean
}

export function EvalHeader({ reportId, initial, locked }: Props) {
  const [isResit, setIsResit] = useState<boolean>(initial.is_resit)
  const [moduleNo, setModuleNo] = useState<number | null>(initial.module_no)
  const [moduleRaw, setModuleRaw] = useState<string>(
    initial.module_no != null ? String(initial.module_no) : ''
  )
  const [moduleError, setModuleError] = useState<string | null>(null)

  const flowSave = useFlowSave()

  const saveFn = useCallback(
    (patch: Parameters<typeof saveReportSetup>[1]) => saveReportSetup(reportId, patch),
    [reportId]
  )

  const autosave = useAutosave<Parameters<typeof saveReportSetup>[1]>(saveFn, { debounceMs: 600 })

  useEffect(() => {
    flowSave(autosave.state, autosave.message)
  }, [autosave.state, autosave.message, flowSave])

  function handleResitChange(value: boolean) {
    setIsResit(value)
    void autosave.saveNow({ is_resit: value })
  }

  function handleModuleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    setModuleRaw(raw)
    if (raw === '') {
      setModuleError(null)
      setModuleNo(null)
      autosave.schedule({ module_no: null })
      return
    }
    const n = Number.parseInt(raw, 10)
    if (!Number.isInteger(n) || n < 1 || n > 6) {
      setModuleError('Module must be between 1 and 6.')
      return
    }
    setModuleError(null)
    setModuleNo(n)
    autosave.schedule({ module_no: n })
  }

  return (
    <div className="rf-grid2 rf-blockgap">
      {/* IS THIS A RESIT? */}
      <div className="rf-field">
        <label className="rf-lbl">Is this a resit?</label>
        <div className="rf-radios inline" role="radiogroup" aria-label="Is this a resit?">
          <label className={cn('rf-radio', isResit && 'sel')}>
            <input
              type="radio"
              className="sr-only"
              name={`resit-${reportId}`}
              checked={isResit}
              disabled={locked}
              onChange={() => handleResitChange(true)}
            />
            <span className="rf-rb" aria-hidden="true" />
            <span className="rf-rt">YES</span>
          </label>
          <label className={cn('rf-radio', !isResit && 'sel')}>
            <input
              type="radio"
              className="sr-only"
              name={`resit-${reportId}`}
              checked={!isResit}
              disabled={locked}
              onChange={() => handleResitChange(false)}
            />
            <span className="rf-rb" aria-hidden="true" />
            <span className="rf-rt">NO</span>
          </label>
        </div>
      </div>

      {/* MODULE */}
      <div className="rf-field">
        <label className="rf-lbl" htmlFor="eval-module-no">
          Module
        </label>
        <input
          id="eval-module-no"
          className="rf-ctl"
          type="number"
          min={1}
          max={6}
          value={moduleRaw}
          onChange={handleModuleChange}
          disabled={locked}
          placeholder="1–6"
          style={{ maxWidth: 130 }}
        />
        {moduleError && <p className="mt-1 text-xs text-red-600">{moduleError}</p>}
      </div>
    </div>
  )
}
