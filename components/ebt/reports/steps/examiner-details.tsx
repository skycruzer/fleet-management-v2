'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAutosave } from '@/lib/ebt/reports/use-autosave'
import { useFlowSave } from '@/components/ebt/reports/capture-flow'
import {
  saveExaminerDetails,
  type ExaminerDetailsPatch,
} from '@/app/dashboard/ebt/reports/report-actions'

interface Props {
  reportId: string
  name: string | null
  signOffDate: string | null
  initial: {
    ioa_number: string | null
    sim_hours: string | null
    if_hours: string | null
    sim_location: string | null
    sim_level: string | null
  }
  locked: boolean
}

export function ExaminerDetails({ reportId, name, signOffDate, initial, locked }: Props) {
  const [ioaNumber, setIoaNumber] = useState(initial.ioa_number ?? '')
  const [simHours, setSimHours] = useState(initial.sim_hours ?? '')
  const [ifHours, setIfHours] = useState(initial.if_hours ?? '')
  const [simLocation, setSimLocation] = useState(initial.sim_location ?? '')
  const [simLevel, setSimLevel] = useState(initial.sim_level ?? '')

  const flowSave = useFlowSave()

  const saveFn = useCallback(
    (patch: ExaminerDetailsPatch) => saveExaminerDetails(reportId, patch),
    [reportId]
  )

  const autosave = useAutosave<ExaminerDetailsPatch>(saveFn, { debounceMs: 600 })

  useEffect(() => {
    flowSave(autosave.state, autosave.message)
  }, [autosave.state, autosave.message, flowSave])

  function buildPatch(
    overrides: Partial<{
      ioaNumber: string
      simHours: string
      ifHours: string
      simLocation: string
      simLevel: string
    }> = {}
  ): ExaminerDetailsPatch {
    return {
      ioa_number: (overrides.ioaNumber !== undefined ? overrides.ioaNumber : ioaNumber) || null,
      sim_hours: (overrides.simHours !== undefined ? overrides.simHours : simHours) || null,
      if_hours: (overrides.ifHours !== undefined ? overrides.ifHours : ifHours) || null,
      sim_location:
        (overrides.simLocation !== undefined ? overrides.simLocation : simLocation) || null,
      sim_level: (overrides.simLevel !== undefined ? overrides.simLevel : simLevel) || null,
    }
  }

  function handleIoaNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value
    setIoaNumber(next)
    autosave.schedule(buildPatch({ ioaNumber: next }))
  }

  function handleSimHoursChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value
    setSimHours(next)
    autosave.schedule(buildPatch({ simHours: next }))
  }

  function handleIfHoursChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value
    setIfHours(next)
    autosave.schedule(buildPatch({ ifHours: next }))
  }

  function handleSimLocationChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value
    setSimLocation(next)
    autosave.schedule(buildPatch({ simLocation: next }))
  }

  function handleSimLevelChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value
    setSimLevel(next)
    autosave.schedule(buildPatch({ simLevel: next }))
  }

  return (
    <div className="rf-grid3">
      {/* NAME — read-only */}
      <div className="rf-field">
        <label className="rf-lbl">Name</label>
        <input className="rf-ctl" value={name ?? '—'} readOnly />
      </div>

      {/* IOA NUMBER */}
      <div className="rf-field">
        <label className="rf-lbl" htmlFor="ed-ioa-number">
          IOA Number
        </label>
        <input
          id="ed-ioa-number"
          className="rf-ctl"
          value={ioaNumber}
          onChange={handleIoaNumberChange}
          disabled={locked}
        />
      </div>

      {/* SIGN OFF DATE — read-only */}
      <div className="rf-field">
        <label className="rf-lbl">Sign Off Date</label>
        <input className="rf-ctl" value={signOffDate ?? '—'} readOnly />
      </div>

      {/* SIMULATOR HOURS */}
      <div className="rf-field">
        <label className="rf-lbl" htmlFor="ed-sim-hours">
          Simulator Hours
        </label>
        <input
          id="ed-sim-hours"
          className="rf-ctl"
          value={simHours}
          onChange={handleSimHoursChange}
          disabled={locked}
        />
      </div>

      {/* IF HOURS */}
      <div className="rf-field">
        <label className="rf-lbl" htmlFor="ed-if-hours">
          IF Hours
        </label>
        <input
          id="ed-if-hours"
          className="rf-ctl"
          value={ifHours}
          onChange={handleIfHoursChange}
          disabled={locked}
        />
      </div>

      {/* SIMULATOR LOCATION */}
      <div className="rf-field">
        <label className="rf-lbl" htmlFor="ed-sim-location">
          Simulator Location
        </label>
        <input
          id="ed-sim-location"
          className="rf-ctl"
          value={simLocation}
          onChange={handleSimLocationChange}
          disabled={locked}
        />
      </div>

      {/* SIMULATOR LEVEL */}
      <div className="rf-field">
        <label className="rf-lbl" htmlFor="ed-sim-level">
          Simulator Level
        </label>
        <input
          id="ed-sim-level"
          className="rf-ctl"
          value={simLevel}
          onChange={handleSimLevelChange}
          disabled={locked}
        />
      </div>
    </div>
  )
}
