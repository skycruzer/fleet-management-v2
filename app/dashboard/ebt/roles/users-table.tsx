'use client'
import { useMemo, useState, useTransition } from 'react'
import { setUserRoles, resetUserPassword, type AdminUser } from './actions'
import type { AppRole } from '@/lib/ebt/auth/roles'

const ROLE_OPTS: { value: AppRole; label: string }[] = [
  { value: 'examiner', label: 'Examiner' },
  { value: 'fleet_manager', label: 'Fleet Manager' },
  { value: 'admin', label: 'Admin' },
]

/** Synthetic accounts created by the e2e suite and seed scripts — hidden by default
 *  so the table stays usable for managing real people. */
export function isTestAccount(email: string): boolean {
  return /^(e2e|seed)\./i.test(email)
}

function UserRow({ user }: { user: AdminUser }) {
  const [roles, setRoles] = useState<AppRole[]>(user.roles)
  const [msg, setMsg] = useState('')
  const [temp, setTemp] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const toggle = (r: AppRole) =>
    setRoles((cur) => (cur.includes(r) ? cur.filter((x) => x !== r) : [...cur, r]))
  const save = () =>
    start(async () => {
      const res = await setUserRoles(user.id, roles)
      setMsg(res.message)
    })
  const reset = () =>
    start(async () => {
      const res = await resetUserPassword(user.id)
      setMsg(res.message)
      setTemp(res.ok ? (res.tempPassword ?? null) : null)
    })

  return (
    <tr>
      <td style={{ fontWeight: 600, wordBreak: 'break-all' }}>{user.email}</td>
      <td>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {ROLE_OPTS.map((r) => (
            <label
              key={r.value}
              style={{
                display: 'flex',
                gap: 6,
                alignItems: 'center',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={roles.includes(r.value)}
                onChange={() => toggle(r.value)}
                style={{ accentColor: 'var(--ax-brand)', width: 15, height: 15 }}
              />
              {r.label}
            </label>
          ))}
        </div>
      </td>
      <td style={{ whiteSpace: 'nowrap' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="ax-btn" disabled={pending} onClick={save}>
            Save roles
          </button>
          <button className="ax-btn" disabled={pending} onClick={reset}>
            Reset password
          </button>
        </div>
        {msg && <div style={{ fontSize: 12, marginTop: 6, color: 'var(--ax-muted)' }}>{msg}</div>}
        {temp && (
          <div style={{ fontSize: 12, marginTop: 4 }}>
            Temp: <code style={{ userSelect: 'all' }}>{temp}</code>
          </div>
        )}
      </td>
    </tr>
  )
}

export function UsersTable({ users }: { users: AdminUser[] }) {
  const [showTest, setShowTest] = useState(false)
  const { real, testCount } = useMemo(() => {
    const real = users.filter((u) => !isTestAccount(u.email))
    return { real, testCount: users.length - real.length }
  }, [users])
  const visible = showTest ? users : real

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 18px',
          borderBottom: '1px solid var(--ax-line)',
        }}
      >
        <span style={{ fontSize: 13, color: 'var(--ax-muted)' }}>
          {real.length} user{real.length === 1 ? '' : 's'}
          {testCount > 0 &&
            !showTest &&
            ` · ${testCount} test account${testCount === 1 ? '' : 's'} hidden`}
        </span>
        {testCount > 0 && (
          <button
            className="ax-btn"
            style={{ marginLeft: 'auto', padding: '6px 12px', fontSize: 12 }}
            onClick={() => setShowTest((v) => !v)}
          >
            {showTest ? 'Hide test accounts' : `Show test accounts (${testCount})`}
          </button>
        )}
      </div>
      <table className="ax-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Roles</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((u) => (
            <UserRow key={u.id} user={u} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
