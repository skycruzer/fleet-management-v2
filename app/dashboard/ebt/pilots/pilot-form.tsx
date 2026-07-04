'use client'
import { useActionState } from 'react'
import type { PilotFormState } from './pilot-actions'

const initial: PilotFormState = { ok: false, message: '' }

export interface AircraftOption {
  id: string
  code: string
  name: string
}
export interface PilotDefaults {
  staff_no?: string
  full_name?: string
  rank?: string
  aircraft_type_id?: string | null
  employment_status?: string
}

export function PilotForm({
  action,
  aircraftTypes,
  defaults,
  submitLabel,
}: {
  action: (prev: PilotFormState, fd: FormData) => Promise<PilotFormState>
  aircraftTypes: AircraftOption[]
  defaults?: PilotDefaults
  submitLabel: string
}) {
  const [state, formAction, pending] = useActionState(action, initial)
  return (
    <form action={formAction} className="ax-card" style={{ maxWidth: '520px' }}>
      <div className="ax-bd" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label className="ax-lbl">Staff number</label>
          <input name="staff_no" required defaultValue={defaults?.staff_no} className="ax-ctl" />
        </div>
        <div>
          <label className="ax-lbl">Full name</label>
          <input name="full_name" required defaultValue={defaults?.full_name} className="ax-ctl" />
        </div>
        <div>
          <label className="ax-lbl">Rank</label>
          <input
            name="rank"
            defaultValue={defaults?.rank}
            placeholder="Captain / First Officer"
            className="ax-ctl"
          />
        </div>
        <div>
          <label className="ax-lbl">Aircraft type</label>
          <select
            name="aircraft_type_id"
            defaultValue={defaults?.aircraft_type_id ?? ''}
            className="ax-ctl"
          >
            <option value="">—</option>
            {aircraftTypes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="ax-lbl">Status</label>
          <select
            name="employment_status"
            defaultValue={defaults?.employment_status ?? 'active'}
            className="ax-ctl"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div style={{ paddingTop: '4px' }}>
          <button disabled={pending} className="ax-btn primary">
            {pending ? 'Saving…' : submitLabel}
          </button>
        </div>
        {state.message && (
          <p
            style={{
              fontSize: '13px',
              color: state.ok ? 'var(--ax-green)' : 'var(--ax-red)',
              margin: 0,
            }}
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  )
}
