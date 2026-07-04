'use client'
import { useActionState } from 'react'
import { addUser, type AddUserState } from './actions'

const initial: AddUserState = { ok: false, message: '' }
const ROLE_OPTS = [
  { value: 'examiner', label: 'Examiner' },
  { value: 'fleet_manager', label: 'Fleet Manager' },
  { value: 'admin', label: 'Admin' },
]

export function AddUserForm() {
  const [state, action, pending] = useActionState(addUser, initial)
  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label className="ax-lbl" htmlFor="email">
          Email address
        </label>
        <input
          className="ax-ctl"
          id="email"
          name="email"
          type="email"
          required
          placeholder="name@airniugini.com.pg"
        />
      </div>
      <div>
        <label className="ax-lbl">Roles</label>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {ROLE_OPTS.map((r) => (
            <label
              key={r.value}
              style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: 14 }}
            >
              <input
                type="checkbox"
                name="roles"
                value={r.value}
                defaultChecked={r.value === 'examiner'}
                style={{ accentColor: 'var(--ax-brand)', width: 15, height: 15 }}
              />
              {r.label}
            </label>
          ))}
        </div>
      </div>
      <div>
        <button disabled={pending} className="ax-btn primary">
          {pending ? 'Creating…' : 'Add user'}
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
      {state.ok && state.tempPassword && (
        <div className="ax-card" style={{ padding: 12 }}>
          <p style={{ margin: '0 0 6px', fontSize: 13 }}>
            Temporary password for <b>{state.email}</b> (shown once — have them change it under
            Account):
          </p>
          <code style={{ userSelect: 'all', fontSize: 14 }}>{state.tempPassword}</code>
        </div>
      )}
    </form>
  )
}
