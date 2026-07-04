'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAutosave } from '@/lib/ebt/reports/use-autosave'
import { useFlowSave } from '@/components/ebt/reports/capture-flow'
import { saveReportSetup } from '@/app/dashboard/ebt/reports/report-actions'

interface CheckType {
  id: string
  code: string
  name: string
}

interface Props {
  reportId: string
  checkTypes: CheckType[]
  initial: { check_type_id: string | null; training_date: string | null }
  locked: boolean
}

export function ReportHeader({ reportId, checkTypes, initial, locked }: Props) {
  const [checkTypeId, setCheckTypeId] = useState<string | null>(initial.check_type_id)
  const [trainingDate, setTrainingDate] = useState<string | null>(initial.training_date)

  const flowSave = useFlowSave()

  const saveFn = useCallback(
    (patch: Parameters<typeof saveReportSetup>[1]) => saveReportSetup(reportId, patch),
    [reportId]
  )

  const autosave = useAutosave<Parameters<typeof saveReportSetup>[1]>(saveFn, { debounceMs: 600 })

  useEffect(() => {
    flowSave(autosave.state, autosave.message)
  }, [autosave.state, autosave.message, flowSave])

  function handleCheckTypeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value === '__none__' ? null : e.target.value || null
    setCheckTypeId(next)
    void autosave.saveNow({ check_type_id: next })
  }

  function handleTrainingDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value || null
    setTrainingDate(next)
    void autosave.saveNow({ training_date: next })
  }

  return (
    <>
      <div className="rf-field">
        <label className="rf-lbl">Type of check</label>
        <select
          className="rf-ctl"
          value={checkTypeId ?? '__none__'}
          onChange={handleCheckTypeChange}
          disabled={locked}
        >
          <option value="__none__">— None —</option>
          {checkTypes.map((ct) => (
            <option key={ct.id} value={ct.id}>
              {ct.name}
            </option>
          ))}
        </select>
      </div>
      <div className="rf-field">
        <label className="rf-lbl">Training date</label>
        <input
          className="rf-ctl"
          type="date"
          value={trainingDate ?? ''}
          onChange={handleTrainingDateChange}
          disabled={locked}
        />
      </div>
    </>
  )
}
