import type { FleetObRow } from '@/lib/ebt/analytics/queries'

/** Pure: top-N OBs by observed count, desc. */
export function rankBehaviours(rows: FleetObRow[], n: number): FleetObRow[] {
  return [...rows].sort((a, b) => b.n - a.n).slice(0, n)
}

export function TopBehavioursView({
  rows,
  obLabels,
}: {
  rows: FleetObRow[]
  obLabels: Record<string, string>
}) {
  const top = rankBehaviours(rows, 5)
  if (top.length === 0) {
    return <div className="ax-empty">No observed behaviours recorded for this slice.</div>
  }
  return (
    <div className="ax-bars">
      {top.map((r) => (
        <div className="row" key={r.observableBehaviourId}>
          <span className="cc">{obLabels[r.observableBehaviourId] ?? 'OB'}</span>
          <span className="bar">
            <i style={{ width: `${r.share * 100}%`, background: 'var(--ax-amber)' }} />
          </span>
          <span className="val">{r.n}</span>
        </div>
      ))}
    </div>
  )
}
