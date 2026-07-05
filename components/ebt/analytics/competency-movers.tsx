import type { MoverRow } from '@/lib/ebt/analytics/queries'

/** Top-N movers by absolute change over the window, biggest movement first (either direction). */
export function topMovers(rows: MoverRow[], n: number): MoverRow[] {
  return [...rows].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, n)
}

/** Analytics C: competencies that moved most between the first and last month in the window —
 *  improving (green ▲) or declining (red ▼) — alongside the fleet trend chart. */
export function CompetencyMovers({
  rows,
  labels,
}: {
  rows: MoverRow[]
  labels: Record<string, string>
}) {
  const top = topMovers(rows, 6)
  if (top.length === 0) {
    return <div className="ax-empty">Not enough monthly history to show movement yet.</div>
  }
  return (
    <div className="ax-bars">
      {top.map((r) => {
        const improving = r.delta >= 0
        const name = labels[r.competencyCode] ?? r.competencyCode
        return (
          <div className="row" key={r.competencyCode}>
            <span className="cc" style={{ minWidth: 150 }}>
              {name}
            </span>
            <span style={{ flex: 1, fontSize: 12, color: 'var(--ax-muted)' }}>
              {r.firstAvg.toFixed(1)} → {r.lastAvg.toFixed(1)}
            </span>
            <span
              className="val"
              style={{ color: improving ? 'var(--ax-green)' : 'var(--ax-red)' }}
              aria-label={`${name} ${improving ? 'improved' : 'declined'} by ${Math.abs(r.delta).toFixed(2)}`}
            >
              {improving ? '▲' : '▼'} {Math.abs(r.delta).toFixed(2)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
