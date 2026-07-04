import Link from 'next/link'
import { getSessionUser, hasRole } from '@/lib/ebt/auth/roles'
import { listPilots, listPilotCurrency } from '@/lib/ebt/roster/queries'
import type { CurrencyBucket } from '@/lib/ebt/roster/queries'
import { buildRosterView, pilotStatusBadge } from '@/lib/ebt/roster/roster-view'

function bucketClass(b: CurrencyBucket | null): string {
  if (b === 'valid') return 'ok'
  if (b === 'expiring') return 'warn'
  if (b === 'expired') return 'bad'
  return ''
}

export default async function PilotsPage({
  searchParams,
}: {
  searchParams: Promise<{ inactive?: string }>
}) {
  const user = await getSessionUser()
  const isAdmin = hasRole(user?.role ?? null, 'admin')
  const { inactive } = await searchParams
  const showInactive = inactive === '1'
  const [pilots, currency] = await Promise.all([listPilots(), listPilotCurrency()])
  const { rows, activeCount, inactiveCount } = buildRosterView(pilots, showInactive)

  return (
    <main className="ax-main">
      <div className="ax-wrap">
        <div className="ax-pagehead">
          <div>
            <div className="ax-eyebrow">Roster</div>
            <h1>Pilots</h1>
            <div className="sub">
              {activeCount} active
              {showInactive && inactiveCount > 0 ? ` · ${inactiveCount} inactive` : ''}
            </div>
          </div>
          <div className="right">
            {inactiveCount > 0 && (
              <Link
                className="ax-btn"
                href={showInactive ? '/dashboard/ebt/pilots' : '/dashboard/ebt/pilots?inactive=1'}
              >
                {showInactive ? 'Hide inactive' : `Show inactive (${inactiveCount})`}
              </Link>
            )}
            {isAdmin && (
              <Link className="ax-btn primary" href="/dashboard/ebt/pilots/new">
                ＋ Add pilot
              </Link>
            )}
          </div>
        </div>

        <div className="ax-card ax-tablecard">
          <table className="ax-table">
            <thead>
              <tr>
                <th>Staff #</th>
                <th>Name</th>
                <th>Rank</th>
                <th>Aircraft</th>
                <th>Currency</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const c = currency.get(p.id)
                const status = pilotStatusBadge(p.employment_status)
                const medCls = bucketClass(c?.medical ?? null)
                const irCls = bucketClass(c?.ir ?? null)
                const prfCls = bucketClass(c?.proficiency ?? null)
                return (
                  <tr key={p.id}>
                    <td className="staff">{p.staff_no}</td>
                    <td>
                      <Link className="pname" href={`/dashboard/ebt/pilots/${p.id}`}>
                        {p.full_name}
                      </Link>
                    </td>
                    <td>{p.rank ?? '—'}</td>
                    <td>{p.aircraft ?? '—'}</td>
                    <td>
                      {c?.medical != null && (
                        <span className={`ax-chip ${medCls}`}>
                          <span className="cd" />
                          MED
                        </span>
                      )}
                      {c?.ir != null && (
                        <span className={`ax-chip ${irCls}`}>
                          <span className="cd" />
                          IR
                        </span>
                      )}
                      {c?.proficiency != null && (
                        <span className={`ax-chip ${prfCls}`}>
                          <span className="cd" />
                          PRF
                        </span>
                      )}
                    </td>
                    <td className="statuscell">
                      <span className={`ax-chip ${status.cls}`}>{status.label}</span>
                    </td>
                  </tr>
                )
              })}
              {pilots.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="ax-empty">No pilots yet.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
