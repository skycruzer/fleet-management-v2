'use client'
import { useActionState } from 'react'
import { createReport, type ReportActionState } from '../report-actions'
import { PilotCombobox, type PilotOption } from '@/components/ebt/reports/pilot-combobox'

const initial: ReportActionState = { ok: false, message: '' }

export function NewReportForm({
  pilots,
  checkTypes,
}: {
  pilots: PilotOption[]
  checkTypes: { id: string; code: string; name: string }[]
}) {
  const [state, action, pending] = useActionState(createReport, initial)
  return (
    <form action={action} className="ax-card" style={{ maxWidth: '600px', overflow: 'visible' }}>
      <div className="ax-bd" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label className="ax-lbl">Pilot</label>
          <PilotCombobox pilots={pilots} name="pilot_id" />
        </div>
        <div>
          <label className="ax-lbl">Type of check</label>
          <select name="check_type_id" className="ax-ctl">
            <option value="">—</option>
            {checkTypes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label className="ax-lbl">Training date</label>
            <input type="date" name="training_date" className="ax-ctl" />
          </div>
          <div>
            <label className="ax-lbl">Module no.</label>
            <input type="number" name="module_no" min={1} max={6} className="ax-ctl" />
          </div>
        </div>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            color: 'var(--ax-ink-2)',
            cursor: 'pointer',
          }}
        >
          <input type="checkbox" name="is_resit" /> This is a re-sit
        </label>
        <div style={{ paddingTop: '4px' }}>
          <button type="submit" disabled={pending} className="ax-btn primary">
            {pending ? 'Creating…' : 'Create report'}
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
