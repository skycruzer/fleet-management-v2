import Link from 'next/link'
import type { StandingTier } from '@/lib/ebt/analytics/standing'
import { rankLabel, type PilotStanding } from '@/lib/ebt/analytics/queries'

/** Tier → display label + `ax-badge` color class. Pure → unit-tested. */
export function tierBadge(tier: StandingTier): { label: string; cls: string } {
  switch (tier) {
    case 'not_competent':
      return { label: 'Not competent', cls: 'bad' }
    case 'additional_training':
      return { label: 'Additional training', cls: 'warn' }
    case 'competent_monitor':
      return { label: 'Competent — monitor', cls: 'warn' }
    case 'effective':
      return { label: 'Effective', cls: 'ok' }
  }
}

const ORDER: Record<StandingTier, number> = {
  not_competent: 0,
  additional_training: 1,
  competent_monitor: 2,
  effective: 3,
}

export function BelowStandardPilotsTable({ pilots }: { pilots: PilotStanding[] }) {
  if (pilots.length === 0)
    return <div className="ax-empty">No pilots below standard in this slice.</div>
  const sorted = [...pilots].sort((a, b) => ORDER[a.tier] - ORDER[b.tier])
  return (
    <div className="ax-card ax-tablecard">
      <table className="ax-table">
        <thead>
          <tr>
            <th>Pilot</th>
            <th>Staff #</th>
            <th>Rank</th>
            <th>Aircraft</th>
            <th>Not competent</th>
            <th>Below effective</th>
            <th>Standing</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => {
            const b = tierBadge(p.tier)
            return (
              <tr key={p.pilotId}>
                <td>
                  <Link className="pname" href={`/dashboard/ebt/pilots/${p.pilotId}?tab=standards`}>
                    {p.fullName ?? '—'}
                  </Link>
                </td>
                <td className="staff">{p.staffNo ?? '—'}</td>
                <td>{rankLabel(p.rank)}</td>
                <td>{p.aircraftCode ?? '—'}</td>
                <td>{p.notCompetentCount}</td>
                <td>{p.belowEffectiveCount}</td>
                <td>
                  <span className={`ax-badge ${b.cls}`}>{b.label}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
